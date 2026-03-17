// Runs in MAIN world at document_start — before YouTube registers its listeners.
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
  if (!location.pathname.startsWith('/watch')) return;

  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return;

  const isWindowed = document.documentElement.classList.contains('yt-max-windowed-fullscreen');

  // W key: toggle windowed fullscreen
  if (e.key === 'w') {
    if (document.fullscreenElement) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('ytmax:toggle'));
    return;
  }

  // F key: if windowed FS is active, disable it first — synchronously, before
  // YouTube's handler runs — so native fullscreen starts from a clean state.
  if (e.key === 'f' && isWindowed) {
    window.dispatchEvent(new CustomEvent('ytmax:disable'));
    // Do NOT stop propagation — let YouTube's F handler proceed normally.
  }
}, true);
