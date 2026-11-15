// YouTube Playables: Premium rewards on PC
//
// On the YouTube mobile app a Premium account gets in-game rewards without ads.
// On youtube.com (desktop) the server sends no ad commands to Premium accounts,
// so the web client answers every "rewarded ad" request from the game with
// REJECTED (2) and the game never gets its reward.
//
// This script runs in the youtube.com page (not inside the game). It marks the
// reply port of every rewarded-ad request coming from the game, and when
// YouTube answers that request with REJECTED it changes the answer to
// REWARD_GRANTED (5), the answer a Premium account gets on the phone.
// It only acts when the account shows the YouTube Premium logo.
// Interstitial (non-reward) ads and every other message are left untouched.
//
// Debug: in the page console, window.__ytPremiumRewardsFix shows how many
// rewards were granted; set window.__ytPremiumRewardsFix.debug = true to log
// every message between YouTube and the game.
(() => {
  'use strict';
  if (window.__ytPremiumRewardsFix) return;
  const state = (window.__ytPremiumRewardsFix = { granted: 0, seen: 0, log: [], debug: false });

  const TAG = '[PremiumRewardsFix]';
  const SDK_API_REQUEST_AD = 14; // request type sent by the game SDK
  const AD_KIND_REWARDED = 2;    // 1 = interstitial, 2 = rewarded
  const RESULT_REJECTED = 2;
  const RESULT_REWARD_GRANTED = 5;

  const rewardReplyPorts = new WeakSet();

  const note = (msg, extra) => {
    let text = extra;
    try { text = typeof extra === 'string' ? extra : JSON.stringify(extra); } catch (_) {}
    state.log.push({ t: Date.now(), msg, extra: text == null ? undefined : String(text).slice(0, 500) });
    if (state.log.length > 80) state.log.shift();
    if (state.debug || !/^(incoming|outgoing)$/.test(msg)) {
      try { console.info(TAG, msg, extra ?? ''); } catch (_) {}
    }
  };

  const isPremium = () => {
    const logo = document.querySelector('ytd-topbar-logo-renderer');
    const data = logo && (logo.data || (logo.__data && logo.__data.data));
    if (data && data.iconImage) return data.iconImage.iconType === 'YOUTUBE_PREMIUM_LOGO';
    // Fallback: the logo link is titled "YouTube Premium Home" for Premium accounts.
    const link = logo && logo.querySelector('a#logo, a[title]');
    return !!link && /premium/i.test(link.getAttribute('title') || '');
  };

  const parse = (d) => {
    if (typeof d === 'string') {
      if (d[0] !== '[') return null;
      try { return JSON.parse(d); } catch (_) { return null; }
    }
    return Array.isArray(d) ? d : null;
  };

  // JSPB message: field N lives at index N-1, or in a trailing {N: value} object.
  const field = (arr, n) => {
    if (!Array.isArray(arr)) return undefined;
    const last = arr[arr.length - 1];
    if (last && typeof last === 'object' && !Array.isArray(last) && String(n) in last) return last[n];
    return arr[n - 1];
  };

  // Request shape: [14, null x11, [2, "<rewardId>"]]
  const isRewardedAdRequest = (d) => {
    const msg = parse(d);
    if (!msg || field(msg, 1) !== SDK_API_REQUEST_AD) return false;
    const adRequest = field(msg, 13);
    return Array.isArray(adRequest) && field(adRequest, 1) === AD_KIND_REWARDED;
  };

  // Reply shape: [1, [null, 1, null, null, null, [result]]]
  const patchReply = (d) => {
    const msg = parse(d);
    if (!msg) return null;
    const clone = JSON.parse(JSON.stringify(msg));
    const adResult = field(field(clone, 2), 6);
    if (!Array.isArray(adResult) || field(adResult, 1) !== RESULT_REJECTED) return null;
    adResult[0] = RESULT_REWARD_GRANTED;
    return typeof d === 'string' ? JSON.stringify(clone) : clone;
  };

  const inspect = (e) => {
    try {
      if (state.debug) note('incoming', e && e.data);
      if (e && e.ports && e.ports[0] && isRewardedAdRequest(e.data)) {
        state.seen++;
        rewardReplyPorts.add(e.ports[0]);
      }
    } catch (_) {}
  };

  // 1) Watch requests arriving from the game (YouTube listens via port.onmessage).
  const onmsg = Object.getOwnPropertyDescriptor(MessagePort.prototype, 'onmessage');
  const wrappedFor = new WeakMap();
  Object.defineProperty(MessagePort.prototype, 'onmessage', {
    configurable: true,
    enumerable: onmsg.enumerable,
    get() {
      const h = onmsg.get.call(this);
      return (h && h.__original) || h;
    },
    set(fn) {
      if (typeof fn !== 'function') return onmsg.set.call(this, fn);
      let w = wrappedFor.get(fn);
      if (!w) {
        w = function (e) { inspect(e); return fn.call(this, e); };
        w.__original = fn;
        wrappedFor.set(fn, w);
      }
      return onmsg.set.call(this, w);
    },
  });

  const origAdd = MessagePort.prototype.addEventListener;
  const origRemove = MessagePort.prototype.removeEventListener;
  const listenerWrap = new WeakMap();
  MessagePort.prototype.addEventListener = function (type, listener, opts) {
    if (type === 'message' && typeof listener === 'function') {
      let w = listenerWrap.get(listener);
      if (!w) {
        w = function (e) { inspect(e); return listener.call(this, e); };
        listenerWrap.set(listener, w);
      }
      return origAdd.call(this, type, w, opts);
    }
    return origAdd.call(this, type, listener, opts);
  };
  MessagePort.prototype.removeEventListener = function (type, listener, opts) {
    if (type === 'message' && typeof listener === 'function' && listenerWrap.has(listener)) {
      return origRemove.call(this, type, listenerWrap.get(listener), opts);
    }
    return origRemove.call(this, type, listener, opts);
  };

  // 2) Fix YouTube's answer to those requests.
  const origPost = MessagePort.prototype.postMessage;
  MessagePort.prototype.postMessage = function (data, ...rest) {
    if (state.debug) note('outgoing', data);
    if (rewardReplyPorts.has(this)) {
      rewardReplyPorts.delete(this);
      try {
        if (isPremium()) {
          const fixed = patchReply(data);
          if (fixed) {
            state.granted++;
            note('rewarded ad: REJECTED -> REWARD_GRANTED');
            data = fixed;
          } else {
            note('rewarded ad reply left as is', data);
          }
        } else {
          note('not a Premium account, reply left as is');
        }
      } catch (err) {
        note('error while patching reply', String(err));
      }
    }
    return origPost.call(this, data, ...rest);
  };

  note('installed');
})();
