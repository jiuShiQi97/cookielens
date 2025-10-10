// CookieLens Content Script
// Detects cookie banners and shows explanation modal

(function() {
  'use strict';
  
  let modalShown = false;
  let originalClickHandler = null;
  let currentTarget = null;
  
  // Initialize immediately since explain.js is loaded via manifest
  initCookieBannerDetection();
  
  function initCookieBannerDetection() {
    console.log('CookieLens: Initializing privacy analysis...');
    
    // Check if we've already shown modal for this host
    checkModalStatus();
    
    // Use event delegation to catch clicks on potential cookie banner buttons
    document.addEventListener('click', handlePotentialCookieBannerClick, true);
    
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
  
  function handlePotentialCookieBannerClick(event) {
    if (modalShown) return;
    
    const target = event.target;
    if (!target || !isCookieBannerButton(target)) return;
    
    // Prevent the original click
    event.preventDefault();
    event.stopImmediatePropagation();
    
    // Store original target and handler
    currentTarget = target;
    originalClickHandler = target.onclick;
    
    // Show our modal (backup method if auto-show fails)
    showExplanationModal();
  }
  
  function isCookieBannerButton(element) {
    if (!element || element.tagName !== 'BUTTON') return false;
    
    const text = element.textContent.toLowerCase();
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    const dataTestId = element.getAttribute('data-testid')?.toLowerCase() || '';
    const className = element.className.toLowerCase();
    
    // Check for accept/agree text patterns
    const acceptPatterns = [
      'accept', 'agree', 'allow', 'consent', 'ok', 'continue',
      '同意', '允许', '接受', '确定', '继续'
    ];
    
    // Check for known CMP selectors
    const knownSelectors = [
      '.onetrust-accept-btn-handler',
      '[data-testid*="accept"]',
      'button[aria-label*="accept"]',
      '.cc-allow',
      '.cookie-accept',
      '.accept-cookies'
    ];
    
    // Check text content
    for (const pattern of acceptPatterns) {
      if (text.includes(pattern) || ariaLabel.includes(pattern) || dataTestId.includes(pattern)) {
        return true;
      }
    }
    
    // Check CSS selectors
    for (const selector of knownSelectors) {
      if (element.matches(selector)) {
        return true;
      }
    }
    
    // Check class names
    if (className.includes('accept') || className.includes('allow') || className.includes('consent')) {
      return true;
    }
    
    return false;
  }
  
  // Auto-show modal on page load
  async function autoDetectCookieBanner() {
    if (modalShown) return;
    
    // Always show modal for testing (remove auto-detection check)
    console.log('CookieLens: Auto-showing privacy analysis modal');
    
    // Wait a bit for page to fully load, then show modal automatically
    setTimeout(() => {
      console.log('CookieLens: Showing privacy analysis modal');
      showExplanationModal();
    }, 2000); // Wait 2 seconds for page to load
  }
  
  // Find cookie banner container
  function findCookieBanner() {
    // Common cookie banner selectors
    const bannerSelectors = [
      // OneTrust
      '#onetrust-consent-sdk',
      '.onetrust-banner-sdk',
      // Cookiebot
      '#CybotCookiebotDialog',
      '.CybotCookiebotDialog',
      // CookiePro
      '#cookieProBanner',
      '.cookieProBanner',
      // Generic patterns
      '[id*="cookie"]',
      '[class*="cookie"]',
      '[id*="consent"]',
      '[class*="consent"]',
      '[id*="gdpr"]',
      '[class*="gdpr"]',
      '[id*="privacy"]',
      '[class*="privacy"]',
      // Common CMP containers
      '.cc-window',
      '.cookie-banner',
      '.consent-banner',
      '.privacy-banner',
      '.gdpr-banner'
    ];
    
    for (const selector of bannerSelectors) {
      const banner = document.querySelector(selector);
      if (banner && isVisible(banner)) {
        return banner;
      }
    }
    
    // Look for elements containing cookie-related text
    const cookieTextPatterns = [
      'cookie', 'cookies', 'consent', 'privacy', 'gdpr',
      'cookie', 'cookies', '同意', '隐私', '数据'
    ];
    
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      const text = element.textContent.toLowerCase();
      for (const pattern of cookieTextPatterns) {
        if (text.includes(pattern) && isVisible(element)) {
          // Check if it contains buttons
          const buttons = element.querySelectorAll('button');
          for (const button of buttons) {
            if (isCookieBannerButton(button)) {
              return element;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  // Check if element is visible
  function isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0
    );
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
    
    // Create simple modal HTML
    const modalHTML = createSimpleModalHTML();
    shadowRoot.innerHTML = style.outerHTML + modalHTML;
    
    console.log('CookieLens: Modal HTML created:', modalHTML);
    
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
      
      .cookielens-results {
        text-align: left;
      }
      
      .cookielens-results h3 {
        margin: 0 0 16px 0;
        color: #1f2937;
        text-align: center;
      }
      
      .cookielens-analysis-header {
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .cookielens-analysis-info {
        font-size: 13px;
        color: #374151;
        line-height: 1.5;
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
      
      .cookielens-analysis-content h5 {
        margin: 16px 0 8px 0;
        color: #374151;
        font-size: 14px;
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
      
      .cookielens-compliance-section {
        margin: 16px 0;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
      }
      
      .cookielens-compliance-header {
        background-color: #f9fafb;
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e5e7eb;
        transition: background-color 0.2s;
      }
      
      .cookielens-compliance-header:hover {
        background-color: #f3f4f6;
      }
      
      .cookielens-compliance-header h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .cookielens-expand-icon {
        font-size: 14px;
        color: #6b7280;
        transition: transform 0.2s;
      }
      
      .cookielens-compliance-content {
        padding: 16px;
        background-color: white;
      }
      
      .cookielens-framework-section {
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #f3f4f6;
      }
      
      .cookielens-framework-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      
      .cookielens-framework-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .cookielens-framework-header h5 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .cookielens-status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .cookielens-controls-section {
        margin-bottom: 12px;
      }
      
      .cookielens-controls-section:last-child {
        margin-bottom: 0;
      }
      
      .cookielens-controls-section h6 {
        font-size: 12px;
        font-weight: 600;
        margin: 8px 0 4px 0;
      }
      
      .cookielens-controls-list {
        margin: 0;
        padding-left: 16px;
        list-style-type: none;
      }
      
      .cookielens-controls-list li {
        position: relative;
        margin: 2px 0;
        font-size: 12px;
        color: #374151;
        line-height: 1.4;
      }
      
      .cookielens-controls-list li:before {
        content: "•";
        position: absolute;
        left: -12px;
        color: #9ca3af;
      }
      
      .cookielens-recommendations-section {
        background-color: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 4px;
        padding: 8px 12px;
        margin-top: 8px;
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
  
  function createSimpleModalHTML() {
    return `
      <div class="cookielens-modal">
        <div class="cookielens-modal-content">
          <button class="cookielens-close-btn" id="cookielens-close-btn">×</button>
          <div class="cookielens-modal-header">
            <h2 class="cookielens-modal-title">Privacy & Compliance Analysis</h2>
            <p class="cookielens-modal-description">Analyze website privacy and compliance with GDPR/CCPA</p>
          </div>
          
          <div class="cookielens-input-section">
            <input type="url" id="cookielens-url-input" class="cookielens-url-input" 
                   placeholder="https://example.com" value="${window.location.href}">
            <div class="cookielens-status" id="cookielens-status"></div>
          </div>
          
          <div class="cookielens-buttons">
            <button class="cookielens-button cookielens-button-primary" id="cookielens-scan">
              Analyze Privacy & Compliance
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
    
    // Close on backdrop click (disabled for corner modal)
    // shadowRoot.querySelector('.cookielens-modal').addEventListener('click', (e) => {
    //   if (e.target.classList.contains('cookielens-modal')) {
    //     closeModal();
    //   }
    // });
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
    showStatus(statusDiv, 'Starting analysis...', 'info');
    
    // Show loading modal
    showLoadingModal(shadowRoot, url);
    
    console.log('CookieLens: Scanning website:', url);
    
    // Add initial log messages
    addLogMessage(shadowRoot, '🚀 Sending request to backend API...');
    addLogMessage(shadowRoot, `📡 Target URL: ${url}`);
    
    // Call local backend API
    fetch('http://localhost:8000/scan-with-compliance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        web_link: url
      })
    })
    .then(response => {
      addLogMessage(shadowRoot, `📊 Response received: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('CookieLens: Scan completed:', data);
      
      addLogMessage(shadowRoot, '✅ Analysis completed successfully!');
      addLogMessage(shadowRoot, `📋 Found ${data.scan_results?.cookies?.length || 0} cookies`);
      addLogMessage(shadowRoot, `🔗 Detected ${data.scan_results?.thirdParties?.length || 0} third-party services`);
      
      // Hide loading modal and show results
      hideLoadingModal(shadowRoot);
      showStatus(statusDiv, 'Analysis completed successfully!', 'success');
      
      // Show results with human-readable analysis
      showScanResults(shadowRoot, data);
      
    })
    .catch(error => {
      console.error('CookieLens: Scan failed:', error);
      
      addLogMessage(shadowRoot, `❌ Error: ${error.message}`);
      
      // Hide loading modal on error
      hideLoadingModal(shadowRoot);
      showStatus(statusDiv, `Analysis failed: ${error.message}`, 'error');
    })
    .finally(() => {
      scanButton.disabled = false;
      scanButton.textContent = 'Analyze Privacy & Compliance';
    });
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
    const limitations = scanResults.limitations || [];
    
    // Create results modal with human-readable analysis and compliance
    const resultsHTML = `
      <div class="cookielens-results">
        <h3>Privacy & Compliance Analysis Report</h3>
        <div class="cookielens-analysis-header">
          <div class="cookielens-analysis-info">
            <strong>Website:</strong> ${url}<br>
            <strong>Scanned:</strong> ${new Date(scannedAt).toLocaleString()}
          </div>
        </div>
        
        <div class="cookielens-analysis-content">
          <h4>Privacy Analysis Summary</h4>
          <div class="cookielens-analysis-text">
            ${formatAnalysisText(analysis)}
          </div>
        </div>
        
        ${Object.keys(complianceAnalysis).length > 0 ? `
        <div class="cookielens-compliance-section">
          <div class="cookielens-compliance-header" id="cookielens-compliance-toggle">
            <h4>Compliance Analysis</h4>
            <span class="cookielens-expand-icon">▼</span>
          </div>
          <div class="cookielens-compliance-content" id="cookielens-compliance-content" style="display: none;">
            ${formatComplianceAnalysis(complianceAnalysis, overallSummary)}
          </div>
        </div>
        ` : ''}
        
        <div class="cookielens-compliance-section">
          <div class="cookielens-compliance-header" id="cookielens-cookies-toggle">
            <h4>Cookie Analysis (${cookies.length} found)</h4>
            <span class="cookielens-expand-icon">▼</span>
          </div>
          <div class="cookielens-compliance-content" id="cookielens-cookies-content" style="display: none;">
            ${formatCookiesAnalysis(cookies)}
          </div>
        </div>
        
        <div class="cookielens-compliance-section">
          <div class="cookielens-compliance-header" id="cookielens-thirdparties-toggle">
            <h4>Third-Party Services (${thirdParties.length} detected)</h4>
            <span class="cookielens-expand-icon">▼</span>
          </div>
          <div class="cookielens-compliance-content" id="cookielens-thirdparties-content" style="display: none;">
            ${formatThirdPartiesAnalysis(thirdParties)}
          </div>
        </div>
        
        ${limitations.length > 0 ? `
        <div class="cookielens-compliance-section">
          <div class="cookielens-compliance-header" id="cookielens-limitations-toggle">
            <h4>Analysis Limitations</h4>
            <span class="cookielens-expand-icon">▼</span>
          </div>
          <div class="cookielens-compliance-content" id="cookielens-limitations-content" style="display: none;">
            ${formatLimitations(limitations)}
          </div>
        </div>
        ` : ''}
        
        <div class="cookielens-buttons">
          <button class="cookielens-button cookielens-button-primary" id="cookielens-download-results">
            Download Full Report
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
    
    // Add toggle functionality for all sections
    if (Object.keys(complianceAnalysis).length > 0) {
      addToggleFunctionality(shadowRoot, 'cookielens-compliance-toggle', 'cookielens-compliance-content');
    }
    addToggleFunctionality(shadowRoot, 'cookielens-cookies-toggle', 'cookielens-cookies-content');
    addToggleFunctionality(shadowRoot, 'cookielens-thirdparties-toggle', 'cookielens-thirdparties-content');
    if (limitations.length > 0) {
      addToggleFunctionality(shadowRoot, 'cookielens-limitations-toggle', 'cookielens-limitations-content');
    }
  }
  
  function formatAnalysisText(analysis) {
    // Format the analysis text for better readability
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
  
  function formatComplianceAnalysis(complianceAnalysis, overallSummary) {
    if (!complianceAnalysis || Object.keys(complianceAnalysis).length === 0) {
      return '<p>No compliance analysis available.</p>';
    }
    
    let html = '';
    
    // Overall summary
    if (overallSummary && Object.keys(overallSummary).length > 0) {
      html += `
        <div class="cookielens-framework-section">
          <h5 style="margin: 0 0 12px 0; color: #1f2937;">Overall Compliance Summary</h5>
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 14px; color: #1e40af;">
              <strong>Overall Score:</strong> ${overallSummary.overall_score || 0}%<br>
              <strong>Frameworks Analyzed:</strong> ${overallSummary.frameworks_analyzed || 0}<br>
              <strong>Passed Controls:</strong> ${overallSummary.total_passed || 0}<br>
              <strong>Failed Controls:</strong> ${overallSummary.total_failed || 0}<br>
              <strong>Warnings:</strong> ${overallSummary.total_warnings || 0}
            </p>
          </div>
        </div>
      `;
    }
    
    // Individual framework analysis
    Object.entries(complianceAnalysis).forEach(([framework, analysis]) => {
      const statusColor = analysis.status === 'compliant' ? '#10b981' : 
                         analysis.status === 'needs_improvement' ? '#f59e0b' : '#ef4444';
      const statusText = analysis.status === 'compliant' ? '✅ Compliant' :
                        analysis.status === 'needs_improvement' ? '⚠️ Needs Improvement' : '❌ Non-Compliant';
      
      html += `
        <div class="cookielens-framework-section">
          <div class="cookielens-framework-header">
            <h5>${analysis.framework || framework.toUpperCase()}</h5>
            <span class="cookielens-status-badge" style="background-color: ${statusColor}; color: white;">
              ${statusText} (${analysis.score || 0}%)
            </span>
          </div>
          
          ${analysis.passed_controls && analysis.passed_controls.length > 0 ? `
          <div class="cookielens-controls-section">
            <h6 style="color: #10b981;">✅ Passed Controls</h6>
            <ul class="cookielens-controls-list">
              ${analysis.passed_controls.map(control => `<li style="color: #065f46;">${control}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${analysis.failed_controls && analysis.failed_controls.length > 0 ? `
          <div class="cookielens-controls-section">
            <h6 style="color: #ef4444;">❌ Failed Controls</h6>
            <ul class="cookielens-controls-list">
              ${analysis.failed_controls.map(control => `<li style="color: #991b1b;">${control}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${analysis.warnings && analysis.warnings.length > 0 ? `
          <div class="cookielens-controls-section">
            <h6 style="color: #f59e0b;">⚠️ Warnings</h6>
            <ul class="cookielens-controls-list">
              ${analysis.warnings.map(warning => `<li style="color: #92400e;">${warning}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${analysis.recommendations && analysis.recommendations.length > 0 ? `
          <div class="cookielens-recommendations-section">
            <h6 style="color: #1e40af; margin: 0 0 8px 0;">💡 Recommendations</h6>
            <ul class="cookielens-controls-list">
              ${analysis.recommendations.map(rec => `<li style="color: #1e40af;">${rec}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      `;
    });
    
    return html;
  }
  
  function formatCookiesAnalysis(cookies) {
    if (!cookies || cookies.length === 0) {
      return '<p>No cookies detected.</p>';
    }
    
    let html = '';
    
    cookies.forEach((cookie, index) => {
      const securityFlags = [];
      if (cookie.httpOnly) securityFlags.push('httpOnly');
      if (cookie.secure) securityFlags.push('secure');
      if (cookie.sameSite) securityFlags.push(`sameSite=${cookie.sameSite}`);
      
      const securityStatus = securityFlags.length > 0 ? 
        `<span style="color: #10b981; font-weight: 500;">✅ ${securityFlags.join(', ')}</span>` :
        `<span style="color: #ef4444; font-weight: 500;">⚠️ No security flags</span>`;
      
      html += `
        <div class="cookielens-framework-section">
          <div class="cookielens-framework-header">
            <h5>${cookie.name}</h5>
            ${securityStatus}
          </div>
          <div class="cookielens-controls-section">
            <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
              <strong>Domain:</strong> ${cookie.domain || 'N/A'}<br>
              <strong>Path:</strong> ${cookie.path || 'N/A'}<br>
              <strong>Expires:</strong> ${cookie.expires || 'Session'}<br>
              <strong>Value:</strong> ${cookie.value ? cookie.value.substring(0, 50) + (cookie.value.length > 50 ? '...' : '') : 'N/A'}
            </p>
          </div>
        </div>
      `;
    });
    
    return html;
  }
  
  function formatThirdPartiesAnalysis(thirdParties) {
    if (!thirdParties || thirdParties.length === 0) {
      return '<p>No third-party services detected.</p>';
    }
    
    // Group by category
    const categories = {
      'Analytics': [],
      'Advertising': [],
      'Social Media': [],
      'CDN': [],
      'Other': []
    };
    
    thirdParties.forEach(domain => {
      const lowerDomain = domain.toLowerCase();
      if (lowerDomain.includes('analytics') || lowerDomain.includes('google-analytics') || lowerDomain.includes('gtag')) {
        categories['Analytics'].push(domain);
      } else if (lowerDomain.includes('facebook') || lowerDomain.includes('doubleclick') || lowerDomain.includes('ads')) {
        categories['Advertising'].push(domain);
      } else if (lowerDomain.includes('twitter') || lowerDomain.includes('linkedin') || lowerDomain.includes('instagram')) {
        categories['Social Media'].push(domain);
      } else if (lowerDomain.includes('cloudflare') || lowerDomain.includes('cloudfront') || lowerDomain.includes('cdn')) {
        categories['CDN'].push(domain);
      } else {
        categories['Other'].push(domain);
      }
    });
    
    let html = '';
    
    Object.entries(categories).forEach(([category, domains]) => {
      if (domains.length > 0) {
        html += `
          <div class="cookielens-framework-section">
            <h5 style="margin: 0 0 8px 0; color: #1f2937;">${category} (${domains.length})</h5>
            <ul class="cookielens-controls-list">
              ${domains.map(domain => `<li style="color: #374151; font-size: 12px; margin: 2px 0;">${domain}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    });
    
    return html;
  }
  
  function formatLimitations(limitations) {
    if (!limitations || limitations.length === 0) {
      return '<p>No limitations reported.</p>';
    }
    
    return `
      <div class="cookielens-recommendations-section">
        <ul class="cookielens-controls-list">
          ${limitations.map(limitation => `<li style="color: #374151; font-size: 12px; margin: 2px 0;">${limitation}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  function addToggleFunctionality(shadowRoot, toggleId, contentId) {
    const toggle = shadowRoot.getElementById(toggleId);
    const content = shadowRoot.getElementById(contentId);
    
    if (toggle && content) {
      const icon = toggle.querySelector('.cookielens-expand-icon');
      
      toggle.addEventListener('click', () => {
        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';
        icon.textContent = isExpanded ? '▼' : '▲';
      });
    }
  }
  
  function showLoadingModal(shadowRoot, url) {
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
                <div class="cookielens-log-message">🚀 Starting analysis...</div>
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
  
  function hideLoadingModal(shadowRoot) {
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
