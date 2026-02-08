# ModeSwitch

Chrome extension to switch browser modes with one click.

## Features

- **Create modes**: Save your current tabs as a named mode
- **Activate modes**: Open all saved URLs with one click
- **Customize**: Choose icons for each mode (80+ options)
- **Flexible**: Open in current window or new window
- **Clean up**: Close all tabs option
- **Pro version**: Unlimited modes with license key

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `extension` folder

## Project Structure

```
extension/
  manifest.json         # Chrome Extension Manifest V3
  popup/
    popup.html          # Main UI
    popup.js            # UI logic
    popup.css           # Styles
  core/
    storage.js          # Chrome storage API
    modes.js            # CRUD operations
    activate.js         # Tab management
    license.js          # Pro license system
  assets/
    icon16.png
    icon48.png
    icon128.png
```

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Modes | 2 | Unlimited |
| Icons | All | All |
| Open in new window | Yes | Yes |

## License

MIT
