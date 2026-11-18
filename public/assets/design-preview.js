/* Comparador de propuestas: conserva ambos diseños sin modificar la versión pública. */
(() => {
  const path = location.pathname.replace(/\/$/, '') || '/';
  let design = '2';
  try { design = sessionStorage.getItem('profeclau.design.preview') || '2'; } catch { /* La comparación también funciona sin almacenamiento. */ }
  if (path === '/opcion-1') design = '1';
  if (path === '/' || path === '/juegos' || path === '/opcion-2') design = '2';
  try { sessionStorage.setItem('profeclau.design.preview', design); } catch { /* Solo para esta página. */ }
  document.body.classList.toggle('pc-notebook', design === '2');
  const bar = document.createElement('nav');
  bar.className = 'design-comparison';
  bar.setAttribute('aria-label', 'Comparar propuestas de diseño');
  const label = document.createElement('span');
  label.textContent = 'DOS MANERAS DE JUGAR CON LAS IDEAS';
  bar.append(label);
  for (const [number, name] of [['1', '1 · Universo lúdico'], ['2', '2 · Cuaderno de ideas']]) {
    const link = document.createElement('a');
    link.href = '/opcion-' + number;
    link.textContent = name;
    if (number === design) link.setAttribute('aria-current', 'page');
    bar.append(link);
  }
  document.body.prepend(bar);
  const home = '/opcion-' + design;
  document.querySelectorAll('a[href="/"]').forEach(link => { link.href = home; });
  document.querySelectorAll('a[href="/#juegos"]').forEach(link => { link.href = home + '#juegos'; });
})();
