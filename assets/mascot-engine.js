/* Mascot engine v1 — same file for School Toolbox and Personal Hub.
   To add a character, edit only SETTINGS.MASCOTS and upload five sprite sheets.
   No dependencies, network APIs, or server code. */
(function () {
  'use strict';
  const STATES = ['idle', 'work', 'cheer', 'wake', 'sleep'];
  const STORE = (key, value) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (_) {} };
  const READ = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const firstMessage = (message, index) => Array.isArray(message) ? (message[index % (message.length || 1)] || '') : (message || '');

  function create({ settings, spriteArt, bubble, menu, toggle, nameElement, sleepZs,
                    gateSprite, gateBubble, storageKey, followTheme = false,
                    isPaused = () => false }) {
    const available = Object.entries(settings.MASCOTS || {})
      .filter(([id, cfg]) => cfg && cfg.enabled !== false && /^[a-z][a-z0-9_-]*$/.test(id));
    if (!available.length) throw new Error('Enable at least one mascot in SETTINGS.MASCOTS.');
    const lookup = Object.fromEntries(available);
    const defaultId = () => {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      const themeChoice = settings.DEFAULT_MASCOT_BY_THEME?.[theme];
      const choice = themeChoice || settings.DEFAULT_MASCOT;
      return lookup[choice] ? choice : available[0][0];
    };
    let stored = READ(storageKey);
    let chosenId = lookup[stored] ? stored : null;
    let state = 'idle';
    let stateMessageNumber = {work:-1, cheer:-1, wake:-1};
    let idleIndex = 0;
    let waking = false;
    let sleepTimer, stateTimer, wakeTimer;
    let lastMovement = 0;
    let paused = Boolean(isPaused());
    const mascotId = () => chosenId || defaultId();
    const current = () => lookup[mascotId()];
    const path = (id, motion) => `${settings.SPRITE_BASE || './assets/sprites/'}${id}-${motion}.png?v=${encodeURIComponent(settings.SPRITE_VERSION || '1')}`;
    const updateImage = (element, id, motion) => {
      if (!element) return;
      const url = path(id, motion);
      if (element.dataset.requestedSprite !== url) {
        element.dataset.requestedSprite = url;
        element.style.backgroundImage = `url("${url}")`;
      }
    };
    const updateChoices = () => {
      if (!menu) return;
      for (const button of menu.querySelectorAll('[data-mascot]')) {
        const id = button.dataset.mascot;
        const selected = id === (chosenId || (followTheme ? 'auto' : defaultId()));
        button.setAttribute('aria-pressed', String(selected));
        const check = button.querySelector('.mascot-check');
        if (check) check.textContent = selected ? '✓' : '';
      }
    };
    function refresh() {
      const id = mascotId(), cfg = current();
      const motion = state === 'idle' && waking ? 'wake' : state;
      updateImage(spriteArt, id, paused ? 'idle' : motion);
      if (spriteArt) spriteArt.dataset.state = paused ? 'idle' : motion;
      if (nameElement) nameElement.textContent = cfg.label || `${cfg.chip || id} assistant`;
      if (sleepZs) sleepZs.hidden = paused || state !== 'sleep';
      const msg = paused ? '' : state === 'sleep' ? '' : state === 'idle' && waking
        ? firstMessage(cfg.wake, stateMessageNumber.wake)
        : state === 'idle' ? firstMessage(cfg.idle, idleIndex)
        : firstMessage(cfg[state], stateMessageNumber[state] || 0);
      if (bubble) {
        bubble.textContent = msg || ' ';
        bubble.style.visibility = msg ? 'visible' : 'hidden';
      }
      updateImage(gateSprite, id, 'idle');
      if (gateBubble) gateBubble.textContent = cfg.gate || `${cfg.chip || id} on duty!`;
      updateChoices();
    }
    function cancelTimers() { clearTimeout(sleepTimer); clearTimeout(stateTimer); clearTimeout(wakeTimer); }
    function enterState(next) {
      if (paused) return;
      state = next;
      if (next !== 'idle') {
        waking = false;
        clearTimeout(wakeTimer);
        if (next in stateMessageNumber) stateMessageNumber[next] += 1;
      }
      refresh();
    }
    function activity() {
      if (paused) return;
      clearTimeout(sleepTimer);
      if (state === 'sleep') {
        state = 'idle';
        waking = true;
        stateMessageNumber.wake += 1;
        refresh();
        clearTimeout(wakeTimer);
        wakeTimer = setTimeout(() => { waking = false; if (state === 'idle') refresh(); }, 4200);
      }
      sleepTimer = setTimeout(() => { clearTimeout(stateTimer); enterState('sleep'); }, 60000);
    }
    function shortState(next, length) {
      if (paused) return;
      clearTimeout(stateTimer);
      enterState(next);
      activity();
      stateTimer = setTimeout(() => { if (state === next) enterState('idle'); }, length);
    }
    function openMenu(open) {
      if (!menu || !toggle) return;
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) (menu.querySelector('[aria-pressed="true"]') || menu.querySelector('[data-mascot]'))?.focus();
    }
    function select(id) {
      if (id === 'auto' && followTheme) chosenId = null;
      else if (lookup[id]) chosenId = id;
      else return;
      STORE(storageKey, chosenId);
      cancelTimers();
      state = 'idle'; waking = false; idleIndex = 0;
      refresh(); activity(); openMenu(false);
      toggle?.focus();
    }
    if (menu && toggle) {
      menu.replaceChildren();
      const title = document.createElement('div');
      title.className = 'mascot-menu-title'; title.textContent = 'Choose assistant';
      menu.append(title);
      const entries = followTheme ? [['auto', {chip:'Follow theme'}], ...available] : available;
      entries.forEach(([id, cfg]) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'mascot-choice';
        button.dataset.mascot = id;
        const label = document.createElement('span'); label.textContent = cfg.chip || id;
        const check = document.createElement('span'); check.className = 'mascot-check'; check.setAttribute('aria-hidden','true');
        button.append(label, check);
        button.addEventListener('click', () => select(id));
        menu.append(button);
      });
      toggle.addEventListener('click', () => openMenu(menu.hidden));
      document.addEventListener('pointerdown', event => {
        if (!menu.hidden && !menu.parentElement.contains(event.target)) openMenu(false);
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !menu.hidden) { openMenu(false); toggle.focus(); }
      });
    }
    document.addEventListener('pointermove', () => {
      const now = Date.now();
      if (now - lastMovement > 1000) { lastMovement = now; activity(); }
    }, {passive:true});
    for (const name of ['pointerdown','keydown','scroll','touchstart'])
      document.addEventListener(name, activity, {passive:true});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) activity(); });
    setInterval(() => {
      if (paused || state !== 'idle' || waking) return;
      idleIndex++; refresh();
    }, 14000);
    function setPaused(value) {
      paused = Boolean(value);
      cancelTimers();
      state = 'idle'; waking = false;
      refresh();
      if (!paused) activity();
    }
    refresh();
    if (!paused) activity();
    return {
      refresh, activity, setPaused, select,
      work: () => shortState('work', 1600),
      cheer: () => shortState('cheer', 2600),
      endCheer: () => { if (!paused && state === 'cheer') { clearTimeout(stateTimer); enterState('idle'); } },
      currentMascot: mascotId,
      availableMascots: () => available.map(([id]) => id),
      currentState: () => state
    };
  }
  window.ToolboxMascots = Object.freeze({create, STATES});
}());
