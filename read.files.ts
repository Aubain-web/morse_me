import { readFile } from 'fs/promises';

async function readFiles(filePaths: string[]): Promise<string[]> {
    const fileContents: string[] = [];
    for (const path of filePaths) {
        const content = await readFile(path, 'utf-8');
        fileContents.push(content);
    }
    return fileContents;
}

export { readFiles };