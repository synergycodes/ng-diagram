import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { minify } from 'terser';

async function minifyFilesRecursively(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await minifyFilesRecursively(fullPath);
    } else if (entry.name.endsWith('.mjs')) {
      console.log(`Minifying: ${fullPath}`);

      const code = await readFile(fullPath, 'utf-8');

      const result = await minify(code, {
        compress: {
          passes: 2,
          pure_getters: true,
          unsafe: false,
        },
        mangle: {
          reserved: [],
        },
        format: {
          comments: false,
        },
      });

      if (result.code) {
        await writeFile(fullPath, result.code, 'utf-8');

        const originalSize = (code.length / 1024).toFixed(2);
        const minifiedSize = (result.code.length / 1024).toFixed(2);
        const saved = ((1 - result.code.length / code.length) * 100).toFixed(1);

        console.log(`  ${originalSize}KB -> ${minifiedSize}KB (saved ${saved}%)`);
      }
    }
  }
}

const distPath = join(process.cwd(), 'dist');

console.log('Minifying .mjs files...');

await minifyFilesRecursively(distPath);

console.log('Done!');
