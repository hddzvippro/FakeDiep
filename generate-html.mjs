import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const assetsDir = path.join(distDir, 'assets');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found! Run npm run build first.');
  process.exit(1);
}

let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Find CSS file
const files = fs.readdirSync(assetsDir);
const cssFile = files.find(f => f.endsWith('.css'));
const jsFile = files.find(f => f.endsWith('.js'));

if (cssFile) {
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
  // Replace <link rel="stylesheet" ...> with inline <style>
  html = html.replace(/<link[^>]+rel="stylesheet"[^>]+>/i, `<style>\n${cssContent}\n</style>`);
}

if (jsFile) {
  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
  // Replace <script type="module" crossorigin src="..."></script> with inline <script type="module">
  html = html.replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/i, `<script type="module">\n${jsContent}\n</script>`);
}

// Add metadata and offline resilience banner in head
const bannerComment = `<!--
=============================================================
ARRAS.IO MULTIPLAYER STANDALONE HTML EDITION
- Đầy đủ hơn 40 xe tăng, 9 chế độ chơi, cheat codes, âm thanh
- Mở trực tiếp trên mọi trình duyệt hoặc deploy lên GitHub Pages!
- Tự động kết nối tới Server Online để chơi cùng bạn bè.
=============================================================
-->`;

html = html.replace('<head>', `<head>\n  ${bannerComment}`);

const outputPath = path.resolve('arras-io-online.html');
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Successfully generated ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
