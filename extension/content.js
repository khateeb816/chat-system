let activeTimeout = null;
let isRunning = false;

// Initialize status on load
chrome.storage.local.get(['active', 'apiUrl'], (result) => {
  if (result.active && result.apiUrl) {
    startLoop(result.apiUrl);
  }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'toggle') {
    if (request.active) {
      chrome.storage.local.get(['apiUrl'], (result) => {
        if (result.apiUrl) {
          startLoop(result.apiUrl);
        }
      });
    } else {
      stopLoop();
    }
  }
});

// Monitor storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.active) {
    if (changes.active.newValue) {
      chrome.storage.local.get(['apiUrl'], (result) => {
        if (result.apiUrl) {
          startLoop(result.apiUrl);
        }
      });
    } else {
      stopLoop();
    }
  }
});

function startLoop(apiUrl) {
  if (isRunning) return;
  isRunning = true;
  scheduleNext(apiUrl);
}

function stopLoop() {
  isRunning = false;
  if (activeTimeout) {
    clearTimeout(activeTimeout);
    activeTimeout = null;
  }
}

function scheduleNext(apiUrl) {
  if (!isRunning) return;

  // 30 to 50 seconds random interval
  const minInterval = 30000;
  const maxInterval = 50000;
  const delay = Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval;
  
  activeTimeout = setTimeout(() => {
    if (!isRunning) return;
    executeAction(apiUrl);
  }, delay);
}

function executeAction(apiUrl) {
  chrome.runtime.sendMessage({ action: 'fetch_api', url: apiUrl }, (response) => {
    if (chrome.runtime.lastError) {
      scheduleNext(apiUrl);
      return;
    }

    if (response && response.success && response.message) {
      sendMessageToChat(response.message, () => {
        scheduleNext(apiUrl);
      });
    } else {
      scheduleNext(apiUrl);
    }
  });
}

function sendMessageToChat(msg, callback) {
  try {
    const input = document.querySelector('#input.yt-live-chat-text-input-field-renderer') ||
                  document.querySelector('yt-live-chat-text-input-field-renderer #input') ||
                  document.querySelector('#input[contenteditable="true"]') ||
                  document.querySelector('div[contenteditable="true"]');
                  
    const button = document.querySelector('#send-button button') ||
                   document.querySelector('yt-live-chat-message-input-renderer #send-button button') ||
                   document.querySelector('#send-button') ||
                   document.querySelector('button[aria-label="Send"]');

    if (!input || !button) {
      callback();
      return;
    }

    input.focus();

    // Human typing simulation
    let i = 0;
    const typingSpeedMin = 50;
    const typingSpeedMax = 120;
    
    const interval = setInterval(() => {
      if (!isRunning) {
        clearInterval(interval);
        callback();
        return;
      }

      if (i < msg.length) {
        document.execCommand('insertText', false, msg.charAt(i));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        i++;
      } else {
        clearInterval(interval);
        
        // Wait a tiny human-like delay (e.g. 1-2 seconds) before clicking send
        const sendDelay = Math.floor(Math.random() * 1000) + 1000;
        setTimeout(() => {
          if (isRunning) {
            try {
              button.click();
              console.log('[YT Chat Assistant] Sent message:', msg);
            } catch (err) {
              console.error('[YT Chat Assistant] Click error:', err.message);
            }
          }
          callback();
        }, sendDelay);
      }
    }, Math.floor(Math.random() * (typingSpeedMax - typingSpeedMin)) + typingSpeedMin);

  } catch (error) {
    console.error('[YT Chat Assistant] Execution error:', error);
    callback();
  }
}
