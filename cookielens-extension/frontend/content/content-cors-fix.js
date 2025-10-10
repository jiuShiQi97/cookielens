// CookieLens Content Script - CORS Fix Version
// Uses background script to bypass CORS restrictions

(function() {
  'use strict';
  
  let modalShown = false;
  
  // Initialize immediately
  initCookieBannerDetection();
  
  function initCookieBannerDetection() {
    console.log('CookieLens: Initializing privacy analysis...');
    
    // Check if we've already shown modal for this host
    checkModalStatus();
    
    // Auto-show modal on page load
    autoDetectCookieBanner();
    
    console.log('CookieLens: Privacy analysis initialized');
  }
  
  async function checkModalStatus() {
    try {
      const hostname = window.location.hostname;
      const result = await chrome.storage.session.get([`shownForThisHost_${hostname}`]);
      modalShown = result[`shownForThisHost_${hostname}`] || false;
    } catch (error) {
      console.warn('CookieLens: Failed to check modal status:', error);
    }
  }
  
  async function setModalShown() {
    try {
      const hostname = window.location.hostname;
      await chrome.storage.session.set({ [`shownForThisHost_${hostname}`]: true });
      modalShown = true;
    } catch (error) {
      console.warn('CookieLens: Failed to set modal status:', error);
    }
  }
  
  // Auto-show modal on page load
  async function autoDetectCookieBanner() {
    if (modalShown) return;
    
    console.log('CookieLens: Auto-showing privacy analysis modal');
    
    // Wait a bit for page to fully load, then show modal automatically
    setTimeout(() => {
      console.log('CookieLens: Showing privacy analysis modal');
      showExplanationModal();
    }, 2000);
  }
  
  function showExplanationModal() {
    console.log('CookieLens: Creating modal...');
    
    // Create shadow DOM to avoid CSS conflicts
    const shadowHost = document.createElement('div');
    shadowHost.id = 'cookielens-shadow-host';
    document.body.appendChild(shadowHost);
    
    const shadowRoot = shadowHost.attachShadow({ mode: 'closed' });
    
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = getModalCSS();
    shadowRoot.appendChild(style);
    
    // Create modal HTML
    const modalHTML = createModalHTML();
    shadowRoot.innerHTML = style.outerHTML + modalHTML;
    
    console.log('CookieLens: Modal HTML created');
    
    // Add event listeners
    setupModalEventListeners(shadowRoot);
    
    // Mark as shown
    setModalShown();
    
    console.log('CookieLens: Modal displayed successfully');
  }
  
  function getModalCSS() {
    return `
      .cookielens-modal {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .cookielens-modal-content {
        background: white;
        border-radius: 12px;
        padding: 20px;
        width: 100%;
        max-height: 100%;
        overflow-y: auto;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        text-align: center;
        position: relative;
      }
      
      .cookielens-close-btn {
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        font-weight: bold;
        color: #6b7280;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      }
      
      .cookielens-close-btn:hover {
        background-color: #f3f4f6;
        color: #374151;
      }
      
      .cookielens-input-section {
        margin: 16px 0;
      }
      
      .cookielens-url-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
      }
      
      .cookielens-url-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .cookielens-status {
        margin-top: 8px;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        display: none;
      }
      
      .cookielens-status-info {
        background-color: #dbeafe;
        color: #1e40af;
        border: 1px solid #93c5fd;
      }
      
      .cookielens-status-success {
        background-color: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }
      
      .cookielens-status-error {
        background-color: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
      }
      
      .cookielens-debug-info {
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 12px;
        margin: 16px 0;
        text-align: left;
        font-size: 12px;
        color: #374151;
      }
      
      .cookielens-debug-info h4 {
        margin: 0 0 8px 0;
        color: #1f2937;
        font-size: 14px;
      }
      
      .cookielens-debug-info p {
        margin: 4px 0;
      }
      
      .cookielens-button {
        padding: 10px 24px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
        margin: 5px;
      }
      
      .cookielens-button-primary {
        background-color: #3b82f6;
        color: white;
      }
      
      .cookielens-button-primary:hover {
        background-color: #2563eb;
      }
      
      .cookielens-button-secondary {
        background-color: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }
      
      .cookielens-button-secondary:hover {
        background-color: #e5e7eb;
      }
      
      .cookielens-button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
      }
      
      .cookielens-results {
        text-align: left;
        margin-top: 20px;
      }
      
      .cookielens-results h3 {
        margin: 0 0 16px 0;
        color: #1f2937;
        text-align: center;
      }
      
      .cookielens-analysis-content {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 16px;
        margin-bottom: 16px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .cookielens-analysis-content h4 {
        margin: 0 0 12px 0;
        color: #1f2937;
        font-size: 16px;
        font-weight: 600;
      }
      
      .cookielens-analysis-text {
        font-size: 13px;
        line-height: 1.6;
        color: #374151;
      }
      
      .cookielens-analysis-text p {
        margin: 0 0 12px 0;
      }
      
      .cookielens-analysis-text ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      .cookielens-analysis-text li {
        margin: 4px 0;
      }
      
      @media (max-width: 480px) {
        .cookielens-modal {
          width: calc(100vw - 40px);
          right: 20px;
          left: 20px;
          bottom: 20px;
        }
        
        .cookielens-modal-content {
          padding: 16px;
        }
      }
    `;
  }
  
  function createModalHTML() {
    return `
      <div class="cookielens-modal">
        <div class="cookielens-modal-content">
          <button class="cookielens-close-btn" id="cookielens-close-btn">×</button>
          <div class="cookielens-modal-header">
            <h2 class="cookielens-modal-title">🍪 CookieLens Privacy Analysis</h2>
            <p class="cookielens-modal-description">Analyze website privacy and compliance with GDPR/CCPA</p>
          </div>
          
          <div class="cookielens-debug-info">
            <h4>🔧 Debug Information</h4>
            <p><strong>Current URL:</strong> ${window.location.href}</p>
            <p><strong>Extension Version:</strong> 1.0.0</p>
            <p><strong>API Endpoint:</strong> https://kr9knqhdha.execute-api.us-east-1.amazonaws.com/prod/scan</p>
            <p><strong>Status:</strong> Ready to analyze</p>
            <p><strong>Method:</strong> Background Script (CORS Fix)</p>
          </div>
          
          <div class="cookielens-input-section">
            <input type="url" id="cookielens-url-input" class="cookielens-url-input" 
                   placeholder="https://example.com" value="${window.location.href}">
            <div class="cookielens-status" id="cookielens-status"></div>
          </div>
          
          <div class="cookielens-buttons">
            <button class="cookielens-button cookielens-button-primary" id="cookielens-scan">
              🔍 Analyze Privacy & Compliance
            </button>
            <button class="cookielens-button cookielens-button-secondary" id="cookielens-close">
              ❌ Close
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  function setupModalEventListeners(shadowRoot) {
    // Scan button
    shadowRoot.getElementById('cookielens-scan').addEventListener('click', () => {
      scanWebsite(shadowRoot);
    });
    
    // Close button
    shadowRoot.getElementById('cookielens-close').addEventListener('click', () => {
      closeModal();
    });
    
    // Close button (X)
    shadowRoot.getElementById('cookielens-close-btn').addEventListener('click', () => {
      closeModal();
    });
    
    // Enter key support for URL input
    shadowRoot.getElementById('cookielens-url-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        scanWebsite(shadowRoot);
      }
    });
  }
  
  function scanWebsite(shadowRoot) {
    const urlInput = shadowRoot.getElementById('cookielens-url-input');
    const statusDiv = shadowRoot.getElementById('cookielens-status');
    const scanButton = shadowRoot.getElementById('cookielens-scan');
    
    const url = urlInput.value.trim();
    
    if (!url) {
      showStatus(statusDiv, 'Please enter a valid URL', 'error');
      return;
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      showStatus(statusDiv, 'Invalid URL format', 'error');
      return;
    }
    
    // Update UI for scanning
    scanButton.disabled = true;
    scanButton.textContent = 'Analyzing...';
    showStatus(statusDiv, 'Starting analysis via background script...', 'info');
    
    console.log('CookieLens: Scanning website via background script:', url);
    
    // Use background script to bypass CORS
    chrome.runtime.sendMessage({
      action: 'scanWebsite',
      url: url
    }, (response) => {
      console.log('CookieLens: Background script response:', response);
      
      scanButton.disabled = false;
      scanButton.textContent = '🔍 Analyze Privacy & Compliance';
      
      if (chrome.runtime.lastError) {
        console.error('CookieLens: Background script error:', chrome.runtime.lastError);
        showStatus(statusDiv, `Error: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }
      
      if (response && response.success) {
        showStatus(statusDiv, 'Analysis completed successfully!', 'success');
        showScanResults(shadowRoot, response.data);
      } else {
        showStatus(statusDiv, `Analysis failed: ${response?.error || 'Unknown error'}`, 'error');
      }
    });
  }
  
  function showScanResults(shadowRoot, data) {
    const cookies = data.cookies || [];
    const thirdParties = data.thirdParties || [];
    const analysis = data.humanReadableAnalysis || 'No analysis available';
    const url = data.url || 'Unknown URL';
    const scannedAt = data.scannedAt || new Date().toISOString();
    
    const resultsHTML = `
      <div class="cookielens-results">
        <h3>📊 Privacy Analysis Report</h3>
        
        <div class="cookielens-analysis-content">
          <h4>🍪 Cookie Analysis (${cookies.length} found)</h4>
          <div class="cookielens-analysis-text">
            ${cookies.length > 0 ? `
              <ul>
                ${cookies.map(cookie => {
                  const securityFlags = [];
                  if (cookie.httpOnly) securityFlags.push('httpOnly');
                  if (cookie.secure) securityFlags.push('secure');
                  if (cookie.sameSite) securityFlags.push(`sameSite=${cookie.sameSite}`);
                  
                  const flagsText = securityFlags.length > 0 ? 
                    ` (${securityFlags.join(', ')})` : ' (No security flags)';
                  
                  return `<li><strong>${cookie.name}</strong>${flagsText}</li>`;
                }).join('')}
              </ul>
            ` : '<p>No cookies detected</p>'}
          </div>
        </div>
        
        <div class="cookielens-analysis-content">
          <h4>🌐 Third-Party Services (${thirdParties.length} detected)</h4>
          <div class="cookielens-analysis-text">
            ${thirdParties.length > 0 ? `
              <p>Detected third-party domains:</p>
              <ul>
                ${thirdParties.slice(0, 10).map(party => `<li>${party}</li>`).join('')}
                ${thirdParties.length > 10 ? `<li>... and ${thirdParties.length - 10} more</li>` : ''}
              </ul>
            ` : '<p>No third-party services detected</p>'}
          </div>
        </div>
        
        <div class="cookielens-analysis-content">
          <h4>🤖 AI Analysis</h4>
          <div class="cookielens-analysis-text">
            ${formatAnalysisText(analysis)}
          </div>
        </div>
        
        <div class="cookielens-analysis-content">
          <h4>📋 Analysis Details</h4>
          <div class="cookielens-analysis-text">
            <p><strong>Website:</strong> ${url}</p>
            <p><strong>Scanned:</strong> ${new Date(scannedAt).toLocaleString()}</p>
            <p><strong>Method:</strong> ${data.method || 'simple_http'}</p>
            ${data.limitations ? `
              <p><strong>Limitations:</strong></p>
              <ul>
                ${data.limitations.map(limitation => `<li>${limitation}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 16px;">
          <button class="cookielens-button cookielens-button-secondary" onclick="this.closest('.cookielens-modal').remove()">
            Close
          </button>
        </div>
      </div>
    `;
    
    // Replace modal content
    const modalContent = shadowRoot.querySelector('.cookielens-modal-content');
    modalContent.innerHTML = resultsHTML;
  }
  
  function formatAnalysisText(analysis) {
    if (!analysis) return '<p>No analysis available.</p>';
    
    // Split by common patterns and format as paragraphs
    const paragraphs = analysis
      .split(/\n\s*\n/) // Split by double newlines
      .filter(p => p.trim().length > 0)
      .map(p => p.trim());
    
    return paragraphs.map(paragraph => {
      // Check if it's a header (starts with ** or contains :)
      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
        return `<h5>${paragraph.replace(/\*\*/g, '')}</h5>`;
      }
      
      // Check if it's a list item
      if (paragraph.match(/^\d+\.|^[-*]/)) {
        return `<ul><li>${paragraph.replace(/^\d+\.\s*|^[-*]\s*/, '')}</li></ul>`;
      }
      
      // Regular paragraph
      return `<p>${paragraph}</p>`;
    }).join('');
  }
  
  function showStatus(statusDiv, message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `cookielens-status cookielens-status-${type}`;
    statusDiv.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }
  
  function closeModal() {
    const shadowHost = document.getElementById('cookielens-shadow-host');
    if (shadowHost) {
      shadowHost.remove();
    }
  }
  
})();
