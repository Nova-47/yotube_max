(() => {
  'use strict';

  const HTML_CLASS  = 'yt-max-windowed-fullscreen';
  const STORAGE_KEY = 'ytMaxEnabled';
  const BTN_ID      = 'yt-max-player-btn';

  let enabled      = false;
  let transitioning = false;
  let styleEl      = null;
  let closeBtn     = null;

  // ── Animation constants ──────────────────────────────────────────────────────
  const ANIM_MS     = 300;
  const ANIM_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

  const UI_SELECTORS = [
    '#masthead-container', 'ytd-guide-renderer', 'tp-yt-app-drawer',
    'ytd-mini-guide-renderer', '#secondary', '#below', 'ytd-watch-metadata',
    'ytd-merch-shelf-renderer', '#chat', '#chatframe',
    'ytd-engagement-panel-section-list-renderer',
  ].join(', ');

  // CSS injected at animation start: player fixed at its *current* rect, UI ready to fade
  function buildEnterInitCSS(rect) {
    const t = rect ? `${rect.top}px`    : '0';
    const l = rect ? `${rect.left}px`   : '0';
    const w = rect ? `${rect.width}px`  : '100vw';
    const h = rect ? `${rect.height}px` : '100vh';
    return `
      ${UI_SELECTORS} {
        transition: opacity ${ANIM_MS}ms ${ANIM_EASING} !important;
      }
      ytd-player, ytd-player #container { overflow: visible !important; }
      #movie_player {
        position: fixed !important;
        top: ${t} !important; left: ${l} !important;
        width: ${w} !important; height: ${h} !important;
        max-width: none !important; max-height: none !important;
        z-index: 9999 !important;
        transition:
          top ${ANIM_MS}ms ${ANIM_EASING},
          left ${ANIM_MS}ms ${ANIM_EASING},
          width ${ANIM_MS}ms ${ANIM_EASING},
          height ${ANIM_MS}ms ${ANIM_EASING} !important;
      }
    `;
  }

  // CSS injected one rAF later: triggers the transition to fullscreen
  function buildEnterTargetCSS() {
    return `
      ${UI_SELECTORS} {
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity ${ANIM_MS}ms ${ANIM_EASING} !important;
      }
      ytd-player, ytd-player #container { overflow: visible !important; }
      #movie_player {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        width: 100vw !important; height: 100vh !important;
        max-width: none !important; max-height: none !important;
        z-index: 9999 !important;
        transition:
          top ${ANIM_MS}ms ${ANIM_EASING},
          left ${ANIM_MS}ms ${ANIM_EASING},
          width ${ANIM_MS}ms ${ANIM_EASING},
          height ${ANIM_MS}ms ${ANIM_EASING} !important;
      }
    `;
  }

  // ── CSS ─────────────────────────────────────────────────────────────────────
  const FULLSCREEN_CSS = `
    html.${HTML_CLASS},
    html.${HTML_CLASS} body {
      overflow: hidden !important;
    }

    html.${HTML_CLASS} #masthead-container,
    html.${HTML_CLASS} ytd-guide-renderer,
    html.${HTML_CLASS} tp-yt-app-drawer,
    html.${HTML_CLASS} ytd-mini-guide-renderer,
    html.${HTML_CLASS} #secondary,
    html.${HTML_CLASS} #below,
    html.${HTML_CLASS} ytd-watch-metadata,
    html.${HTML_CLASS} ytd-merch-shelf-renderer,
    html.${HTML_CLASS} #chat,
    html.${HTML_CLASS} #chatframe,
    html.${HTML_CLASS} ytd-engagement-panel-section-list-renderer {
      display: none !important;
    }

    /* Let parent containers overflow so #movie_player can escape */
    html.${HTML_CLASS} ytd-player,
    html.${HTML_CLASS} ytd-player #container {
      overflow: visible !important;
    }

    /* Pin the actual player element directly — YouTube JS manages this element's size */
    html.${HTML_CLASS} #movie_player {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      z-index: 9999 !important;
      transform: none !important;
    }

    /* Fill the video and its container */
    html.${HTML_CLASS} #movie_player .html5-video-container,
    html.${HTML_CLASS} #movie_player video {
      width: 100% !important;
      height: 100% !important;
    }

    html.${HTML_CLASS} #movie_player video {
      object-fit: contain !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
    }

    /* Active state: player button turns bright */
    #${BTN_ID}.yt-max-active svg path {
      fill: #fff;
      opacity: 1 !important;
    }
  `;

  // ── Player control bar button ────────────────────────────────────────────────
  // SVG: 4 corner L-shapes (windowed fullscreen icon)
  const BTN_SVG = `
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <path fill="white" d="M2,2 h6 v2 H4 v4 H2 Z M22,2 h-6 v2 h4 v4 h2 Z M2,22 h6 v-2 H4 v-4 H2 Z M22,22 h-6 v-2 h4 v-4 h2 Z"/>
    </svg>
  `;

  function createPlayerButton() {
    const btn = document.createElement('button');
    btn.id        = BTN_ID;
    btn.className = 'ytp-button';
    btn.title     = 'Windowed Fullscreen (W)';
    btn.setAttribute('aria-label', 'Windowed Fullscreen');
    btn.style.cssText = 'width:40px; padding:0; opacity:0.9;';
    btn.innerHTML = BTN_SVG;
    btn.onclick   = toggle;
    return btn;
  }

  function syncPlayerButton() {
    const btn = document.getElementById(BTN_ID);
    if (!btn) return;
    btn.classList.toggle('yt-max-active', enabled);
    btn.title = enabled ? 'Exit Windowed Fullscreen (W)' : 'Windowed Fullscreen (W)';
  }

  function injectPlayerButton() {
    // Remove stale button if any
    document.getElementById(BTN_ID)?.remove();

    // Insert just before the native fullscreen button
    const fsBtn = document.querySelector('.ytp-fullscreen-button');
    if (!fsBtn) return;

    const btn = createPlayerButton();
    btn.classList.toggle('yt-max-active', enabled);
    fsBtn.insertAdjacentElement('beforebegin', btn);
  }

  // Retry until the player controls are in the DOM
  function tryInjectButton(retries = 30, interval = 300) {
    if (document.querySelector('.ytp-fullscreen-button')) {
      injectPlayerButton();
    } else if (retries > 0) {
      setTimeout(() => tryInjectButton(retries - 1, interval), interval);
    } else {
      console.warn('[YouTube Max] Could not find .ytp-fullscreen-button after retries. Button not injected.');
    }
  }

  // ── Floating close button (visible while in windowed FS) ────────────────────
  function createCloseButton() {
    const btn = document.createElement('button');
    btn.id    = 'yt-max-close-btn';
    btn.title = 'Exit Windowed Fullscreen (W)';
    btn.textContent = '✕';
    btn.style.cssText = `
      position: fixed; top: 12px; right: 16px; z-index: 10000;
      background: rgba(0,0,0,0.55); color: #fff; border: none;
      border-radius: 50%; width: 36px; height: 36px;
      font-size: 16px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    `;
    btn.onmouseenter = () => { btn.style.background = 'rgba(200,0,0,0.85)'; };
    btn.onmouseleave = () => { btn.style.background = 'rgba(0,0,0,0.55)'; };
    btn.onclick = disable;
    return btn;
  }

  // ── Enable / Disable (instant — used on navigation / programmatic calls) ────
  function enableNow() {
    if (enabled) return;
    enabled = true;

    styleEl = document.createElement('style');
    styleEl.id = 'yt-max-style';
    styleEl.textContent = FULLSCREEN_CSS;
    document.head.appendChild(styleEl);

    document.documentElement.classList.add(HTML_CLASS);
    window.dispatchEvent(new Event('resize'));

    closeBtn = createCloseButton();
    document.body.appendChild(closeBtn);
    requestAnimationFrame(() => requestAnimationFrame(() => { closeBtn.style.opacity = '1'; }));

    syncPlayerButton();
    safeCall(() => chrome.storage.local.set({ [STORAGE_KEY]: true }));
  }

  function disableNow() {
    if (!enabled) return;
    enabled = false;
    transitioning = false; // reset in case we're aborting mid-animation

    document.documentElement.classList.remove(HTML_CLASS);
    styleEl?.remove();  styleEl  = null;
    closeBtn?.remove(); closeBtn = null;

    window.dispatchEvent(new Event('resize'));
    syncPlayerButton();
    safeCall(() => chrome.storage.local.set({ [STORAGE_KEY]: false }));
  }

  // ── Animated Enable ─────────────────────────────────────────────────────────
  // Player expands from its natural viewport position to 100vw × 100vh.
  // UI elements fade out simultaneously via opacity transition.
  // After the transition, stable display:none CSS is swapped in (no visual change).
  function enable() {
    if (enabled || transitioning) return;
    transitioning = true;

    const player = document.querySelector('#movie_player');
    const rect   = player?.getBoundingClientRect();

    // 1. Inject initial-state CSS: player fixed at current rect, UI at natural opacity
    const animEl = document.createElement('style');
    animEl.id = 'yt-max-anim';
    animEl.textContent = buildEnterInitCSS(rect);
    document.head.appendChild(animEl);

    // Force reflow so the browser registers the initial state before we change it
    void player?.offsetWidth;

    // 2. One double-rAF later: update CSS to trigger the transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        animEl.textContent = buildEnterTargetCSS();

        // 3. After transition completes: swap to stable CSS (display:none, no transition)
        setTimeout(() => {
          // Apply stable CSS first so the player never loses its position
          enableNow();
          animEl.remove();
          transitioning = false;
        }, ANIM_MS + 40);
      });
    });
  }

  // ── Animated Disable ────────────────────────────────────────────────────────
  // A semi-transparent dark overlay fades in over the player, state is reverted
  // instantly at peak opacity, then the overlay fades back out. Fast (×2 × 150ms).
  function disable() {
    if (!enabled || transitioning) return;
    transitioning = true;

    const FADE = Math.round(ANIM_MS * 0.5); // 150 ms

    const overlay = document.createElement('div');
    overlay.id = 'yt-max-exit-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: #000; z-index: 99998;
      pointer-events: none; opacity: 0;
      transition: opacity ${FADE}ms ease;
    `;
    document.body.appendChild(overlay);

    // Fade in the overlay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { overlay.style.opacity = '0.82'; });
    });

    // At peak opacity: revert state, then fade the overlay back out
    setTimeout(() => {
      disableNow();

      requestAnimationFrame(() => { overlay.style.opacity = '0'; });

      setTimeout(() => {
        overlay.remove();
        transitioning = false;
      }, FADE + 20);
    }, FADE);
  }

  function toggle() {
    enabled ? disable() : enable();
  }

  // ── Safe wrapper for chrome API calls ──────────────────────────────────────
  // Extension context can be invalidated when the extension is reloaded while
  // the tab is still open. Wrapping chrome.* calls prevents uncaught errors.
  function safeCall(fn) {
    try { fn(); } catch (e) {
      if (e.message?.includes('Extension context invalidated')) return;
      console.error('[YouTube Max] chrome API error:', e);
      throw e;
    }
  }

  // ── Events ──────────────────────────────────────────────────────────────────
  // W key → toggle, F key while windowed FS active → disable (from key_interceptor.js)
  window.addEventListener('ytmax:toggle', toggle);
  window.addEventListener('ytmax:disable', disable);

  // Safety net: if fullscreen is triggered by the player button (not keyboard),
  // disable windowed FS before the fullscreen layer causes a visual conflict.
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement && enabled) disableNow();
  });

  // Alt+W global shortcut (background.js) + explicit enable/disable from popup
  safeCall(() => chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'toggle')  toggle();
    if (msg.action === 'enable')  enable();   // animated
    if (msg.action === 'disable') disable();  // animated
  }));

  // Re-inject player button after YouTube SPA navigation
  window.addEventListener('yt-navigate-finish', () => {
    if (!location.pathname.startsWith('/watch')) return;
    if (enabled) disableNow(); // instant — no animation on page navigation
    tryInjectButton();
    // Restore persisted state for the new video
    safeCall(() => chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) enableNow();
    }));
  });

  // Re-inject if the controls get re-rendered (e.g. switching to/from theater).
  // Observe only the player area instead of the entire body for performance.
  // Track the observer so we can disconnect before re-attaching on SPA navigation
  // (otherwise observers accumulate and fire redundantly).
  let controlsObserver = null;

  function observeControls() {
    controlsObserver?.disconnect();
    const playerContainer = document.querySelector('ytd-player, #player-container');
    if (!playerContainer) return;
    controlsObserver = new MutationObserver(() => {
      if (location.pathname.startsWith('/watch') && !document.getElementById(BTN_ID)) {
        if (document.querySelector('.ytp-fullscreen-button')) injectPlayerButton();
      }
    });
    controlsObserver.observe(playerContainer, { childList: true, subtree: true });
  }

  window.addEventListener('yt-navigate-finish', observeControls);
  window.addEventListener('beforeunload', () => controlsObserver?.disconnect());
  observeControls();

  // ── Init ────────────────────────────────────────────────────────────────────
  if (location.pathname.startsWith('/watch')) {
    tryInjectButton();
    safeCall(() => chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) enableNow(); // no animation on initial page load
    }));
  }
})();
