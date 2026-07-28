import { readFile } from 'node:fs/promises';

interface ReadResult {
  path: string;
  /** File contents, or `null` when the file could not be read. */
  content: string | null;
  /** Human-readable reason the file could not be read, or `null` on success. */
  error: string | null;
}

interface ErrnoLike {
  code?: string;
}

/** Turn a raw fs error into something worth showing a CLI user. */
function describeReadError(filePath: string, error: unknown): string {
  const code = (error as ErrnoLike)?.code;

  switch (code) {
    case 'ENOENT':
      return `${filePath}: no such file`;
    case 'EISDIR':
      return `${filePath}: is a directory, not a file`;
    case 'EACCES':
    case 'EPERM':
      return `${filePath}: permission denied`;
    default:
      return `${filePath}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Read every path, in parallel, without letting one bad path sink the batch.
 *
 * Results keep the input order, and failures are reported per file so callers
 * can process what succeeded and still surface what did not.
 */
async function readFiles(filePaths: string[]): Promise<ReadResult[]> {
  return Promise.all(
    filePaths.map(async (filePath): Promise<ReadResult> => {
      try {
        return { path: filePath, content: await readFile(filePath, 'utf-8'), error: null };
      } catch (error) {
        return { path: filePath, content: null, error: describeReadError(filePath, error) };
      }
    })
  );
}

export { readFiles, describeReadError, type ReadResult };
