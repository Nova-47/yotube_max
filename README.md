# YouTube Max

A Chrome extension that expands the YouTube player to fill your entire browser window — without going OS fullscreen. Your browser tabs and address bar stay visible, making it perfect for multitasking while watching.

Snap the browser window to one half of your screen, put YouTube Max on the right and your notes or docs on the left — watch and work at the same time.

![YouTube Max Demo](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Version](https://img.shields.io/badge/version-1.2.0-orange)

---

## Features

- **Windowed Fullscreen** — player fills 100% of the browser viewport
- **Player button** — icon in the YouTube control bar, next to the fullscreen button
- **Keyboard shortcut** — press `W` on any YouTube watch page
- **Global shortcut** — `Alt+W` from anywhere in the browser
- **Popup toggle** — click the extension icon for a quick on/off switch
- **Auto-restore** — remembers state across page navigations

---

## Installation

> The extension is not yet on the Chrome Web Store. Load it manually in developer mode.

1. Download or clone this repository
   ```
   git clone https://github.com/your-username/youtube-max.git
   ```

2. Open Chrome and go to `chrome://extensions`

3. Enable **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the `youtube-max` folder

5. Navigate to any YouTube video and press `W`

---

## Usage

| Action | Description |
|--------|-------------|
| `W` | Toggle windowed fullscreen on the current video |
| `Alt+W` | Toggle from any tab |
| Click **⛶** in player controls | Toggle via the button next to the fullscreen icon |
| Click **✕** (top-right overlay) | Exit windowed fullscreen |
| Extension icon → toggle switch | On/off from the popup |

> **Note:** The native YouTube fullscreen (`F` key) still works as normal. `W` is a separate, non-conflicting shortcut.

---

## How It Works

YouTube Max injects CSS that:
- Hides the header, sidebar, and video metadata
- Pins `ytd-player` to `position: fixed; inset: 0` filling the full viewport
- Scopes all changes under a single HTML class, making toggle instant and clean

The `W` key is intercepted at `document_start` in the page's main world, before YouTube registers its own keyboard listeners, so there is no conflict.

---

## File Structure

```
youtube-max/
├── manifest.json        # Manifest V3
├── key_interceptor.js   # Keyboard hook (document_start, MAIN world)
├── content.js           # CSS injection + player button + toggle logic
├── content.css          # Transition styles
├── background.js        # Global shortcut (Alt+W) handler
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Changelog

### v1.2.0
- Feature: Smooth animations on toggle — player expands from its natural position to fullscreen (300ms, Material Design easing), UI elements fade out simultaneously
- Feature: Animated exit via dark overlay fade (150ms in + 150ms out)
- Feature: Close button fades in smoothly on appear

### v1.1.0
- Fix: Alt+W shortcut and popup now work correctly (missing `tabs` permission added)
- Fix: Entering OS fullscreen while in windowed fullscreen no longer breaks the control bar
- Fix: Popup toggle stays in sync when state is changed via `W` key or player button
- Fix: MutationObserver no longer accumulates across SPA navigations
- Fix: Windowed fullscreen state is now restored when navigating to a new video
- Fix: `sendMessage` errors are now handled gracefully

### v1.0.0
- Initial release

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

[MIT](LICENSE)
