(() => {
  const $ = (sel) => document.querySelector(sel);
  const timeEl = $("#time");
  const statusEl = $("#status");
  const minutesInput = $("#minutes");
  const startBtn = $("#start");
  const pauseBtn = $("#pause");
  const resetBtn = $("#reset");
  const applyBtn = $("#applyDuration");
  const startBell = $("#startBell");
  const endBell = $("#endBell");
  const themeToggle = $("#themeToggle");

  let durationSec = 10 * 60; // default 10m
  let remainingSec = durationSec;
  let timerId = null;
  let endAt = null; // high-precision end timestamp
  const TICK_MS = 200; // update rate

  // Progress ring setup
  const progressEl = document.getElementById("progress");
  // r = 54 => circumference ~ 339.292
  const circumference = 2 * Math.PI * 54;
  if (progressEl) {
    progressEl.style.strokeDasharray = `${circumference}`;
    // Start empty; will fill toward 0 offset
    progressEl.style.strokeDashoffset = `${circumference}`;
  }

  function format(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function setStatus(text) {
    // trigger a small status change animation
    statusEl.classList.remove("status-change");
    // force reflow to restart animation
    void statusEl.offsetWidth;
    statusEl.textContent = text;
    statusEl.classList.add("status-change");
  }

  function updateDisplay() {
    timeEl.textContent = format(remainingSec);
    document.title = `${timeEl.textContent} • Meditation Timer`;
    updateProgress();
  }

  // Theme handling: auto/light/dark
  const THEME_KEY = "meditation-theme"; // values: auto|light|dark
  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(pref) {
    const root = document.documentElement;
    if (pref === 'auto' || !pref) {
      root.removeAttribute('data-theme');
      updateThemeButton('auto');
    } else if (pref === 'light') {
      root.setAttribute('data-theme', 'light');
      updateThemeButton('light');
    } else {
      root.setAttribute('data-theme', 'dark');
      updateThemeButton('dark');
    }
  }
  function cycleTheme() {
    const current = localStorage.getItem(THEME_KEY) || 'auto';
    const next = current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }
  function updateThemeButton(pref) {
    if (!themeToggle) return;
    const t = pref === 'auto' ? getSystemTheme() : pref;
    themeToggle.title = `Theme: ${pref[0].toUpperCase()}${pref.slice(1)}`;
    themeToggle.querySelector('.icon').textContent = t === 'dark' ? '🌙' : '🌞';
  }
  themeToggle && themeToggle.addEventListener('click', cycleTheme);

  // Basic WebAudio bell
  function bell({ freq = 432, duration = 1.2, type = "sine", volume = 0.08 } = {}) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = volume;
      o.connect(g).connect(ctx.destination);
      const now = ctx.currentTime;
      o.start(now);
      // Exponential decay envelope
      g.gain.setValueAtTime(volume, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      o.stop(now + duration + 0.05);
      // auto-close context after sound
      setTimeout(() => ctx.close().catch(() => {}), (duration + 0.1) * 1000);
    } catch (_) {
      /* ignore */
    }
  }

  function applyDuration(min) {
    const clamped = Math.max(1, Math.min(180, Math.floor(min)));
    minutesInput.value = String(clamped);
    durationSec = clamped * 60;
    remainingSec = durationSec;
    updateDisplay();
    setStatus("Ready");
    resetBtn.disabled = true;
    pauseBtn.disabled = true;
    document.body.classList.remove("running");
  }

  function start() {
    if (timerId) return; // already running
    if (remainingSec <= 0) remainingSec = durationSec;
    endAt = performance.now() + remainingSec * 1000;
    timerId = setInterval(tick, TICK_MS);
    setStatus("In session");
    startBtn.textContent = "Resume";
    startBtn.disabled = true; // avoid double starts; re-enabled on pause
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    document.body.classList.add("running");
    if (startBell.checked) bell({ freq: 528, duration: 0.5, volume: 0.06 });
  }

  function pause() {
    if (!timerId) return;
    clearInterval(timerId);
    timerId = null;
    // Recompute remaining using endAt
    remainingSec = Math.max(0, Math.round((endAt - performance.now()) / 1000));
    setStatus("Paused");
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    document.body.classList.remove("running");
  }

  function reset() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    remainingSec = durationSec;
    updateDisplay();
    setStatus("Ready");
    startBtn.textContent = "Start";
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    document.body.classList.remove("running");
  }

  function tick() {
    const now = performance.now();
    remainingSec = Math.max(0, Math.round((endAt - now) / 1000));
    updateDisplay();
    if (remainingSec <= 0) {
      clearInterval(timerId);
      timerId = null;
      setStatus("Complete");
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      document.body.classList.remove("running");
      if (endBell.checked) bell({ freq: 432, duration: 1.4, volume: 0.07 });
    }
  }

  function updateProgress() {
    if (!progressEl || durationSec <= 0) return;
    const ratio = Math.max(0, Math.min(1, remainingSec / durationSec));
    // Fill from 0% to 100% (offset goes from circumference -> 0)
    const offset = circumference * ratio;
    progressEl.style.strokeDashoffset = `${offset}`;
  }

  // Wire up UI
  applyBtn.addEventListener("click", () => applyDuration(Number(minutesInput.value || 10)));
  minutesInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyDuration(Number(minutesInput.value || 10));
  });
  document.querySelectorAll(".chip").forEach((b) =>
    b.addEventListener("click", () => applyDuration(Number(b.dataset.min)))
  );

  startBtn.addEventListener("click", start);
  pauseBtn.addEventListener("click", pause);
  resetBtn.addEventListener("click", reset);

  // Initialize
  applyDuration(Number(minutesInput.value));
  updateDisplay();
  applyTheme(localStorage.getItem(THEME_KEY) || 'auto');
})();
