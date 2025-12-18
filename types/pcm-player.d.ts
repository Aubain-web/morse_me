declare module 'pcm-player' {
  type Encoding = '16bitInt' | '32bitFloat';

  interface PCMPlayerOptions {
    encoding?: Encoding;
    channels?: number;
    sampleRate?: number;
    flushingTime?: number;
  }

  export default class PCMPlayer {
    constructor(options?: PCMPlayerOptions);
    feed(data: ArrayBuffer | Int16Array | Float32Array): void;
    destroy(): void;
  }
}
