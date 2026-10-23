/* Theme customization: dark/light mode + user-picked accent color, persisted. */
(function(){
  const STORAGE_THEME = 'mdoner_theme';
  const STORAGE_ACCENT = 'mdoner_accent';
  const root = document.documentElement;

  function hexToRgb(hex){
    const m = hex.replace('#','').match(/.{1,2}/g);
    return m ? m.map(x => parseInt(x,16)).join(',') : '210,162,39';
  }

  function applyTheme(mode){
    root.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_THEME, mode);
    const toggle = document.getElementById('theme-toggle');
    if(toggle) toggle.setAttribute('aria-pressed', mode === 'light');
  }

  function applyAccent(hex){
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-rgb', hexToRgb(hex));
    localStorage.setItem(STORAGE_ACCENT, hex);
    const picker = document.getElementById('accent-picker');
    if(picker) picker.value = hex;
    const swatch = document.getElementById('accent-swatch');
    if(swatch) swatch.style.background = hex;
  }

  // init from storage or system preference
  const savedTheme = localStorage.getItem(STORAGE_THEME);
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(savedTheme || (systemPrefersLight ? 'light' : 'dark'));

  const savedAccent = localStorage.getItem(STORAGE_ACCENT);
  if(savedAccent) applyAccent(savedAccent);

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    const picker = document.getElementById('accent-picker');
    if(picker) picker.value = getComputedStyle(root).getPropertyValue('--accent').trim() || '#D2A227';

    if(toggle){
      toggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
      });
    }
    if(picker){
      picker.addEventListener('input', (e) => applyAccent(e.target.value));
    }
  });
})();
