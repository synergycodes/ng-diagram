import { readFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'node:path';

const EXAMPLES_DIR = './src/components/angular';

/*
 * @param dirName - The name of the directory in @examples
 * */
export async function loadExamples(dirName: string) {
  const fileMatches = await glob(`${EXAMPLES_DIR}/${dirName}/**/*`, { ignore: '**/*.astro', nodir: true });

  const fileContents = await Promise.all(
    fileMatches.map(async (filePath) => {
      const content = await readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);
      const extension = path.extname(fileName).slice(1);

      return { fileName, content, extension };
    })
  );

  const sortedFileContents = fileContents.sort((a, b) => {
    const extensionOrder = ['ts', 'html', 'css'];
    const aIndex = extensionOrder.indexOf(a.extension);
    const bIndex = extensionOrder.indexOf(b.extension);

    // Sort by extension priority
    if (aIndex !== -1 && bIndex !== -1) {
      if (aIndex !== bIndex) return aIndex - bIndex;
    } else if (aIndex !== -1) {
      return -1;
    } else if (bIndex !== -1) {
      return 1;
    }

    // If same extension or both not in priority list, sort alphabetically by fileName
    return a.fileName.localeCompare(b.fileName);
  });

  return sortedFileContents;
}
