# Compliance Analysis Feature - Usage Guide

## Overview

The compliance analysis feature extends CookieLens to automatically evaluate websites against privacy compliance frameworks (GDPR, CCPA, SOC2, etc.).

## Features

- ✅ Automated compliance checking for GDPR and CCPA
- ✅ Cookie security analysis (Secure, httpOnly, sameSite flags)
- ✅ Third-party service risk assessment
- ✅ Actionable recommendations for compliance improvement
- ✅ Compliance scoring per framework

## Quick Start

### 1. Install Dependencies

No additional dependencies needed - the feature works with existing setup!

```bash
cd backend
# If you haven't installed dependencies yet:
pip install -r requirements.txt
```

### 2. (Optional) Configure Vanta Integration

If you want to connect to real Vanta API:

1. Create Vanta OAuth credentials from [Vanta's developer dashboard](https://app.vanta.com)
2. Copy `vanta-credentials.env.example` to `vanta-credentials.env`
3. Add your credentials:
```json
{
  "client_id": "your_actual_client_id",
  "client_secret": "your_actual_client_secret"
}
```
4. Set environment variable:
```bash
export VANTA_ENV_FILE="/absolute/path/to/vanta-credentials.env"
```

**Note**: Currently the feature works with mock data even without Vanta credentials, so you can test it immediately!

### 3. Start the Server

```bash
python app.py
```

Server starts on `http://localhost:8000`

## API Usage

### Endpoint: POST /scan-with-compliance

Scans a website and analyzes compliance with privacy frameworks.

#### Request

```bash
curl -X POST "http://localhost:8000/scan-with-compliance" \
  -H "Content-Type: application/json" \
  -d '{
    "web_link": "https://example.com",
    "frameworks": ["gdpr", "ccpa"]
  }'
```

**Parameters:**
- `web_link` (required): URL of the website to scan
- `frameworks` (optional): Array of framework IDs to check. Defaults to `["gdpr", "ccpa"]`

Available frameworks: `gdpr`, `ccpa`, `soc2`

#### Response Structure

```json
{
  "scan_results": {
    "url": "https://example.com",
    "scannedAt": "2025-10-10T12:00:00.000000",
    "cookies": [...],
    "localStorage": {...},
    "thirdParties": [...],
    "humanReadableAnalysis": "..."
  },
  "compliance_analysis": {
    "gdpr": {
      "framework": "GDPR",
      "score": 65.5,
      "status": "needs_improvement",
      "passed_controls": [
        "Cookie consent mechanism detected",
        "All cookies have 'Secure' flag set"
      ],
      "failed_controls": [
        "2 session cookie(s) missing 'httpOnly' flag",
        "5 cookie(s) missing 'sameSite' attribute"
      ],
      "warnings": [
        "Detected 8 third-party service(s)"
      ],
      "recommendations": [
        "Set 'httpOnly' flag on session cookies to prevent XSS attacks",
        "Set 'sameSite' attribute (Lax or Strict) on cookies to prevent CSRF attacks",
        "Document these third-party services in your privacy policy"
      ]
    },
    "ccpa": {
      "framework": "CCPA",
      "score": 70.0,
      "status": "needs_improvement",
      ...
    }
  },
  "third_party_risks": [
    {
      "domain": "google-analytics.com",
      "category": "Analytics",
      "risk_level": "low",
      "recommendation": "Review data processing agreement with google-analytics.com"
    },
    {
      "domain": "facebook.com",
      "category": "Advertising",
      "risk_level": "medium",
      "recommendation": "Review data processing agreement with facebook.com"
    }
  ],
  "overall_summary": {
    "overall_score": 67.8,
    "total_passed": 15,
    "total_failed": 8,
    "total_warnings": 5,
    "frameworks_analyzed": 2
  }
}
```

## Frontend Integration Example

```javascript
async function scanWithCompliance(webLink, frameworks = ['gdpr', 'ccpa']) {
  try {
    const response = await fetch('http://localhost:8000/scan-with-compliance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        web_link: webLink,
        frameworks: frameworks
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Display compliance results
    console.log('Overall Score:', data.overall_summary.overall_score);
    console.log('GDPR Status:', data.compliance_analysis.gdpr.status);
    console.log('Recommendations:', data.compliance_analysis.gdpr.recommendations);
    
    return data;
    
  } catch (error) {
    console.error('Compliance scan failed:', error);
    throw error;
  }
}

// Usage
scanWithCompliance('https://openai.com')
  .then(results => {
    // Display results in UI
    displayComplianceReport(results);
  });
```

## Understanding Results

### Compliance Status
- **compliant** (score ≥ 80): Website meets most compliance requirements
- **needs_improvement** (score 60-79): Some compliance issues need attention
- **non_compliant** (score < 60): Significant compliance gaps exist

### Risk Levels
- **low**: Standard services, minimal privacy concerns
- **medium**: Services that process user data, needs review
- **high**: Services with known security issues or extensive data access

## Testing Examples

### Test 1: Basic GDPR Compliance Check
```bash
curl -X POST "http://localhost:8000/scan-with-compliance" \
  -H "Content-Type: application/json" \
  -d '{"web_link": "https://openai.com"}'
```

### Test 2: Multi-Framework Check
```bash
curl -X POST "http://localhost:8000/scan-with-compliance" \
  -H "Content-Type: application/json" \
  -d '{
    "web_link": "https://github.com",
    "frameworks": ["gdpr", "ccpa", "soc2"]
  }'
```

### Test 3: CCPA Only
```bash
curl -X POST "http://localhost:8000/scan-with-compliance" \
  -H "Content-Type: application/json" \
  -d '{
    "web_link": "https://stripe.com",
    "frameworks": ["ccpa"]
  }'
```

## Interactive API Documentation

Visit these URLs when server is running:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Architecture

```
User Request
    ↓
POST /scan-with-compliance
    ↓
scan_website() - Scan cookies, localStorage, third-parties
    ↓
ComplianceAnalyzer.analyze_compliance()
    ↓
VantaClient.get_privacy_controls() - Get framework requirements
    ↓
Check each control:
  - Cookie consent
  - Secure flag
  - httpOnly flag
  - sameSite attribute
  - Third-party disclosure
    ↓
Calculate compliance score
    ↓
Return comprehensive report
```

## Troubleshooting

### Issue: "Vanta client not configured" warning
**Solution**: This is normal! The feature works with mock compliance data. If you want real Vanta integration, configure `VANTA_ENV_FILE`.

### Issue: Scan takes too long
**Solution**: Website scanning can take 30-90 seconds depending on page complexity and Claude API response time. This is expected.

### Issue: Score seems incorrect
**Solution**: The current implementation uses simplified compliance checks. For production, you'd need more sophisticated detection logic and actual Vanta API integration.

## Next Steps

To enhance this feature:
1. Connect to real Vanta MCP Server (replace mock data in `vanta_client.py`)
2. Add more sophisticated cookie consent detection
3. Implement custom compliance rules per industry
4. Add historical tracking of compliance scores
5. Generate PDF compliance reports

## Support

For questions or issues, check:
- Main API docs: `API_USAGE.md`
- Interactive docs: http://localhost:8000/docs

