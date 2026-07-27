import { defineConfig } from 'vite';
import { writeFileSync } from 'fs';
import { join } from 'path';

function offlineSWPlugin() {
  let outDir = 'dist';
  return {
    name: 'offline-sw',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir; },
    writeBundle(_, bundle) {
      const files = Object.keys(bundle).filter(f => !f.endsWith('.map'));
      // Relative URLs so the same SW works regardless of base path (/ or /CWGens/)
      const urls = ['./', './favicon.svg', ...files.map(f => './' + f)];
      const cacheName = `cwgens-${Date.now()}`;

      writeFileSync(join(outDir, 'sw.js'), `\
const CACHE = '${cacheName}';
const PRECACHE = ${JSON.stringify(urls)};

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
`);
    },
  };
}

export default defineConfig({
  base: '/CWGens/',
  plugins: [offlineSWPlugin()],
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
