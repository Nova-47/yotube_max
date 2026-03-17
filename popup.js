const STORAGE_KEY = 'ytMaxEnabled';

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function init() {
  const tab = await getCurrentTab();
  const isYouTubeWatch = tab?.url?.includes('youtube.com/watch');

  if (!isYouTubeWatch) {
    document.getElementById('main-controls').style.display = 'none';
    document.getElementById('not-youtube').style.display = 'block';
    return;
  }

  const result = await chrome.storage.local.get([STORAGE_KEY]);
  const toggleBtn = document.getElementById('toggle-btn');
  toggleBtn.checked = !!result[STORAGE_KEY];

  // User clicks the popup toggle
  toggleBtn.addEventListener('change', () => {
    const action = toggleBtn.checked ? 'enable' : 'disable';
    chrome.tabs.sendMessage(tab.id, { action }).catch(() => {});
  });

  // Keep checkbox in sync if state changes via W key or player button
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && STORAGE_KEY in changes) {
      toggleBtn.checked = !!changes[STORAGE_KEY].newValue;
    }
  });
}

init();
