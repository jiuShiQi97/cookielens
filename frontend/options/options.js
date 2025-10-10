// CookieLens Options Page Script

document.addEventListener('DOMContentLoaded', function() {
  const autoDetectToggle = document.getElementById('autoDetect');
  const blockNonEssentialToggle = document.getElementById('blockNonEssential');
  const languageSelect = document.getElementById('language');
  const statusDiv = document.getElementById('status');
  
  // Load current settings
  loadSettings();
  
  // Add event listeners
  autoDetectToggle.addEventListener('change', saveSettings);
  blockNonEssentialToggle.addEventListener('change', saveSettings);
  languageSelect.addEventListener('change', saveSettings);
  
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['autoDetect', 'blockNonEssential', 'language']);
      
      autoDetectToggle.checked = result.autoDetect || false;
      blockNonEssentialToggle.checked = result.blockNonEssential || false;
      languageSelect.value = result.language || 'auto';
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      showStatus('Failed to load settings', 'error');
    }
  }
  
  async function saveSettings() {
    try {
      const settings = {
        autoDetect: autoDetectToggle.checked,
        blockNonEssential: blockNonEssentialToggle.checked,
        language: languageSelect.value
      };
      
      await chrome.storage.sync.set(settings);
      showStatus('Settings saved successfully', 'success');
      
      // If blocking is enabled, send message to background script
      if (settings.blockNonEssential) {
        chrome.runtime.sendMessage({ type: 'SET_BLOCKING', enabled: true });
      }
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      showStatus('Failed to save settings', 'error');
    }
  }
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // Hide status after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});
