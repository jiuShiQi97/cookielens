// Background service worker for CookieLens
// Manages DNR rules, storage settings, and API calls

chrome.runtime.onInstalled.addListener(async () => {
  console.log('CookieLens extension installed');
  
  // Initialize default settings
  await chrome.storage.sync.set({
    blockNonEssential: false,
    language: 'auto'
  });
  
  // Load DNR rules
  await loadDNRRules();
});

// Load DNR rules from JSON file
async function loadDNRRules() {
  try {
    const response = await fetch(chrome.runtime.getURL('content/dnr-rules.json'));
    const rules = await response.json();
    
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules
    });
    
    console.log('DNR rules loaded:', rules.length);
  } catch (error) {
    console.error('Failed to load DNR rules:', error);
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'scanWebsite') {
    handleWebsiteScan(message.url, sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'SET_BLOCKING') {
    handleBlockingToggle(message.enabled);
  }
  
  return true; // Keep message channel open for async response
});

// Handle website scanning via background script
async function handleWebsiteScan(url, sendResponse) {
  console.log('Background script: Scanning website:', url);
  
  try {
    const LOCAL_API_URL = 'http://localhost:8000/scan-with-compliance';
    
    const response = await fetch(LOCAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ web_link: url })
    });
    
    console.log('Background script: API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Background script: API response data:', data);
    
    sendResponse({
      success: true,
      data: data
    });
    
  } catch (error) {
    console.error('Background script: API call failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Toggle blocking based on user choice
async function handleBlockingToggle(enabled) {
  try {
    const ruleIds = [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008];
    
    if (enabled) {
      // Enable blocking rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        enableRuleIds: ruleIds
      });
      console.log('Non-essential cookies blocked');
    } else {
      // Disable blocking rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        disableRuleIds: ruleIds
      });
      console.log('Non-essential cookies allowed');
    }
    
    // Update storage
    await chrome.storage.sync.set({ blockNonEssential: enabled });
    
  } catch (error) {
    console.error('Failed to toggle blocking:', error);
  }
}

// Handle extension icon click (optional)
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
});
