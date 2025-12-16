import PCMPlayer from 'pcm-player';

const DEFAULT_SAMPLE_RATE = 44_100;
const DEFAULT_BIT_DEPTH = 16;

let player: PCMPlayer | null = null;

function initializePlayer(): PCMPlayer {
  if (!player) {
    player = new PCMPlayer({
      channels: 1,
      sampleRate: DEFAULT_SAMPLE_RATE,
      flushTime: 200,
      inputCodec: 'Int16', // or the appropriate codec for your use case
      fftSize: 1024        // or the appropriate fftSize for your use case
    });
  }
  return player;
}

function generateTone(
  frequency: number,
  durationSeconds: number,
  sampleRate = DEFAULT_SAMPLE_RATE
): Int16Array {
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const samples = new Int16Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const position = (2 * Math.PI * frequency * index) / sampleRate;
    samples[index] = Math.round(Math.sin(position) * 0x7fff);
  }

  return samples;
}

function playTone(frequency: number, durationSeconds: number): void {
  try {
    const currentPlayer = initializePlayer();
    const tone = generateTone(frequency, durationSeconds);
    currentPlayer.feed(tone.buffer instanceof ArrayBuffer ? tone.buffer : tone.slice().buffer);
  } catch (error) {
    console.error('Error playing tone:', error);
  }
}

function stopPlayer(): void {
  if (player) {
    player.destroy();
    player = null;
  }
}

// Don't auto-play on module load
// playTone(440, 1);

export { generateTone, playTone, stopPlayer, initializePlayer };