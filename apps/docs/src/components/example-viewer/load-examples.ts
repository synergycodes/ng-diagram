import { glob } from 'glob';
import { readFile } from 'fs/promises';
import path from 'node:path';

const EXAMPLES_DIR = './src/components/angular/examples';

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

  return fileContents;
}
