document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('api-url');
  const minDelayInput = document.getElementById('min-delay');
  const maxDelayInput = document.getElementById('max-delay');
  const saveBtn = document.getElementById('save-btn');
  const toggleBtn = document.getElementById('toggle-btn');
  const statusDisplay = document.getElementById('status-display');
  const lastSentTime = document.getElementById('last-sent-time');
  const lastMsgLog = document.getElementById('last-msg-log');

  // Load existing configuration
  chrome.storage.local.get(['apiUrl', 'active', 'lastSent', 'lastMessage', 'minDelay', 'maxDelay'], (result) => {
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    }
    
    // Set user values or defaults (60s min, 120s max)
    minDelayInput.value = result.minDelay !== undefined ? result.minDelay : 60;
    maxDelayInput.value = result.maxDelay !== undefined ? result.maxDelay : 120;

    if (result.active) {
      setUIStateActive(true);
    } else {
      setUIStateActive(false);
    }
    if (result.lastSent) {
      lastSentTime.textContent = new Date(result.lastSent).toLocaleTimeString();
    }
    if (result.lastMessage) {
      lastMsgLog.textContent = result.lastMessage;
    }
  });

  // Save Config
  saveBtn.addEventListener('click', () => {
    const url = apiUrlInput.value.trim();
    const minVal = parseInt(minDelayInput.value.trim(), 10);
    const maxVal = parseInt(maxDelayInput.value.trim(), 10);

    if (!url) {
      alert('Please enter a valid API URL');
      return;
    }

    if (isNaN(minVal) || minVal <= 0) {
      alert('Please enter a valid positive number for Min Delay');
      return;
    }

    if (isNaN(maxVal) || maxVal <= 0) {
      alert('Please enter a valid positive number for Max Delay');
      return;
    }

    if (minVal > maxVal) {
      alert('Min Delay cannot be greater than Max Delay');
      return;
    }

    // Extract API origin for dynamic permission request
    let origin = '';
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        origin = `${parsedUrl.protocol}//${parsedUrl.hostname}/`;
      }
    } catch (e) {
      alert('Please enter a valid API URL starting with http:// or https://');
      return;
    }

    const saveConfigAndNotify = () => {
      chrome.storage.local.set({ 
        apiUrl: url,
        minDelay: minVal,
        maxDelay: maxVal
      }, () => {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = 'var(--success-color)';
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = '';
        }, 1000);
      });
    };

    if (origin) {
      // Request permission dynamically for this API origin to stay store-compliant
      chrome.permissions.request({
        origins: [origin]
      }, (granted) => {
        if (granted) {
          saveConfigAndNotify();
        } else {
          const saveAnyway = confirm('Access to the API host was not granted. The extension will not be able to fetch messages unless host permissions are allowed. Save configuration anyway?');
          if (saveAnyway) {
            saveConfigAndNotify();
          }
        }
      });
    } else {
      saveConfigAndNotify();
    }
  });

  // Toggle activation state
  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.get(['active', 'apiUrl'], (result) => {
      const currentActive = !!result.active;
      const url = apiUrlInput.value.trim();
      
      if (!currentActive && !url) {
        alert('Please save a valid API URL first.');
        return;
      }

      const newActive = !currentActive;
      chrome.storage.local.set({ active: newActive }, () => {
        setUIStateActive(newActive);
        
        // Notify any active YouTube live chat tabs of the state update
        chrome.tabs.query({ url: "*://*.youtube.com/live_chat*" }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: "toggle", active: newActive });
          });
        });
      });
    });
  });

  function setUIStateActive(isActive) {
    const btnDot = document.getElementById('btn-dot');
    const btnText = document.getElementById('btn-text');
    const statusDot = document.getElementById('status-dot');

    if (isActive) {
      toggleBtn.classList.add('active');
      btnText.textContent = 'Deactivate Automation';
      
      if (btnDot) btnDot.className = 'indicator-dot active';
      if (statusDot) statusDot.className = 'indicator-dot active';
      
      statusDisplay.innerHTML = `<span class="indicator-dot active" id="status-dot"></span> Active`;
      statusDisplay.style.color = 'var(--success-color)';
    } else {
      toggleBtn.classList.remove('active');
      btnText.textContent = 'Activate Automation';
      
      if (btnDot) btnDot.className = 'indicator-dot inactive';
      if (statusDot) statusDot.className = 'indicator-dot inactive';
      
      statusDisplay.innerHTML = `<span class="indicator-dot inactive" id="status-dot"></span> Inactive`;
      statusDisplay.style.color = 'var(--danger-color)';
    }
  }

  // Listen for storage updates (e.g. from background API fetching) to update popup view in real-time
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.lastSent) {
      lastSentTime.textContent = new Date(changes.lastSent.newValue).toLocaleTimeString();
    }
    if (changes.lastMessage) {
      lastMsgLog.textContent = changes.lastMessage.newValue;
    }
    if (changes.active) {
      setUIStateActive(changes.active.newValue);
    }
  });
});
