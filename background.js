chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-windowed-fullscreen') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.includes('youtube.com/watch')) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggle' }).catch(() => {});
    }
  }
});
