import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';
import { readdir, readFile, unlink, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const extractorConfig = ExtractorConfig.loadFileAndPrepare(join(rootDir, 'api-extractor.json'));

console.log('Bundling TypeScript declarations...');

const extractorResult = Extractor.invoke(extractorConfig, {
  localBuild: true,
  showVerboseMessages: false,
});

if (extractorResult.succeeded) {
  console.log('API Extractor completed successfully');

  // Update package.json to point to the bundled .d.ts file
  const packageJsonPath = join(rootDir, 'dist/ng-diagram/package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
  packageJson.types = './ng-diagram.d.ts';

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');

  console.log('Updated package.json types field');

  // Remove old declaration directories
  async function removeDtsFiles(dir, keepFile = null) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && (entry.name === 'core' || entry.name === 'lib')) {
        console.log(`Removing directory: ${fullPath}`);

        await unlink(fullPath).catch(() => {});
        // For directories, we'll use rm -rf since rmdir doesn't work recursively
        const { exec } = await import('child_process');

        await new Promise((resolve) => {
          exec(`rm -rf "${fullPath}"`, resolve);
        });
      } else if (entry.name.endsWith('.d.ts') && entry.name !== keepFile) {
        const basename = entry.name.replace('.d.ts', '');
        if (basename !== 'ng-diagram' && basename !== 'index') {
          console.log(`Removing: ${fullPath}`);
          await unlink(fullPath).catch(() => {});
        }
      }
    }
  }

  const distDir = join(rootDir, 'dist/ng-diagram');
  await removeDtsFiles(distDir, 'ng-diagram.d.ts');

  // Keep only index.d.ts as a re-export
  const indexDtsPath = join(distDir, 'index.d.ts');
  await writeFile(
    indexDtsPath,
    `/**\n * Generated bundle index. Do not edit.\n */\nexport * from './ng-diagram';\n`,
    'utf-8'
  );

  console.log('Cleaned up old declaration files');
  console.log('Done!');
} else {
  console.error('API Extractor completed with errors');
  process.exit(1);
}
