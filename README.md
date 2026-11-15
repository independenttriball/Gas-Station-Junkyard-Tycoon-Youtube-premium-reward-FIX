# YouTube Premium reward fix for Gas Station: Junkyard Tycoon (and other YouTube Playables) on PC

**English** · [Русский](#русский)

With YouTube Premium, the YouTube app on a phone gives you in-game "watch an ad" rewards for free, with no ad.
On a PC (youtube.com in a browser) the same buttons do nothing: the reward is never given.
This fix makes rewards work on PC the same way they work on the phone.

It was made for **Gas Station: Junkyard Tycoon**, but it works for any game on [YouTube Playables](https://www.youtube.com/playables).

## Install

Pick one.

### Option 1: userscript (Chrome, Edge, Firefox, Opera, Brave)

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open **[yt-playables-premium-rewards.user.js](https://raw.githubusercontent.com/independenttriball/Gas-Station-Junkyard-Tycoon-Youtube-premium-reward-FIX/main/yt-playables-premium-rewards.user.js)** and click **Install**.
3. Reload the game tab (F5).

The userscript updates itself from this repository.

> Chrome / Edge: if the script does not run, open the Tampermonkey extension details and turn on **Allow User Scripts** (or Developer mode on the extensions page). Recent Chrome versions require it.

### Option 2: browser extension (Chrome, Edge, Opera, Brave)

1. Download **[yt-playables-premium-rewards-extension.zip](https://github.com/independenttriball/Gas-Station-Junkyard-Tycoon-Youtube-premium-reward-FIX/releases/latest/download/yt-playables-premium-rewards-extension.zip)** and unzip it.
2. Open `chrome://extensions` (Edge: `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and choose the unzipped `extension` folder.
4. Reload the game tab (F5).

## Check that it works

Open the browser console on the game page (F12 → Console). Each time you take a reward you will see:

```
[PremiumRewardsFix] rewarded ad: REJECTED -> REWARD_GRANTED
```

`window.__ytPremiumRewardsFix.granted` in the console shows how many rewards were given.

## Why rewards don't work on PC

A Playable runs in an iframe and asks the YouTube page for a rewarded ad through the Playables SDK.

- **Phone app + Premium:** the app answers "reward granted" right away.
- **youtube.com + Premium:** YouTube does not send ad commands to Premium accounts, so the web page has no ad to show and answers **REJECTED** (code `2`). The game gets no reward.

## What the fix does

The script runs in the youtube.com page, not inside the game:

1. It notices when the game asks for a **rewarded** ad (SDK request `14`, ad type `2`).
2. If YouTube answers that request with REJECTED (`2`), it changes the answer to REWARD_GRANTED (`5`), the answer the phone app gives.
3. It only does this when the YouTube logo in the top bar is the **Premium** logo.
4. Interstitial (non-reward) ads and every other message are not touched.

Nothing is sent anywhere, and the script does not touch your account or game saves.
If YouTube changes the Playables protocol, the script simply stops matching and passes everything through unchanged.

## For developers

```
node test/simulate.test.js   # simulates the page <-> game messaging and checks the answers
node scripts/build.js        # rebuilds the userscript from extension/fix.js
```

## Disclaimer

Unofficial. Not affiliated with YouTube, Google, or the game's developer.
It is meant for YouTube Premium accounts and does nothing without Premium. Use at your own risk.

---

## Русский

С YouTube Premium в приложении YouTube на телефоне награды «за просмотр рекламы» в играх выдаются сразу, без рекламы.
На ПК (youtube.com в браузере) эти же кнопки не работают: награда не приходит.
Этот фикс делает так, чтобы на ПК награды выдавались так же, как на телефоне.

Сделан для **Gas Station: Junkyard Tycoon**, но работает для любой игры [YouTube Playables](https://www.youtube.com/playables).

### Установка

Выберите один вариант.

**Вариант 1: юзерскрипт (Chrome, Edge, Firefox, Opera, Brave)**

1. Установите [Tampermonkey](https://www.tampermonkey.net/) или [Violentmonkey](https://violentmonkey.github.io/).
2. Откройте **[yt-playables-premium-rewards.user.js](https://raw.githubusercontent.com/independenttriball/Gas-Station-Junkyard-Tycoon-Youtube-premium-reward-FIX/main/yt-playables-premium-rewards.user.js)** и нажмите **Установить**.
3. Обновите вкладку с игрой (F5).

Скрипт сам обновляется из этого репозитория.

> Chrome / Edge: если скрипт не срабатывает, откройте сведения о расширении Tampermonkey и включите **Разрешить пользовательские скрипты** (или режим разработчика на странице расширений). Новые версии Chrome этого требуют.

**Вариант 2: расширение для браузера (Chrome, Edge, Opera, Brave)**

1. Скачайте **[yt-playables-premium-rewards-extension.zip](https://github.com/independenttriball/Gas-Station-Junkyard-Tycoon-Youtube-premium-reward-FIX/releases/latest/download/yt-playables-premium-rewards-extension.zip)** и распакуйте.
2. Откройте `chrome://extensions` (в Edge: `edge://extensions`) и включите **Режим разработчика**.
3. Нажмите **Загрузить распакованное** и выберите распакованную папку `extension`.
4. Обновите вкладку с игрой (F5).

### Как проверить

Откройте консоль на странице игры (F12 → Console). При каждой полученной награде появится строка:

```
[PremiumRewardsFix] rewarded ad: REJECTED -> REWARD_GRANTED
```

Счётчик выданных наград: `window.__ytPremiumRewardsFix.granted`.

### Почему на ПК награды не работают

Игра работает во фрейме и просит у страницы YouTube «рекламу за награду» через Playables SDK.

- **Приложение на телефоне + Premium:** приложение сразу отвечает «награда выдана».
- **youtube.com + Premium:** YouTube не присылает Premium-аккаунтам команды показа рекламы, поэтому страница отвечает игре **REJECTED** (код `2`), и награды нет.

### Что делает фикс

Скрипт работает на странице youtube.com, а не внутри игры:

1. Замечает, когда игра просит **рекламу за награду** (запрос SDK `14`, тип рекламы `2`).
2. Если YouTube отвечает на этот запрос «отклонено» (`2`), меняет ответ на «награда выдана» (`5`), как отвечает приложение на телефоне.
3. Делает это только если в шапке YouTube логотип **Premium**.
4. Обычную (межстраничную) рекламу и остальные сообщения не трогает.

Скрипт никуда ничего не отправляет и не трогает ваш аккаунт и сохранения игры.
Если YouTube изменит протокол Playables, скрипт просто перестанет срабатывать и пропустит всё без изменений.

### Отказ от ответственности

Неофициальный фикс, не связан с YouTube, Google или разработчиком игры.
Рассчитан на аккаунты с YouTube Premium и без Premium ничего не делает. Используйте на свой страх и риск.
