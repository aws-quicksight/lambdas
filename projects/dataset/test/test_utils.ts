/* eslint-disable n/no-sync */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, type URL } from 'node:url';

/**
 * Get filename for a given file path URL
 */
const getFilename = (url: string | URL): string => {
  return fileURLToPath(url);
};

/**
 * Get dirname for a given file path URL
 */
const getDirname = (url: string | URL): string => {
  return path.dirname(getFilename(url));
};

export const filePath = (append = ''): string => path.join(getDirname(import.meta.url), '_files', append);

export const fileContent = (file: string, encoding: BufferEncoding = 'binary'): string => {
  if (!existsSync(file)) {
    console.error(`File ${file} does not exist`);

    return '';
  }

  return readFileSync(file, encoding);
};

export const fileContents = (append: string, encoding: BufferEncoding = 'binary'): string =>
  fileContent(filePath(append), encoding);
