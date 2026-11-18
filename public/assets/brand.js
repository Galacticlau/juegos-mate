/* Una preferencia de tema para todo ProfeClau, sin depender de servicios externos. */
(() => {
  const themeButton = document.querySelector('.pc-theme');
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    if (themeButton) {
      themeButton.textContent = dark ? '☀' : '☾';
      themeButton.setAttribute('aria-label', dark ? 'Activar tema claro' : 'Activar tema oscuro');
      themeButton.setAttribute('title', dark ? 'Activar tema claro' : 'Activar tema oscuro');
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#171025' : '#f8f5ff');
  };
  let savedTheme;
  try { savedTheme = localStorage.getItem('profeclau.theme.v1'); } catch { /* El tema también funciona sin almacenamiento. */ }
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
  themeButton?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('profeclau.theme.v1', next); } catch { /* Preferencia para esta visita. */ }
  });
})();
