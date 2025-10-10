# CookieLens 🍪

A Chrome/Edge MV3 extension that provides AI-powered privacy analysis for websites. Automatically analyzes cookie usage, third-party services, and data collection practices using Claude AI, then presents findings in a user-friendly corner modal.

## ✨ Features

- **AI-Powered Analysis**: Uses Claude AI to analyze website privacy practices
- **Corner Modal**: Non-intrusive bottom-right corner modal for better UX
- **Real-time Scanning**: Scans websites using Playwright automation
- **Comprehensive Reports**: Detailed analysis of cookies, localStorage, and third-party services
- **Download Reports**: Save full analysis results as JSON files
- **Backend Integration**: FastAPI backend with AWS Bedrock Claude integration
- **Auto-Detection**: Automatically shows analysis modal on page load
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

1. **Backend Server**: Start the FastAPI backend server
   ```bash
   cd backend
   python app.py
   ```
   Server will run on `http://localhost:8000`

2. **AWS Configuration**: Ensure AWS credentials are configured for Claude AI access

### Installation

1. Go to `chrome://extensions` (or `edge://extensions` for Edge)
2. Enable **Developer Mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `frontend/` folder
5. The extension should now appear in your extensions list

### Usage

1. **Start Backend**: Ensure the backend server is running (`python backend/app.py`)
2. **Visit Website**: Go to any website you want to analyze
3. **Auto-Analysis**: CookieLens will automatically show the analysis modal in the bottom-right corner
4. **Analyze**: Click "Analyze This Site" to start the privacy analysis
5. **View Results**: Review the AI-generated privacy analysis
6. **Download Report**: Click "Download Full Report" to save detailed results

## 📋 What it does

- **Website Scanning**: Uses Playwright to scan websites for privacy-related elements
- **AI Analysis**: Leverages Claude AI to generate human-readable privacy analysis
- **Comprehensive Detection**: Identifies cookies, localStorage, third-party services, and tracking scripts
- **User-Friendly Reports**: Presents analysis in an easy-to-understand format
- **Non-Intrusive Interface**: Corner modal allows users to continue browsing while analysis runs
- **Detailed Reports**: Provides downloadable JSON reports with full analysis data

## 🧪 Testing

### Prerequisites
1. **Backend Running**: Ensure `python backend/app.py` is running on port 8000
2. **AWS Configured**: Verify AWS credentials are set up for Claude AI

### Recommended Test Sites
- `https://example.com` (simple test)
- `https://www.bbc.com` (complex site)
- `https://www.cnn.com` (news site)
- `https://www.theguardian.com` (media site)

### Test Steps
1. **Start Backend**: Run `python backend/app.py` in the backend directory
2. **Load Extension**: Load the frontend folder as an unpacked extension
3. **Visit Website**: Go to any test website
4. **Wait for Modal**: CookieLens modal should appear in bottom-right corner
5. **Analyze**: Click "Analyze This Site" button
6. **Observe Loading**: Watch the loading modal with progress steps
7. **Review Results**: Check the AI-generated analysis
8. **Download Report**: Click "Download Full Report" to save JSON

### Expected Behavior
- Modal appears automatically in bottom-right corner
- Loading modal shows analysis progress
- AI analysis completes in 10-30 seconds
- Results displayed in user-friendly format
- JSON report downloads to computer

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

## 🚨 Limitations & Known Issues

### Current Limitations
- **Prompt Tuning Needed**: The Claude AI prompt requires fine-tuning for better analysis accuracy
- **Analysis Quality**: AI analysis may be generic and needs more specific privacy insights
- **Backend Dependency**: Requires local backend server running for analysis
- **AWS Costs**: Each analysis incurs AWS Bedrock API costs
- **Analysis Time**: Takes 10-30 seconds per analysis due to Playwright scanning

### Prompt Tuning Requirements
The current Claude AI prompt in `backend/lambda_function.py` needs refinement to:
- **Improve Accuracy**: Generate more accurate privacy risk assessments
- **Better Categorization**: Better classify cookies and third-party services
- **Specific Insights**: Provide more actionable privacy recommendations
- **Risk Scoring**: Implement consistent privacy risk scoring system
- **Language Support**: Optimize for different languages and regions

### Technical Debt
- **Error Handling**: Improve error handling for failed analyses
- **Rate Limiting**: Implement rate limiting for API calls
- **Caching**: Add caching for repeated analyses
- **Performance**: Optimize Playwright scanning performance

## 🔒 Privacy

- **Data Processing**: Website URLs are sent to local backend for analysis
- **AWS Integration**: Analysis data is processed by Claude AI via AWS Bedrock
- **No Personal Data**: Only website structure and cookie information is analyzed
- **Local Backend**: All processing happens on your local machine
- **Open Source**: Code is available for review

## 🛠️ Development

### Frontend (Chrome Extension)
- `frontend/manifest.json`: Extension configuration
- `frontend/content/content.js`: Main content script with modal and API integration
- `frontend/content/modal.css`: Styling for the corner modal
- `frontend/background/service-worker.js`: Background service worker
- `frontend/options/`: Settings page for user preferences

### Backend (FastAPI + Claude AI)
- `backend/app.py`: FastAPI server for local development
- `backend/lambda_function.py`: Core analysis logic with Claude AI integration
- `backend/requirements.txt`: Python dependencies
- `backend/Dockerfile`: Docker configuration for deployment

### Key Components
- **Corner Modal**: Non-intrusive bottom-right positioning
- **Playwright Integration**: Automated website scanning
- **Claude AI Analysis**: AWS Bedrock integration for privacy analysis
- **Real-time Processing**: Live analysis with progress indicators

## 🐛 Troubleshooting

### Common Issues
- **Modal not appearing**: Check that the extension is loaded and refresh the page
- **Analysis fails**: Ensure backend server is running on port 8000
- **AWS errors**: Verify AWS credentials are configured correctly
- **Slow analysis**: Analysis takes 10-30 seconds, this is normal
- **Empty results**: Check backend logs for Playwright or Claude AI errors

### Debug Steps
1. **Check Backend**: Verify `python backend/app.py` is running
2. **Check Console**: Open F12 → Console for error messages
3. **Check Network**: Look for failed requests to localhost:8000
4. **Check AWS**: Verify AWS credentials and Bedrock access
5. **Check Logs**: Review backend terminal output for errors

## 📊 Version History

### v1.1.0 (Current)
- **Corner Modal**: Moved analysis modal to bottom-right corner for better UX
- **Non-Intrusive Design**: Users can browse while analysis runs
- **Enhanced Loading**: Improved loading modal with progress steps
- **Responsive Design**: Mobile-friendly corner modal
- **Close Button**: Added X button for easy modal dismissal

### v1.0.0
- **Initial Release**: Basic privacy analysis with Claude AI
- **Backend Integration**: FastAPI + Playwright + AWS Bedrock
- **Auto-Detection**: Automatic modal display on page load
- **Report Download**: JSON report generation and download

## 📄 License

MIT License - Feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.
