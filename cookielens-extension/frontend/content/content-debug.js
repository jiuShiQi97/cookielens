// CookieLens Content Script - Debug Version
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
  
  function createSimpleModalHTML() {
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
            <button class="cookielens-button cookielens-button-secondary" id="cookielens-test-api">
              🧪 Test API Connection
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
    
    // Test API button
    shadowRoot.getElementById('cookielens-test-api').addEventListener('click', () => {
      testAPIConnection(shadowRoot);
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
  
  async function testAPIConnection(shadowRoot) {
    const statusDiv = shadowRoot.getElementById('cookielens-status');
    const testButton = shadowRoot.getElementById('cookielens-test-api');
    
    showStatus(statusDiv, 'Testing API connection...', 'info');
    testButton.disabled = true;
    testButton.textContent = 'Testing...';
    
    try {
      console.log('CookieLens: Testing API connection...');
      
      const response = await fetch('https://kr9knqhdha.execute-api.us-east-1.amazonaws.com/prod/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com'
        })
      });
      
      console.log('CookieLens: API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('CookieLens: API response data:', data);
        showStatus(statusDiv, '✅ API connection successful!', 'success');
      } else {
        console.error('CookieLens: API error:', response.status, response.statusText);
        showStatus(statusDiv, `❌ API error: ${response.status} ${response.statusText}`, 'error');
      }
    } catch (error) {
      console.error('CookieLens: API connection failed:', error);
      showStatus(statusDiv, `❌ Connection failed: ${error.message}`, 'error');
    } finally {
      testButton.disabled = false;
      testButton.textContent = '🧪 Test API Connection';
    }
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
    
    console.log('CookieLens: Scanning website:', url);
    
    // Call Lambda API
    fetch('https://kr9knqhdha.execute-api.us-east-1.amazonaws.com/prod/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url
      })
    })
    .then(response => {
      console.log('CookieLens: Response received:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('CookieLens: Scan completed:', data);
      
      showStatus(statusDiv, 'Analysis completed successfully!', 'success');
      
      // Show simple results
      showSimpleResults(shadowRoot, data);
      
    })
    .catch(error => {
      console.error('CookieLens: Scan failed:', error);
      showStatus(statusDiv, `Analysis failed: ${error.message}`, 'error');
    })
    .finally(() => {
      scanButton.disabled = false;
      scanButton.textContent = '🔍 Analyze Privacy & Compliance';
    });
  }
  
  function showSimpleResults(shadowRoot, data) {
    const cookies = data.cookies || [];
    const thirdParties = data.thirdParties || [];
    const analysis = data.humanReadableAnalysis || 'No analysis available';
    
    const resultsHTML = `
      <div style="text-align: left; margin-top: 20px;">
        <h3 style="text-align: center; margin-bottom: 16px;">📊 Analysis Results</h3>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">🍪 Cookies Found: ${cookies.length}</h4>
          ${cookies.length > 0 ? `
            <ul style="margin: 0; padding-left: 20px;">
              ${cookies.map(cookie => `
                <li style="margin: 4px 0; font-size: 12px;">
                  <strong>${cookie.name}</strong> 
                  ${cookie.httpOnly ? '🔒' : ''} 
                  ${cookie.secure ? '🔐' : ''} 
                  ${cookie.sameSite ? `🛡️` : ''}
                </li>
              `).join('')}
            </ul>
          ` : '<p style="margin: 0; font-size: 12px; color: #6b7280;">No cookies detected</p>'}
        </div>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">🌐 Third-Party Services: ${thirdParties.length}</h4>
          ${thirdParties.length > 0 ? `
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              ${thirdParties.slice(0, 5).join(', ')}${thirdParties.length > 5 ? '...' : ''}
            </p>
          ` : '<p style="margin: 0; font-size: 12px; color: #6b7280;">No third-party services detected</p>'}
        </div>
        
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">🤖 AI Analysis</h4>
          <p style="margin: 0; font-size: 12px; color: #374151; line-height: 1.4;">
            ${analysis.length > 200 ? analysis.substring(0, 200) + '...' : analysis}
          </p>
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
