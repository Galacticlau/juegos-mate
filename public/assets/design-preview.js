/* Comparador de propuestas: conserva ambos diseños sin modificar la versión pública. */
(() => {
  const path = location.pathname.replace(/\/$/, '') || '/';
  let design = '3';
  try { design = sessionStorage.getItem('profeclau.design.preview') || '3'; } catch { /* La comparación también funciona sin almacenamiento. */ }
  if (path === '/opcion-1') design = '1';
  if (path === '/opcion-2') design = '2';
  if (path === '/' || path === '/juegos' || path === '/combinado') design = '3';
  try { sessionStorage.setItem('profeclau.design.preview', design); } catch { /* Solo para esta página. */ }
  document.body.classList.toggle('pc-notebook', design !== '1');
  if (design !== '3') {
  const bar = document.createElement('nav');
  bar.className = 'design-comparison';
  bar.setAttribute('aria-label', 'Comparar propuestas de diseño');
  const label = document.createElement('span');
  label.textContent = 'PROFECLAU / PROPUESTAS';
  bar.append(label);
  for (const [number, name] of [['1', '1 · Universo lúdico'], ['2', '2 · Cuaderno de ideas'], ['3', 'Diseño combinado']]) {
    const link = document.createElement('a');
    link.href = number === '3' ? '/' : '/opcion-' + number;
    link.textContent = name;
    if (number === design) link.setAttribute('aria-current', 'page');
    bar.append(link);
  }
  document.body.prepend(bar);
  }
  const home = design === '3' ? '/' : '/opcion-' + design;
  document.querySelectorAll('a[href="/"]').forEach(link => { link.href = home; });
  document.querySelectorAll('a[href="/#juegos"]').forEach(link => { link.href = home + '#juegos'; });
  if (design === '3') {
    const explore = document.querySelector('.pc-nav a[href="/#juegos"]');
    const records = document.querySelector('.pc-nav-tool');
    if (explore) explore.textContent = '01 / Explorar';
    if (records) records.textContent = '02 / Mis logros';
  }
})();
