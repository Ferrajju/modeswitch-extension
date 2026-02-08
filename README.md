# ModeSwitch

ModeSwitch is a Chrome extension that lets you save groups of tabs as "modes" (Work, Study, Leisure) and open or close them with a single click.

## Features

- **Create modes** by capturing your current tabs or adding URLs manually
- **Open modes** in the current window or a new window
- **Close modes** with one click, closing only the tabs that belong to that mode
- **Automatic detection** of active modes across all windows
- **Local data storage** - no servers, no accounts needed

## How it works

1. Click the extension icon to open the popup
2. Click "Create New Mode" to save your current tabs or add URLs manually
3. Give your mode a name and choose an icon
4. Click "Open" to launch all tabs from that mode
5. Click "Close" to close only the tabs belonging to that mode

## Privacy

ModeSwitch does not collect or send any data. All information is stored locally in your browser using `chrome.storage.local`. See [PRIVACY.md](PRIVACY.md) for details.

## Permissions

- **storage**: To save your modes locally
- **tabs**: To capture, open, and close tabs

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual installation (Developer mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` folder

## Status

MVP stable, tested locally.

## License

All rights reserved.
