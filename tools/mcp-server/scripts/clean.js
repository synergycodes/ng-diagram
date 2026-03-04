import { rmSync } from 'fs';

rmSync('dist', { recursive: true, force: true });
