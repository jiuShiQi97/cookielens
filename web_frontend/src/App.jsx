import React, { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [showCompliance, setShowCompliance] = useState(false)

  const handleScan = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setError(null)
    setScanResult(null)
    setShowCompliance(false)

    try {
      const response = await axios.post('http://localhost:8000/scan-with-compliance', {
        web_link: url,
        frameworks: ['gdpr', 'ccpa']
      })

      setScanResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to scan website')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan()
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant':
        return '#10b981'
      case 'needs_improvement':
        return '#f59e0b'
      case 'non_compliant':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'compliant':
        return '✅'
      case 'needs_improvement':
        return '⚠️'
      case 'non_compliant':
        return '❌'
      default:
        return '❓'
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">🍪 CookieLens</h1>
        <p className="subtitle">AI-Powered Cookie Compliance Scanner</p>
      </header>

      <div className="scanner-card">
        <div className="input-group">
          <input
            type="text"
            className="url-input"
            placeholder="Enter website URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            className="scan-button"
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Scanning...
              </>
            ) : (
              '🔍 Scan Website'
            )}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {scanResult && (
          <div className="results">
            {/* Scan Summary */}
            <div className="result-section">
              <h2 className="section-title">📊 Scan Summary</h2>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">URL</span>
                  <span className="summary-value">{scanResult.scan_results.url}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Cookies Detected</span>
                  <span className="summary-value highlight">
                    {scanResult.scan_results.cookies.length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Third-Party Domains</span>
                  <span className="summary-value highlight">
                    {scanResult.scan_results.thirdParties.length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Scanned At</span>
                  <span className="summary-value">
                    {new Date(scanResult.scan_results.scannedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Human Readable Analysis */}
            <div className="result-section">
              <h2 className="section-title">🤖 AI Analysis</h2>
              <div className="analysis-content">
                {scanResult.scan_results.humanReadableAnalysis.split('\n').map((line, idx) => {
                  if (line.startsWith('**Risk Level**:')) {
                    const riskLevel = line.split(':')[1].trim()
                    const riskColor = 
                      riskLevel === 'High' ? '#ef4444' :
                      riskLevel === 'Medium' ? '#f59e0b' : '#10b981'
                    return (
                      <div key={idx} className="risk-badge" style={{ backgroundColor: riskColor }}>
                        {line.replace('**Risk Level**:', 'Risk Level:')}
                      </div>
                    )
                  } else if (line.startsWith('**')) {
                    return <h3 key={idx} className="analysis-heading">{line.replace(/\*\*/g, '')}</h3>
                  } else if (line.startsWith('-')) {
                    return <li key={idx} className="analysis-list-item">{line.substring(1).trim()}</li>
                  } else if (line.trim()) {
                    return <p key={idx} className="analysis-text">{line}</p>
                  }
                  return null
                })}
              </div>
            </div>

            {/* Compliance Analysis (Collapsible) */}
            <div className="result-section">
              <button
                className="compliance-toggle"
                onClick={() => setShowCompliance(!showCompliance)}
              >
                <span className="toggle-icon">{showCompliance ? '▼' : '▶'}</span>
                <h2 className="section-title inline">🔒 Compliance Analysis</h2>
                <span className="compliance-badge">
                  Overall Score: {scanResult.overall_summary.overall_score}%
                </span>
              </button>

              {showCompliance && (
                <div className="compliance-content">
                  {/* Framework Analysis */}
                  {Object.entries(scanResult.compliance_analysis).map(([framework, data]) => (
                    <div key={framework} className="framework-card">
                      <div className="framework-header">
                        <div>
                          <h3 className="framework-title">
                            {getStatusIcon(data.status)} {data.framework}
                          </h3>
                          <span
                            className="framework-status"
                            style={{ color: getStatusColor(data.status) }}
                          >
                            {data.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="framework-score" style={{ color: getStatusColor(data.status) }}>
                          {data.score}%
                        </div>
                      </div>

                      {data.passed_controls.length > 0 && (
                        <div className="controls-section">
                          <h4 className="controls-title passed">✅ Passed Controls</h4>
                          <ul className="controls-list">
                            {data.passed_controls.map((control, idx) => (
                              <li key={idx} className="control-item passed">{control}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {data.failed_controls.length > 0 && (
                        <div className="controls-section">
                          <h4 className="controls-title failed">❌ Failed Controls</h4>
                          <ul className="controls-list">
                            {data.failed_controls.map((control, idx) => (
                              <li key={idx} className="control-item failed">{control}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {data.warnings.length > 0 && (
                        <div className="controls-section">
                          <h4 className="controls-title warning">⚠️ Warnings</h4>
                          <ul className="controls-list">
                            {data.warnings.map((warning, idx) => (
                              <li key={idx} className="control-item warning">{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {data.recommendations.length > 0 && (
                        <div className="controls-section">
                          <h4 className="controls-title recommendation">💡 Recommendations</h4>
                          <ul className="controls-list">
                            {data.recommendations.map((rec, idx) => (
                              <li key={idx} className="control-item recommendation">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Third Party Risks */}
                  {scanResult.third_party_risks.length > 0 && (
                    <div className="framework-card">
                      <h3 className="framework-title">🌐 Third-Party Risk Assessment</h3>
                      <div className="risks-grid">
                        {scanResult.third_party_risks.slice(0, 10).map((risk, idx) => (
                          <div key={idx} className="risk-item">
                            <div className="risk-header">
                              <span className="risk-domain">{risk.domain}</span>
                              <span className={`risk-level ${risk.risk_level}`}>
                                {risk.risk_level}
                              </span>
                            </div>
                            <span className="risk-category">{risk.category}</span>
                          </div>
                        ))}
                      </div>
                      {scanResult.third_party_risks.length > 10 && (
                        <p className="more-text">
                          ... and {scanResult.third_party_risks.length - 10} more third-party services
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>Built with ❤️ using Claude AI, Vanta, Semgrep & Puppeteer</p>
      </footer>
    </div>
  )
}

export default App

