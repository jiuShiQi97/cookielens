// CookieLens Content Script - CORS Fix Version with Enhanced UI
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
    
    // Create enhanced modal HTML
    const modalHTML = createEnhancedModalHTML();
    shadowRoot.innerHTML = style.outerHTML + modalHTML;
    
    console.log('CookieLens: Enhanced modal HTML created');
    
    // Add event listeners
    setupModalEventListeners(shadowRoot);
    
    // Mark as shown
    setModalShown();
    
    console.log('CookieLens: Enhanced modal displayed successfully');
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
      
      .cookielens-progress-container {
        margin: 20px 0;
      }
      
      .cookielens-progress-bar {
        width: 100%;
        height: 8px;
        background-color: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }
      
      .cookielens-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        border-radius: 4px;
        width: 0%;
        transition: width 0.5s ease;
      }
      
      .cookielens-progress-text {
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }
      
      .cookielens-step-status {
        margin-left: auto;
        font-size: 16px;
        transition: all 0.3s ease;
      }
      
      .cookielens-log-container {
        margin: 20px 0;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
      }
      
      .cookielens-log-header {
        background-color: #f9fafb;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .cookielens-log-header span {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }
      
      .cookielens-log-toggle {
        background-color: #3b82f6;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .cookielens-log-toggle:hover {
        background-color: #2563eb;
      }
      
      .cookielens-log-content {
        background-color: #1f2937;
        color: #f9fafb;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .cookielens-log-messages {
        padding: 12px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.4;
      }
      
      .cookielens-log-message {
        margin: 4px 0;
        padding: 2px 0;
        border-bottom: 1px solid #374151;
      }
      
      .cookielens-log-message:last-child {
        border-bottom: none;
      }
      
      .cookielens-loading-modal {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        z-index: 2147483648;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .cookielens-loading-content {
        background: white;
        border-radius: 12px;
        padding: 20px;
        width: 100%;
        max-height: 100%;
        overflow-y: auto;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        text-align: center;
      }
      
      .cookielens-loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: cookielens-spin 1s linear infinite;
        margin: 0 auto 20px;
      }
      
      @keyframes cookielens-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .cookielens-loading-content h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .cookielens-loading-url {
        margin: 0 0 24px 0;
        font-size: 14px;
        color: #6b7280;
        word-break: break-all;
      }
      
      .cookielens-loading-steps {
        margin-bottom: 20px;
      }
      
      .cookielens-step {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 12px 0;
        font-size: 14px;
        color: #374151;
      }
      
      .cookielens-step-icon {
        margin-right: 8px;
        font-size: 16px;
      }
      
      .cookielens-step-text {
        font-weight: 500;
      }
      
      .cookielens-loading-note {
        margin: 0;
        font-size: 12px;
        color: #9ca3af;
        font-style: italic;
      }
      
      .cookielens-modal-header {
        margin-bottom: 20px;
      }
      
      .cookielens-modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 8px 0;
        line-height: 1.3;
      }
      
      .cookielens-modal-description {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
        margin: 0;
      }
      
      .cookielens-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      
      .cookielens-button-secondary {
        background-color: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
      }
      
      .cookielens-button-secondary:hover {
        background-color: #e5e7eb;
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
      }
      
      .cookielens-button-primary {
        background-color: #3b82f6;
        color: white;
      }
      
      .cookielens-button-primary:hover {
        background-color: #2563eb;
      }
      
      @media (max-width: 480px) {
        .cookielens-modal {
          width: calc(100vw - 40px);
          right: 20px;
          left: 20px;
          bottom: 20px;
        }
        
        .cookielens-loading-modal {
          width: calc(100vw - 40px);
          right: 20px;
          left: 20px;
          bottom: 20px;
        }
        
        .cookielens-modal-content {
          padding: 16px;
        }
        
        .cookielens-loading-content {
          padding: 16px;
        }
      }
    `;
  }
  
  function createEnhancedModalHTML() {
    return `
      <div class="cookielens-modal">
        <div class="cookielens-modal-content">
          <button class="cookielens-close-btn" id="cookielens-close-btn">×</button>
          <div class="cookielens-modal-header">
            <h2 class="cookielens-modal-title">🔍 Privacy & Compliance Analysis</h2>
            <p class="cookielens-modal-description">Analyze website privacy and compliance with GDPR/CCPA</p>
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
              Close
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
    
    // Show enhanced loading modal
    showEnhancedLoadingModal(shadowRoot, url);
    
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
        hideEnhancedLoadingModal(shadowRoot);
        showStatus(statusDiv, `Error: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }
      
      if (response && response.success) {
        console.log('CookieLens: Analysis completed successfully');
        hideEnhancedLoadingModal(shadowRoot);
        showStatus(statusDiv, 'Analysis completed successfully!', 'success');
        
        // Show results
        showScanResults(shadowRoot, response.data);
      } else {
        console.error('CookieLens: Analysis failed:', response?.error);
        hideEnhancedLoadingModal(shadowRoot);
        showStatus(statusDiv, `Analysis failed: ${response?.error || 'Unknown error'}`, 'error');
      }
    });
  }
  
  function showEnhancedLoadingModal(shadowRoot, url) {
    // Create enhanced loading modal with progress tracking
    const loadingHTML = `
      <div class="cookielens-loading-modal">
        <div class="cookielens-loading-content">
          <div class="cookielens-loading-spinner"></div>
          <h3>🔍 Analyzing Website Privacy & Compliance</h3>
          <p class="cookielens-loading-url">${url}</p>
          
          <div class="cookielens-progress-container">
            <div class="cookielens-progress-bar">
              <div class="cookielens-progress-fill" id="cookielens-progress-fill"></div>
            </div>
            <div class="cookielens-progress-text" id="cookielens-progress-text">Initializing...</div>
          </div>
          
          <div class="cookielens-loading-steps">
            <div class="cookielens-step" id="step-1">
              <span class="cookielens-step-icon">🌐</span>
              <span class="cookielens-step-text">Connecting to website...</span>
              <span class="cookielens-step-status">⏳</span>
            </div>
            <div class="cookielens-step" id="step-2">
              <span class="cookielens-step-icon">🍪</span>
              <span class="cookielens-step-text">Scanning cookies & storage...</span>
              <span class="cookielens-step-status">⏳</span>
            </div>
            <div class="cookielens-step" id="step-3">
              <span class="cookielens-step-icon">🔗</span>
              <span class="cookielens-step-text">Detecting third-party services...</span>
              <span class="cookielens-step-status">⏳</span>
            </div>
            <div class="cookielens-step" id="step-4">
              <span class="cookielens-step-icon">🤖</span>
              <span class="cookielens-step-text">AI privacy analysis...</span>
              <span class="cookielens-step-status">⏳</span>
            </div>
            <div class="cookielens-step" id="step-5">
              <span class="cookielens-step-icon">⚖️</span>
              <span class="cookielens-step-text">Compliance checking...</span>
              <span class="cookielens-step-status">⏳</span>
            </div>
            <div class="cookielens-step" id="step-6">
              <span class="cookielens-step-icon">📊</span>
              <span class="cookielens-step-text">Generating report...</span>
              <span class="cookielens-step-status">⏳</span>
            </div>
          </div>
          
          <div class="cookielens-log-container">
            <div class="cookielens-log-header">
              <span>📋 Backend Logs</span>
              <button class="cookielens-log-toggle" id="cookielens-log-toggle">Show</button>
            </div>
            <div class="cookielens-log-content" id="cookielens-log-content" style="display: none;">
              <div class="cookielens-log-messages" id="cookielens-log-messages">
                <div class="cookielens-log-message">🚀 Starting analysis via background script...</div>
                <div class="cookielens-log-message">📡 Target URL: ${url}</div>
              </div>
            </div>
          </div>
          
          <p class="cookielens-loading-note">⏱️ This may take 15-45 seconds depending on website complexity</p>
        </div>
      </div>
    `;
    
    // Add loading modal to shadow root
    shadowRoot.innerHTML += loadingHTML;
    
    // Start progress animation
    startProgressAnimation(shadowRoot);
    
    // Setup log toggle
    setupLogToggle(shadowRoot);
  }
  
  function hideEnhancedLoadingModal(shadowRoot) {
    const loadingModal = shadowRoot.querySelector('.cookielens-loading-modal');
    if (loadingModal) {
      loadingModal.remove();
    }
  }
  
  function startProgressAnimation(shadowRoot) {
    const progressFill = shadowRoot.getElementById('cookielens-progress-fill');
    const progressText = shadowRoot.getElementById('cookielens-progress-text');
    const steps = [
      { text: 'Connecting to website...', progress: 10 },
      { text: 'Scanning cookies & storage...', progress: 25 },
      { text: 'Detecting third-party services...', progress: 40 },
      { text: 'AI privacy analysis...', progress: 65 },
      { text: 'Compliance checking...', progress: 85 },
      { text: 'Generating report...', progress: 95 }
    ];
    
    let currentStep = 0;
    
    const updateProgress = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        progressFill.style.width = step.progress + '%';
        progressText.textContent = step.text;
        
        // Update step status
        const stepElement = shadowRoot.getElementById(`step-${currentStep + 1}`);
        if (stepElement) {
          const statusSpan = stepElement.querySelector('.cookielens-step-status');
          if (statusSpan) {
            statusSpan.textContent = '✅';
            statusSpan.style.color = '#10b981';
          }
        }
        
        // Add log message
        addLogMessage(shadowRoot, `✅ ${step.text}`);
        
        currentStep++;
        
        // Schedule next update
        setTimeout(updateProgress, 2000 + Math.random() * 3000); // 2-5 seconds between steps
      }
    };
    
    // Start the animation
    setTimeout(updateProgress, 1000);
  }
  
  function setupLogToggle(shadowRoot) {
    const toggle = shadowRoot.getElementById('cookielens-log-toggle');
    const content = shadowRoot.getElementById('cookielens-log-content');
    
    if (toggle && content) {
      toggle.addEventListener('click', () => {
        const isVisible = content.style.display !== 'none';
        content.style.display = isVisible ? 'none' : 'block';
        toggle.textContent = isVisible ? 'Show' : 'Hide';
      });
    }
  }
  
  function addLogMessage(shadowRoot, message) {
    const logMessages = shadowRoot.getElementById('cookielens-log-messages');
    if (logMessages) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'cookielens-log-message';
      messageDiv.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
      logMessages.appendChild(messageDiv);
      
      // Auto-scroll to bottom
      logMessages.scrollTop = logMessages.scrollHeight;
    }
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
  
  function showScanResults(shadowRoot, data) {
    // Extract data from compliance API response
    const scanResults = data.scan_results || data;
    const complianceAnalysis = data.compliance_analysis || {};
    const thirdPartyRisks = data.third_party_risks || [];
    const overallSummary = data.overall_summary || {};
    
    const analysis = scanResults.humanReadableAnalysis || 'No analysis available';
    const url = scanResults.url || 'Unknown URL';
    const scannedAt = scanResults.scannedAt || new Date().toISOString();
    const cookies = scanResults.cookies || [];
    const thirdParties = scanResults.thirdParties || [];
    
    // Create simple results display
    const resultsHTML = `
      <div class="cookielens-modal-content">
        <button class="cookielens-close-btn" id="cookielens-close-results">×</button>
        <div class="cookielens-modal-header">
          <h2 class="cookielens-modal-title">📊 Analysis Complete!</h2>
          <p class="cookielens-modal-description">Privacy & Compliance Report</p>
        </div>
        
        <div style="text-align: left; margin: 20px 0;">
          <h4>🌐 Website: ${url}</h4>
          <h4>🍪 Cookies Found: ${cookies.length}</h4>
          <h4>🔗 Third-Party Services: ${thirdParties.length}</h4>
          <h4>📊 Overall Score: ${overallSummary.overall_score || 0}%</h4>
          
          <div style="margin-top: 20px;">
            <h4>📝 AI Analysis:</h4>
            <div style="background-color: #f9fafb; padding: 12px; border-radius: 6px; font-size: 14px; line-height: 1.5;">
              ${analysis}
            </div>
          </div>
        </div>
        
        <div class="cookielens-buttons">
          <button class="cookielens-button cookielens-button-primary" id="cookielens-download-results">
            📥 Download Report
          </button>
          <button class="cookielens-button cookielens-button-secondary" id="cookielens-close-results">
            Close
          </button>
        </div>
      </div>
    `;
    
    // Replace modal content
    const modalContent = shadowRoot.querySelector('.cookielens-modal-content');
    modalContent.innerHTML = resultsHTML;
    
    // Add event listeners for results
    shadowRoot.getElementById('cookielens-download-results').addEventListener('click', () => {
      downloadScanResults(data);
    });
    
    shadowRoot.getElementById('cookielens-close-results').addEventListener('click', () => {
      closeModal();
    });
  }
  
  function downloadScanResults(data) {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cookielens-scan-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('CookieLens: Scan results downloaded');
    } catch (error) {
      console.error('CookieLens: Failed to download scan results:', error);
    }
  }
  
  function closeModal() {
    const shadowHost = document.getElementById('cookielens-shadow-host');
    if (shadowHost) {
      shadowHost.remove();
    }
  }
  
})();