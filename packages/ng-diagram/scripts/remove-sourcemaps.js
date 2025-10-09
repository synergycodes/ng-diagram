import { readdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

async function removeSourceMapsRecursively(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await removeSourceMapsRecursively(fullPath);
    } else if (entry.name.endsWith('.map')) {
      console.log(`Removing: ${fullPath}`);

      await unlink(fullPath);
    } else if (entry.name.endsWith('.mjs') || entry.name.endsWith('.js')) {
      const content = await readFile(fullPath, 'utf-8');
      const cleaned = content.replace(/\/\/# sourceMappingURL=.+\.map\s*$/gm, '');

      if (content !== cleaned) {
        await writeFile(fullPath, cleaned, 'utf-8');

        console.log(`Cleaned sourceMappingURL from: ${fullPath}`);
      }
    }
  }
}

const distPath = join(process.cwd(), 'dist');

console.log('Removing source maps from dist...');

await removeSourceMapsRecursively(distPath);

console.log('Done!');
