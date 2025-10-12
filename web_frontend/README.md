# 🍪 CookieLens Web Frontend

A modern React web application for scanning websites and analyzing cookie compliance.

## ✨ Features

- 🔍 **Website Scanning** - Enter any URL to scan for cookies and trackers
- 🤖 **AI Analysis** - Human-readable explanations powered by Claude AI
- 🔒 **Compliance Check** - Automatic GDPR & CCPA compliance analysis
- 📊 **Visual Reports** - Beautiful UI showing all scan results
- 🌐 **Third-Party Tracking** - Detect and categorize third-party services

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Backend API running on `http://localhost:8000`

### Installation

```bash
cd web_frontend
npm install
```

### Development

```bash
npm run dev
```

The app will start at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## 🎯 Usage

1. **Enter URL**: Type the website URL you want to scan
2. **Click Scan**: Wait 30-90 seconds for results
3. **View Analysis**: See AI-generated privacy analysis
4. **Expand Compliance**: Click to view detailed GDPR/CCPA compliance scores

## 📁 Project Structure

```
web_frontend/
├── src/
│   ├── App.jsx           # Main application component
│   ├── App.css           # Application styles
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies
└── README.md            # This file
```

## 🔧 Configuration

### Backend API Endpoint

The app connects to the backend at `http://localhost:8000`. To change this, modify the API URL in `src/App.jsx`:

```javascript
const response = await axios.post('http://localhost:8000/scan-with-compliance', {
  web_link: url,
  frameworks: ['gdpr', 'ccpa']
})
```

### Proxy Configuration

For development, Vite proxy is configured in `vite.config.js` to handle CORS:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true
    }
  }
}
```

## 🎨 UI Features

### Main Components

1. **URL Input** - Large input field with scan button
2. **Scan Summary** - Quick overview of cookies, third-parties, and scan time
3. **AI Analysis** - Human-readable privacy risk assessment
4. **Compliance Analysis** (Collapsible) - Detailed GDPR/CCPA reports
5. **Third-Party Risks** - Grid view of detected third-party services

### Status Colors

- 🟢 **Green** - Compliant (score ≥ 80%)
- 🟡 **Yellow** - Needs Improvement (score 60-79%)
- 🔴 **Red** - Non-Compliant (score < 60%)

## 🔌 API Integration

The frontend expects this response structure from `/scan-with-compliance`:

```json
{
  "scan_results": {
    "url": "https://example.com",
    "scannedAt": "2025-10-10T21:57:33.177260",
    "cookies": [...],
    "thirdParties": [...],
    "humanReadableAnalysis": "..."
  },
  "compliance_analysis": {
    "gdpr": {
      "framework": "GDPR",
      "score": 65.5,
      "status": "needs_improvement",
      "passed_controls": [...],
      "failed_controls": [...],
      "warnings": [...],
      "recommendations": [...]
    },
    "ccpa": {...}
  },
  "third_party_risks": [...],
  "overall_summary": {
    "overall_score": 67.8,
    "total_passed": 15,
    "total_failed": 8,
    "total_warnings": 5,
    "frameworks_analyzed": 2
  }
}
```

## 🐛 Troubleshooting

### Backend Connection Error

**Problem**: "Failed to scan website" error  
**Solution**: Ensure backend is running on `http://localhost:8000`

```bash
cd backend
python app.py
```

### CORS Issues

**Problem**: Cross-origin request blocked  
**Solution**: Backend must allow CORS from `localhost:3000`

Check `backend/app.py` for CORS configuration:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Slow Scanning

**Problem**: Scan takes too long  
**Expected**: Website scanning takes 30-90 seconds depending on complexity

## 🌟 Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **CSS3** - Modern styling with animations

## 📝 License

MIT License - See main project LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ using Claude AI, Vanta, Semgrep & Puppeteer

