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
    // Check if we've already shown modal for this host
    checkModalStatus();
    
    // Use event delegation to catch clicks on potential cookie banner buttons
    document.addEventListener('click', handlePotentialCookieBannerClick, true);
    
    // Auto-detect cookie banners on page load
    autoDetectCookieBanner();
    
    console.log('CookieLens: Banner detection initialized');
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
    
    // Show our modal
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
  
  // Auto-detect cookie banners on page load
  async function autoDetectCookieBanner() {
    if (modalShown) return;
    
    // Check if auto-detection is enabled
    try {
      const result = await chrome.storage.sync.get(['autoDetect']);
      if (!result.autoDetect) {
        console.log('CookieLens: Auto-detection disabled');
        return;
      }
    } catch (error) {
      console.warn('CookieLens: Failed to check auto-detection setting:', error);
      return;
    }
    
    // Wait a bit for page to fully load
    setTimeout(() => {
      const cookieBanner = findCookieBanner();
      if (cookieBanner) {
        console.log('CookieLens: Auto-detected cookie banner');
        showExplanationModal();
      }
    }, 2000); // Wait 2 seconds for banners to appear
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
    
    // Add event listeners
    setupModalEventListeners(shadowRoot);
    
    // Mark as shown
    setModalShown();
  }
  
  function getModalCSS() {
    return `
      .cookielens-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      
      .cookielens-modal-content {
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 420px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        position: relative;
        text-align: center;
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
        .cookielens-modal-content {
          margin: 16px;
          padding: 20px;
        }
      }
    `;
  }
  
  function createSimpleModalHTML() {
    return `
      <div class="cookielens-modal">
        <div class="cookielens-modal-content">
          <div class="cookielens-modal-header">
            <h2 class="cookielens-modal-title">CookieLens Scanner</h2>
            <p class="cookielens-modal-description">Enter a website URL to analyze privacy and cookie usage</p>
          </div>
          
          <div class="cookielens-input-section">
            <input type="url" id="cookielens-url-input" class="cookielens-url-input" 
                   placeholder="https://example.com" value="${window.location.href}">
            <div class="cookielens-status" id="cookielens-status"></div>
          </div>
          
          <div class="cookielens-buttons">
            <button class="cookielens-button cookielens-button-primary" id="cookielens-scan">
              Analyze Privacy
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
    
    // Enter key support for URL input
    shadowRoot.getElementById('cookielens-url-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        scanWebsite(shadowRoot);
      }
    });
    
    // Close on backdrop click
    shadowRoot.querySelector('.cookielens-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('cookielens-modal')) {
        closeModal();
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
    showStatus(statusDiv, 'Analyzing website privacy...', 'info');
    
    console.log('CookieLens: Scanning website:', url);
    
    // Call backend API
    fetch('http://localhost:8000/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        web_link: url
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('CookieLens: Scan completed:', data);
      showStatus(statusDiv, 'Analysis completed successfully!', 'success');
      
      // Show results with human-readable analysis
      showScanResults(shadowRoot, data);
      
    })
    .catch(error => {
      console.error('CookieLens: Scan failed:', error);
      showStatus(statusDiv, `Scan failed: ${error.message}`, 'error');
    })
    .finally(() => {
      scanButton.disabled = false;
      scanButton.textContent = 'Scan Website';
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
    // Extract humanReadableAnalysis from response
    const analysis = data.humanReadableAnalysis || 'No analysis available';
    const url = data.url || 'Unknown URL';
    const scannedAt = data.scannedAt || new Date().toISOString();
    
    // Create results modal with human-readable analysis
    const resultsHTML = `
      <div class="cookielens-results">
        <h3>Privacy Analysis Report</h3>
        <div class="cookielens-analysis-header">
          <div class="cookielens-analysis-info">
            <strong>Website:</strong> ${url}<br>
            <strong>Scanned:</strong> ${new Date(scannedAt).toLocaleString()}
          </div>
        </div>
        <div class="cookielens-analysis-content">
          <h4>Analysis Summary</h4>
          <div class="cookielens-analysis-text">
            ${formatAnalysisText(analysis)}
          </div>
        </div>
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
