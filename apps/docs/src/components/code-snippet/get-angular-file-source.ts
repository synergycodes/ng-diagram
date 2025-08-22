import { readFile } from 'fs/promises';
import path from 'node:path';

const ANGULAR_DIR = './src/components/angular/';

/*
 * @param relativePath - path to the file relative to the angular directory
 * */
export async function getAngularFileSource(relativePath: string) {
  const absolutePath = path.join(ANGULAR_DIR, relativePath);
  const content = await readFile(absolutePath, 'utf8');
  const extension = path.extname(absolutePath).slice(1);

  return { content, extension };
}
