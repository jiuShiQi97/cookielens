# CookieLens 🍪

A Chrome/Edge MV3 extension that intercepts cookie banners and provides transparent explanations before accepting cookies. Shows what data is collected and by whom, then lets you choose to accept all or reject non-essential cookies.

## ✨ Features

- **Auto-detection**: Automatically detects cookie banners on page load
- **Manual detection**: Intercepts clicks on "Accept" buttons
- **Policy extraction**: Extracts and saves cookie policy information locally
- **Cookie blocking**: Uses Declarative Net Request to block analytics/marketing cookies
- **Privacy-focused**: Local analysis only; no data collection
- **Multi-language**: Supports English and Chinese banner detection

## 🚀 Quick Start

### Installation

1. Go to `chrome://extensions` (or `edge://extensions` for Edge)
2. Enable **Developer Mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `cookielens-extension/` folder
5. The extension should now appear in your extensions list

### Usage

#### Method 1: Auto-Detection (Recommended)
1. Enable auto-detection in settings (Options → Enable auto-detection)
2. Visit any website with a cookie banner
3. CookieLens will automatically detect the banner and show the explanation modal
4. Click "Extract Policy" to save cookie information locally

#### Method 2: Manual Click
1. Visit any website with a cookie banner
2. Click the "Accept" or "Agree" button
3. CookieLens will show a modal explaining what cookies will be set
4. Choose your preferred option

## 📋 What it does

- **Intercepts cookie banners**: Detects common "Accept" buttons on cookie consent banners
- **Shows explanations**: Displays which services collect data and what types of data they collect
- **Extracts policies**: Saves cookie policy information to local files
- **Blocks non-essential**: Uses Declarative Net Request to block analytics and marketing cookies
- **Privacy-focused**: Only analyzes page structure, never collects personal data

## 🧪 Testing

### Recommended Test Sites
- `https://www.bbc.com`
- `https://www.cnn.com`
- `https://www.theguardian.com`
- `https://m.yami.com`

### Test Steps
1. Visit any website with a cookie banner
2. Wait for the CookieLens modal to appear
3. Click "Extract Policy" to save cookie information
4. Check your downloads folder for the JSON file
5. Open Developer Tools (F12) → Console to see logs

### Expected Behavior
- Modal appears automatically or when clicking "Accept"
- Policy extraction saves data locally
- Console shows detailed logs
- JSON file downloads to your computer

## ⚙️ Settings

Access settings by clicking the extension icon or going to `chrome://extensions` → CookieLens → Options.

- **Auto-Detection**: Automatically show explanation modal when cookie banners are detected
- **Default Behavior**: Enable automatic blocking of non-essential cookies
- **Language**: Choose interface language (currently English only)

## 🔧 Technical Details

### Banner Detection
- **Auto-detection**: Automatically detects cookie banners on page load
- **Manual detection**: Intercepts clicks on "Accept" buttons
- Supports multiple languages (English, Chinese)
- Recognizes popular CMPs (OneTrust, Cookiebot, etc.)

### Policy Extraction
- Extracts current page cookies
- Identifies third-party scripts
- Finds policy links
- Captures banner text
- Saves data locally as JSON

### Cookie Blocking
- Uses Chrome's Declarative Net Request API
- Blocks common analytics and marketing domains
- Maintains site functionality while protecting privacy

## 🚨 Limitations

- **Heuristic-based**: Uses pattern matching to detect banners and services
- **Best-effort**: May not catch all cookie banners or third-party services
- **No backend**: All analysis happens locally in your browser
- **Placeholder icons**: Extension uses simple placeholder icons

## 🔒 Privacy

- **No data collection**: Extension never sends data to external servers
- **Local analysis only**: All processing happens in your browser
- **No cookie values**: Only analyzes cookie names and page structure
- **Open source**: Code is available for review

## 🛠️ Development

The extension is built with vanilla JavaScript and follows Chrome extension best practices:

- `manifest.json`: Extension configuration
- `background/service-worker.js`: Manages DNR rules and settings
- `content/content.js`: Detects banners and shows modal
- `content/explain.js`: Analyzes page and generates explanations
- `content/dnr-rules.json`: Blocking rules for non-essential cookies
- `options/`: Settings page for user preferences

## 🐛 Troubleshooting

- **Modal not appearing**: Try refreshing the page and clicking the banner again
- **Blocking not working**: Check that the extension has necessary permissions
- **Policy extraction fails**: Check console for error messages
- **Site breaks**: Use "Site's original options" to proceed normally

## 📄 License

MIT License - Feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.
