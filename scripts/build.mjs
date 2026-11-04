// Construye Stocka sin dependencias: une src/ en un solo index.html.
//   dist/            → versión web instalable (PWA) para Netlify
//   dist-artifact/   → misma app para publicar como artifact de claude.ai (sin etiquetas PWA)
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const parts = ['src/head.html', 'src/1core.js', 'src/2views.js', 'src/3sheets.js', 'src/4photo.js'].map(read);
const app = parts.join('') + '\n</script>\n</body>\n</html>\n';
// comprobación de sintaxis del JS
new Function(app.split('<script>')[1].split('</script>')[0]);
const version = createHash('sha256').update(app).digest('hex').slice(0, 10);
const pwa = [
  '<link rel="manifest" href="/manifest.webmanifest">',
  '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">',
  '<meta name="apple-mobile-web-app-title" content="Stocka">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="description" content="Lista de mercado, despensa, precios y presupuesto del hogar.">'
].join('\n');
const root = new URL('../', import.meta.url);
for (const d of ['dist', 'dist-artifact']) rmSync(new URL(d, root), { recursive: true, force: true });
mkdirSync(new URL('dist', root)); mkdirSync(new URL('dist-artifact', root));
cpSync(new URL('public', root), new URL('dist', root), { recursive: true });
writeFileSync(new URL('dist/index.html', root), app.replace('<!--PWA-->', pwa));
writeFileSync(new URL('dist/sw.js', root), read('public/sw.js').replace('__VERSION__', version));
writeFileSync(new URL('dist-artifact/index.html', root), app.replace('<!--PWA-->\n', ''));
console.log(`Stocka ${version}: dist/ (${(app.length / 1024).toFixed(0)} KB) y dist-artifact/ listos.`);
