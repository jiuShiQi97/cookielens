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
        max-width: 320px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        position: relative;
        text-align: center;
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
            <h2 class="cookielens-modal-title">Cookie Info Summary</h2>
            <p class="cookielens-modal-description">Cookie policy extracted and saved locally</p>
          </div>
          
          <div class="cookielens-buttons">
            <button class="cookielens-button cookielens-button-primary" id="cookielens-extract">
              Extract Policy
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
    // Extract policy button
    shadowRoot.getElementById('cookielens-extract').addEventListener('click', () => {
      extractCookiePolicy();
    });
    
    // Close button
    shadowRoot.getElementById('cookielens-close').addEventListener('click', () => {
      closeModal();
    });
    
    // Close on backdrop click
    shadowRoot.querySelector('.cookielens-modal').addEventListener('click', (e) => {
      if (e.target.classList.contains('cookielens-modal')) {
        closeModal();
      }
    });
  }
  
  
  function extractCookiePolicy() {
    console.log('CookieLens: Extracting cookie policy...');
    
    try {
      // Extract cookie policy information
      const policyData = {
        url: window.location.href,
        domain: window.location.hostname,
        timestamp: new Date().toISOString(),
        cookies: extractCookies(),
        scripts: extractScripts(),
        policyLinks: findPolicyLinks(),
        bannerText: extractBannerText()
      };
      
      // Save to local storage
      savePolicyToLocal(policyData);
      
      // Download as JSON file
      downloadPolicyFile(policyData);
      
      console.log('CookieLens: Policy extracted successfully', policyData);
      
    } catch (error) {
      console.error('CookieLens: Failed to extract policy:', error);
    }
  }
  
  function extractCookies() {
    const cookies = [];
    if (document.cookie) {
      const cookieStrings = document.cookie.split(';');
      cookieStrings.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name) {
          cookies.push({
            name: name.trim(),
            value: value ? value.trim() : '',
            domain: window.location.hostname
          });
        }
      });
    }
    return cookies;
  }
  
  function extractScripts() {
    const scripts = [];
    const scriptTags = document.querySelectorAll('script[src]');
    scriptTags.forEach(script => {
      try {
        const url = new URL(script.src);
        scripts.push({
          src: script.src,
          hostname: url.hostname,
          domain: url.hostname
        });
      } catch (e) {
        // Ignore invalid URLs
      }
    });
    return scripts;
  }
  
  function findPolicyLinks() {
    const policyLinks = [];
    const links = document.querySelectorAll('a[href*="cookie"], a[href*="privacy"], a[href*="policy"]');
    links.forEach(link => {
      policyLinks.push({
        text: link.textContent.trim(),
        href: link.href,
        title: link.title || ''
      });
    });
    return policyLinks;
  }
  
  function extractBannerText() {
    const bannerTexts = [];
    
    // Look for cookie banner text
    const cookieTextPatterns = [
      'cookie', 'cookies', 'consent', 'privacy', 'gdpr',
      'cookie', 'cookies', '同意', '隐私', '数据'
    ];
    
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
      const text = element.textContent.toLowerCase();
      for (const pattern of cookieTextPatterns) {
        if (text.includes(pattern) && isVisible(element)) {
          const buttons = element.querySelectorAll('button');
          if (buttons.length > 0) {
            bannerTexts.push({
              text: element.textContent.trim(),
              buttons: Array.from(buttons).map(btn => btn.textContent.trim())
            });
            break;
          }
        }
      }
    }
    
    return bannerTexts;
  }
  
  function savePolicyToLocal(policyData) {
    try {
      // Save to Chrome storage
      chrome.storage.local.set({
        [`cookiePolicy_${policyData.domain}_${Date.now()}`]: policyData
      });
      
      console.log('CookieLens: Policy saved to Chrome storage');
    } catch (error) {
      console.error('CookieLens: Failed to save to storage:', error);
    }
  }
  
  function downloadPolicyFile(policyData) {
    try {
      const blob = new Blob([JSON.stringify(policyData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cookie-policy-${policyData.domain}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('CookieLens: Policy file downloaded');
    } catch (error) {
      console.error('CookieLens: Failed to download file:', error);
    }
  }
  
  function closeModal() {
    const shadowHost = document.getElementById('cookielens-shadow-host');
    if (shadowHost) {
      shadowHost.remove();
    }
  }
  
})();
