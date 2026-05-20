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

  chrome.storage.local.get(['minDelay', 'maxDelay'], (result) => {
    if (!isRunning) return;

    // Load custom values or fall back to defaults (60s min, 120s max)
    const minSec = result.minDelay !== undefined ? Number(result.minDelay) : 60;
    const maxSec = result.maxDelay !== undefined ? Number(result.maxDelay) : 120;

    // Convert to milliseconds
    const minInterval = Math.max(1, minSec) * 1000;
    const maxInterval = Math.max(1, maxSec) * 1000;

    // Safely compute the min and max limits
    const actualMin = Math.min(minInterval, maxInterval);
    const actualMax = Math.max(minInterval, maxInterval);

    // Calculate a random delay between the limits
    const delay = Math.floor(Math.random() * (actualMax - actualMin)) + actualMin;
    
    console.log(`[YT Chat Assistant] Next fetch scheduled in ${(delay / 1000).toFixed(1)} seconds (Active Range: ${minSec}s - ${maxSec}s)`);

    activeTimeout = setTimeout(() => {
      if (!isRunning) return;
      executeAction(apiUrl);
    }, delay);
  });
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
