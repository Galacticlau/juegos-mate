import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = new Map([
  ['/', ['index.html', 'text/html']],
  ['/juegos', ['index.html', 'text/html']],
  ['/juegos/', ['index.html', 'text/html']],
  ['/opcion-1', ['opcion-1.html', 'text/html']],
  ['/opcion-1/', ['opcion-1.html', 'text/html']],
  ['/opcion-2', ['index.html', 'text/html']],
  ['/opcion-2/', ['index.html', 'text/html']],
  ['/juegos/orbita-muestral', ['orbita-muestral.html', 'text/html']],
  ['/juegos/orbita-muestral/', ['orbita-muestral.html', 'text/html']],
  ['/juegos/orbita.css', ['orbita.css', 'text/css']],
  ['/juegos/orbita.js', ['orbita.js', 'text/javascript']],
  ['/tarjetas-nfc', ['registro-nfc.html', 'text/html']],
  ['/tarjetas-nfc/', ['registro-nfc.html', 'text/html']],
  ['/tarjetas-nfc/registro.css', ['registro-nfc.css', 'text/css']],
  ['/tarjetas-nfc/registro.js', ['registro-nfc.js', 'text/javascript']]
]);
for (const [file, type] of [
  ['brand.css', 'text/css'],
  ['brand.js', 'text/javascript'],
  ['catalog.css', 'text/css'],
  ['catalog.js', 'text/javascript'],
  ['notebook.css', 'text/css'],
  ['notebook.js', 'text/javascript'],
  ['design-preview.js', 'text/javascript'],
  ['profeclau-logo.png', 'image/png']
]) routes.set('/assets/' + file, ['../assets/' + file, type]);
for (const [path, file, type] of [
  ['/juegos/crucigrama', 'index.html', 'text/html'],
  ['/juegos/crucigrama/', 'index.html', 'text/html'],
  ['/juegos/crucigrama/style.css', 'style.css', 'text/css'],
  ['/juegos/crucigrama/data.js', 'data.js', 'text/javascript'],
  ['/juegos/crucigrama/crossword.js', 'crossword.js', 'text/javascript'],
  ['/juegos/crucigrama/app.js', 'app.js', 'text/javascript']
]) routes.set(path, ['crucigrama/' + file, type]);
for (const [path, file, type] of [
  ['/juegos/cofres-del-orden', 'index.html', 'text/html'],
  ['/juegos/cofres-del-orden/', 'index.html', 'text/html'],
  ['/juegos/cofres/style.css', 'style.css', 'text/css'],
  ['/juegos/cofres/app.js', 'app.js', 'text/javascript']
]) routes.set(path, ['cofres/' + file, type]);
const assets = new Map(await Promise.all([...routes].map(async ([path, [file, type]]) => [
  path, { type, bytes: await readFile(new URL('./public/juegos/' + file, import.meta.url)) }
])));

createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const nfcPage = path === '/tarjetas-nfc' || path === '/tarjetas-nfc/';
  const crucigrama = path.startsWith('/juegos/crucigrama') || path.startsWith('/juegos/cofres');
  const policy = crucigrama
    ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    : nfcPage
    ? "default-src 'self'; script-src 'self' https://script.google.com https://script.googleusercontent.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
    : "default-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
  res.setHeader('Content-Security-Policy', policy);
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(req.method === 'HEAD' ? undefined : '{"ok":true}');
    return;
  }
  const asset = assets.get(path);
  if (!asset) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Página no encontrada');
    return;
  }
  res.writeHead(200, {
    'Content-Type': asset.type + (asset.type.startsWith('text/') ? '; charset=utf-8' : ''),
    'Content-Length': asset.bytes.length,
    'Cache-Control': 'no-cache'
  });
  res.end(req.method === 'HEAD' ? undefined : asset.bytes);
}).listen(Number(process.env.PORT || (process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : 3000)), '0.0.0.0', () => {
  console.log('Juegos de Matemática listo.');
});
