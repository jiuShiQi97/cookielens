// Background service worker for CookieLens
// Manages DNR rules and storage settings

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
  if (message.type === 'SET_BLOCKING') {
    handleBlockingToggle(message.enabled);
  }
  
  return true; // Keep message channel open for async response
});

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
