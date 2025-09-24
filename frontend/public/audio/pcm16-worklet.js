class PCM16Worklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bytesPerSample = 2; // 16-bit
    this.frameSize = 16000 * 0.02; // 20ms @ 16kHz = 320 samples
    this._buffer = new Float32Array(0);
  }
  
  static get parameterDescriptors() { 
    return []; 
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    
    const channel = input[0]; // mono
    
    // concat to internal buffer
    const merged = new Float32Array(this._buffer.length + channel.length);
    merged.set(this._buffer, 0);
    merged.set(channel, this._buffer.length);
    this._buffer = merged;

    // slice out 20ms frames, convert to PCM16, post to main thread
    while (this._buffer.length >= this.frameSize) {
      const chunk = this._buffer.slice(0, this.frameSize);
      this._buffer = this._buffer.slice(this.frameSize);

      const pcm16 = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      
      // send Uint8Array to main thread
      this.port.postMessage(new Uint8Array(pcm16.buffer));
    }
    
    return true;
  }
}

registerProcessor('pcm16-worklet', PCM16Worklet);
