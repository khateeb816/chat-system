chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetch_api") {
    fetch(request.url)
      .then(response => {
        if (!response.ok) {
          throw new Error('API server returned error code: ' + response.status);
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          return response.text();
        }
      })
      .then(data => {
        let messageText = '';
        if (data && typeof data === 'object') {
          // Prioritize actual text/content fields from the API
          messageText = data.question || data.answer || data.message || data.text || data.type || JSON.stringify(data);
        } else {
          messageText = String(data);
        }

        // Limit message text length slightly if too long, to prevent YouTube issues
        if (messageText.length > 200) {
          messageText = messageText.substring(0, 200);
        }

        sendResponse({ success: true, message: messageText });
        
        // Save history in storage for popup status display
        chrome.storage.local.set({ 
          lastSent: Date.now(),
          lastMessage: messageText
        });
      })
      .catch(error => {
        console.error('Error fetching API message:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message port open for async reply
  }
});
