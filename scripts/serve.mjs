import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2','.mp3':'audio/mpeg','.wav':'audio/wav'};

export function createServer() {
  return http.createServer(async (req, res) => {
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405, {Allow:'GET, HEAD'});res.end();return;}
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const parts = path.replaceAll('\\','/').split('/');
      if (parts.some(p => p.startsWith('.') && p !== '')) {res.writeHead(403);res.end('Forbidden');return;}
      let file = resolve(publicRoot, '.' + path);
      const rel = relative(publicRoot, file);
      if (rel.startsWith('..'+sep) || rel === '..' || resolve(file) === resolve(publicRoot, '..')) {res.writeHead(403);res.end('Forbidden');return;}
      const info = await stat(file);
      if (info.isDirectory()) {
        if (!path.endsWith('/')) {res.writeHead(302,{Location:path+'/'});res.end();return;}
        file = resolve(file, 'index.html');
      }
      const data = await readFile(file);
      res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (err) {res.writeHead(err instanceof URIError ? 400 : 404);res.end('Not found');}
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173), server = createServer();
  server.on('error',err=>{console.error(err.code==='EADDRINUSE'?`端口 ${port} 已被占用。可设置 PORT 环境变量后重试。`:err.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Interesting Mini Program\nLocal: http://127.0.0.1:${port}\n001: http://127.0.0.1:${port}/apps/001-orbit-garden/\n按 Ctrl+C 停止。`));
}
