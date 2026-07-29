import { readFiles } from './read.files.js';

interface InputSource {
  /** Label shown in CLI output: a file path, `<stdin>` or `<text>`. */
  label: string;
  /** Text to process, or `null` when the source could not be read. */
  text: string | null;
  error: string | null;
}

interface ResolveInputsOptions {
  files?: string[];
  text?: string;
  /** Injectable for tests; defaults to `process.stdin`. */
  stdin?: NodeJS.ReadStream;
}

async function readStdin(stream: NodeJS.ReadStream): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Resolve where the text to process comes from, in priority order:
 * `--text`, then file arguments, then piped stdin.
 *
 * Returns an empty array when nothing is available, which callers should treat
 * as a usage error rather than an empty success.
 */
async function resolveInputs(options: ResolveInputsOptions = {}): Promise<InputSource[]> {
  const { files = [], text, stdin = process.stdin } = options;

  if (typeof text === 'string') {
    return [{ label: '<text>', text, error: null }];
  }

  if (files.length > 0) {
    const results = await readFiles(files);
    return results.map(({ path, content, error }) => ({ label: path, text: content, error }));
  }

  if (!stdin.isTTY) {
    return [{ label: '<stdin>', text: await readStdin(stdin), error: null }];
  }

  return [];
}

export { resolveInputs, readStdin, type InputSource, type ResolveInputsOptions };
