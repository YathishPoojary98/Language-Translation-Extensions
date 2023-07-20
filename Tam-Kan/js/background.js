// Store the previous tab ID and slider state
let previousTabId = null;
let previousSliderState = false;

// Listen for the onActivated event
chrome.tabs.onActivated.addListener(async function(activeInfo) {
  const currentTabId = activeInfo.tabId;

  // Check if the slider is off and the previous slider state was also off
  if (!(await isSliderOn()) && !previousSliderState) {
    previousTabId = currentTabId;
    previousSliderState = false;
    return;
  }

  // Reload the previous tab only if it exists and the slider is on
  if (previousTabId && previousTabId !== currentTabId && (await isSliderOn())) {
    chrome.tabs.reload(previousTabId);
  }

  // Reset the slider state and previous tab ID
  resetSliderState(currentTabId);

  // Update the previous tab ID and slider state
  previousTabId = currentTabId;
  previousSliderState = await isSliderOn();
});


// Listen for the onUpdated event
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading' && tab.active) {
    // Reset the slider state to false when the page is forcefully refreshed
    resetSliderState(tabId);
  }
});

// Listen for the onMessage event
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getParagraph') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getParagraph' }, function(response) {
          sendResponse(response);
        });
      }
    });
    return true;
  }
});

// Reset the slider state for the specified tab ID
function resetSliderState(tabId) {
  // Set the slider state to false
  chrome.storage.sync.set({ sliderState: false });

  // Reset the slider state for the specified tab
  chrome.tabs.sendMessage(tabId, { action: 'resetSlider' });
}

// Function to check if the slider is on
function isSliderOn() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('sliderState', function(result) {
      const sliderState = result.sliderState;
      resolve(!!sliderState); // Convert the retrieved value to a boolean
    });
  });
}
