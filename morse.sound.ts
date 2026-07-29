import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MORSE_CODE, TIMING } from './library.js';

interface PlayOptions {
  frequencyHz?: number;
  unitMs?: number;
  sampleRateHz?: number;
  outFile?: string;
  play?: boolean;
}

interface BeepStep {
  on: boolean;
  ms: number;
}

interface PlayResult {
  /** Path of the WAV kept on disk, or `''` when nothing was kept. */
  wavPath: string;
  played: boolean;
}

/**
 * Turn text into an on/off beep schedule.
 *
 * Gaps are *owed* rather than emitted eagerly: the largest pending gap wins and
 * is only flushed right before the next tone. That keeps the standard Morse
 * spacing exact — 1 unit between symbols, 3 between letters, 7 between words —
 * instead of letting a letter gap and a word gap stack up to 10. It also means
 * the schedule never starts or ends on silence.
 */
function buildBeepSchedule(text: string, unitMs: number): BeepStep[] {
  const schedule: BeepStep[] = [];
  let pendingGapUnits = 0;
  let hasTone = false;

  const append = (on: boolean, units: number) => {
    if (units <= 0) return;
    const ms = Math.max(0, Math.round(units * unitMs));
    if (ms === 0) return;

    const last = schedule[schedule.length - 1];
    if (last && last.on === on) {
      last.ms += ms;
    } else {
      schedule.push({ on, ms });
    }
  };

  /** Remember a gap; overlapping gaps collapse to the longest one required. */
  const owe = (units: number) => {
    if (!hasTone) return; // no leading silence
    pendingGapUnits = Math.max(pendingGapUnits, units);
  };

  const emitTone = (units: number) => {
    append(false, pendingGapUnits);
    pendingGapUnits = 0;
    append(true, units);
    hasTone = true;
  };

  const isWhitespace = (char: string) => char === ' ' || char === '\t';

  for (const rawChar of text) {
    if (rawChar === '\r') continue;

    // A newline separates words just like a space does.
    if (rawChar === '\n' || isWhitespace(rawChar)) {
      owe(TIMING.WORD_SPACE);
      continue;
    }

    const entry = MORSE_CODE[rawChar.toUpperCase()];
    if (!entry) {
      // Unsupported characters are dropped; the CLI reports them separately.
      continue;
    }

    for (let symbolIndex = 0; symbolIndex < entry.pattern.length; symbolIndex += 1) {
      if (symbolIndex > 0) {
        owe(TIMING.INTRA_CHAR_SPACE);
      }

      emitTone(entry.pattern[symbolIndex] === '-' ? TIMING.DASH : TIMING.DOT);
    }

    owe(TIMING.LETTER_SPACE);
  }

  return schedule;
}

function encodeWavPcm16Mono(samples: Int16Array, sampleRateHz: number): Buffer {
  const bytesPerSample = 2;
  const headerSize = 44;
  const dataSize = samples.length * bytesPerSample;

  const buffer = Buffer.allocUnsafe(headerSize + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(headerSize + dataSize - 8, 4);
  buffer.write('WAVE', 8);

  // fmt chunk (PCM)
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // audio format = PCM
  buffer.writeUInt16LE(1, 22); // channels
  buffer.writeUInt32LE(sampleRateHz, 24);
  buffer.writeUInt32LE(sampleRateHz * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(samples[i] ?? 0, headerSize + i * 2);
  }

  return buffer;
}

function renderMorseWavSamples(
  text: string,
  options: Required<Pick<PlayOptions, 'frequencyHz' | 'unitMs' | 'sampleRateHz'>>
): Int16Array {
  const schedule = buildBeepSchedule(text, options.unitMs);
  if (schedule.length === 0) {
    return new Int16Array(0);
  }

  const sampleRateHz = options.sampleRateHz;
  const totalSamples = schedule.reduce(
    (sum, step) => sum + Math.floor((step.ms * sampleRateHz) / 1000),
    0
  );

  const samples = new Int16Array(Math.max(0, totalSamples));
  const frequency = options.frequencyHz;
  const amplitude = 0x3fff;

  let offset = 0;
  for (const step of schedule) {
    const count = Math.floor((step.ms * sampleRateHz) / 1000);
    if (count <= 0) continue;

    if (!step.on) {
      offset += count;
      continue;
    }

    for (let i = 0; i < count; i += 1) {
      const t = (offset + i) / sampleRateHz;
      samples[offset + i] = Math.round(Math.sin(2 * Math.PI * frequency * t) * amplitude);
    }

    offset += count;
  }

  return samples;
}

async function tryPlayFileWithCommand(command: string, args: string[]): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'ignore' });
      child.on('error', reject);
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(String(code)))));
    });
    return true;
  } catch {
    return false;
  }
}

async function playWavFileCrossPlatform(wavPath: string): Promise<boolean> {
  if (process.platform === 'win32') {
    const ps = [
      "$ErrorActionPreference = 'Stop'",
      `$p = ${JSON.stringify(wavPath)}`,
      '$sp = New-Object System.Media.SoundPlayer($p)',
      '$sp.Load()',
      '$sp.PlaySync()',
    ].join('; ');

    return tryPlayFileWithCommand('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      ps,
    ]);
  }

  if (process.platform === 'darwin') {
    return tryPlayFileWithCommand('afplay', [wavPath]);
  }

  // linux / other unix
  if (await tryPlayFileWithCommand('paplay', [wavPath])) return true;
  if (await tryPlayFileWithCommand('aplay', [wavPath])) return true;
  if (await tryPlayFileWithCommand('ffplay', ['-nodisp', '-autoexit', wavPath])) return true;
  return false;
}

async function playMorseFromText(text: string, options: PlayOptions = {}): Promise<PlayResult> {
  const frequencyHz = options.frequencyHz ?? 800;
  const unitMs = options.unitMs ?? 80;
  const sampleRateHz = options.sampleRateHz ?? 44_100;
  const shouldPlay = options.play ?? true;

  const samples = renderMorseWavSamples(text, { frequencyHz, unitMs, sampleRateHz });
  if (samples.length === 0) {
    return { wavPath: '', played: false };
  }

  if (!shouldPlay && !options.outFile) {
    return { wavPath: '', played: false };
  }

  const wav = encodeWavPcm16Mono(samples, sampleRateHz);

  const isExplicitOutput = Boolean(options.outFile);
  const wavPath = isExplicitOutput
    ? path.resolve(options.outFile as string)
    : path.join(os.tmpdir(), `morse_it_${process.pid}_${Date.now()}.wav`);

  await fs.writeFile(wavPath, wav);

  try {
    let played = false;
    if (shouldPlay) {
      played = await playWavFileCrossPlatform(wavPath);
    }

    // Only return a path when the user explicitly requested it.
    return { wavPath: isExplicitOutput ? wavPath : '', played };
  } finally {
    // Never leave temp audio files behind on users' machines.
    if (!isExplicitOutput) {
      await fs.rm(wavPath, { force: true });
    }
  }
}

export {
  playMorseFromText,
  buildBeepSchedule,
  encodeWavPcm16Mono,
  renderMorseWavSamples,
  type BeepStep,
  type PlayOptions,
  type PlayResult,
};
