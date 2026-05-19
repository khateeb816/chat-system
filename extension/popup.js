document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('api-url');
  const saveBtn = document.getElementById('save-btn');
  const toggleBtn = document.getElementById('toggle-btn');
  const statusDisplay = document.getElementById('status-display');
  const lastSentTime = document.getElementById('last-sent-time');
  const lastMsgLog = document.getElementById('last-msg-log');

  // Load existing configuration
  chrome.storage.local.get(['apiUrl', 'active', 'lastSent', 'lastMessage'], (result) => {
    if (result.apiUrl) {
      apiUrlInput.value = result.apiUrl;
    }
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

  // Save API URL
  saveBtn.addEventListener('click', () => {
    const url = apiUrlInput.value.trim();
    if (!url) {
      alert('Please enter a valid API URL');
      return;
    }
    chrome.storage.local.set({ apiUrl: url }, () => {
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      saveBtn.style.background = 'var(--success-color)';
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
      }, 1000);
    });
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
