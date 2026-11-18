import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = new Map([
  ['/', ['index.html', 'text/html']],
  ['/juegos', ['index.html', 'text/html']],
  ['/juegos/', ['index.html', 'text/html']],
  ['/juegos/orbita-muestral', ['orbita-muestral.html', 'text/html']],
  ['/juegos/orbita-muestral/', ['orbita-muestral.html', 'text/html']],
  ['/juegos/orbita.css', ['orbita.css', 'text/css']],
  ['/juegos/orbita.js', ['orbita.js', 'text/javascript']]
]);
const assets = new Map(await Promise.all([...routes].map(async ([path, [file, type]]) => [
  path, { type, bytes: await readFile(new URL('./public/juegos/' + file, import.meta.url)) }
])));

createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
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
    'Content-Type': asset.type + '; charset=utf-8',
    'Content-Length': asset.bytes.length,
    'Cache-Control': 'no-cache'
  });
  res.end(req.method === 'HEAD' ? undefined : asset.bytes);
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => {
  console.log('Juegos de Matemática listo.');
});
