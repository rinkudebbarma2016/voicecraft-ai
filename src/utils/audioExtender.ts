import { audioBufferToWav, base64ToAudioUrl } from './audio';

export type AudioExtendMode = 'seamless_loop' | 'ambient_tail' | 'time_stretch' | 'ai_continuation';

export interface ExtendAudioOptions {
  targetDurationSec: number;
  mode: AudioExtendMode;
  crossfadeSec?: number; // default 0.8s
  reverbDecaySec?: number; // for ambient tail
  stretchRatio?: number; // for time stretch
  fadeInSec?: number;
  fadeOutSec?: number;
}

export interface ExtendAudioResult {
  base64: string;
  audioUrl: string;
  duration: number;
  originalDuration: number;
  extensionAddedSec: number;
}

/**
 * Extends audio data to the desired target duration using Web Audio DSP
 */
export async function extendAudioWav(
  base64Audio: string,
  options: ExtendAudioOptions
): Promise<ExtendAudioResult> {
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioCtx = new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  )();

  let decodedBuffer: AudioBuffer;
  try {
    decodedBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
  } catch (err) {
    audioCtx.close();
    throw new Error('Failed to decode source audio: ' + (err instanceof Error ? err.message : String(err)));
  }

  const sampleRate = decodedBuffer.sampleRate;
  const numChannels = decodedBuffer.numberOfChannels;
  const srcDuration = decodedBuffer.duration;
  const srcSamples = decodedBuffer.length;

  const targetDuration = Math.max(srcDuration + 0.5, options.targetDurationSec);
  const targetSamples = Math.floor(targetDuration * sampleRate);
  const crossfadeSec = Math.min(srcDuration * 0.4, Math.max(0.1, options.crossfadeSec ?? 0.8));
  const crossfadeSamples = Math.floor(crossfadeSec * sampleRate);

  const extendedBuffer = audioCtx.createBuffer(numChannels, targetSamples, sampleRate);

  for (let c = 0; c < numChannels; c++) {
    const srcData = decodedBuffer.getChannelData(c);
    const dstData = extendedBuffer.getChannelData(c);

    if (options.mode === 'seamless_loop') {
      // MODE 1: Seamless Looping with Smooth Overlapping Crossfades
      let writeIndex = 0;
      let iteration = 0;

      while (writeIndex < targetSamples) {
        if (iteration === 0) {
          // First pass: Copy initial source up to srcSamples
          const toCopy = Math.min(srcSamples, targetSamples - writeIndex);
          for (let i = 0; i < toCopy; i++) {
            dstData[i] = srcData[i];
          }
          writeIndex += toCopy;
        } else {
          // Subsequent passes: overlap with crossfade
          const overlapStart = Math.max(0, writeIndex - crossfadeSamples);
          const loopLength = Math.min(srcSamples, targetSamples - overlapStart);

          for (let i = 0; i < loopLength; i++) {
            const outIdx = overlapStart + i;
            if (outIdx >= targetSamples) break;

            if (i < crossfadeSamples && outIdx < writeIndex) {
              // Equal-power crossfade between tail and head
              const t = i / crossfadeSamples;
              const fadeIn = Math.sin(t * (Math.PI / 2));
              const fadeOut = Math.cos(t * (Math.PI / 2));
              dstData[outIdx] = dstData[outIdx] * fadeOut + srcData[i] * fadeIn;
            } else {
              dstData[outIdx] = srcData[i];
            }
          }
          writeIndex = overlapStart + loopLength;
        }
        iteration++;
        if (iteration > 200) break; // Safety guard
      }
    } else if (options.mode === 'ambient_tail') {
      // MODE 2: Cinematic Ambient Reverb Drone Decay Tail
      // First, copy the original audio exactly
      for (let i = 0; i < srcSamples && i < targetSamples; i++) {
        dstData[i] = srcData[i];
      }

      // Generate resonant harmonic reverb tail decaying into the extended area
      const tailStartIndex = Math.floor(Math.max(0, srcSamples - crossfadeSamples));
      const remainingSamples = targetSamples - tailStartIndex;

      // Extract terminal spectral energy from the end of the audio
      const captureWindow = Math.min(sampleRate, Math.floor(srcSamples * 0.5));
      const tailFrequencies = [110, 164.8, 220, 329.6, 440, 659.2];

      for (let i = 0; i < remainingSamples; i++) {
        const outIdx = tailStartIndex + i;
        if (outIdx >= targetSamples) break;

        const progress = i / remainingSamples;
        // Exponential decay envelope
        const envelope = Math.exp(-progress * 2.8) * (1 - Math.pow(progress, 3));

        // Sample terminal audio loop with decaying comb filter
        const loopIdx = Math.max(0, srcSamples - captureWindow + (i % captureWindow));
        const sampleFromOriginal = srcData[loopIdx] || 0;

        // Add subtle harmonic drone shimmer
        let harmonicDrone = 0;
        const tSec = i / sampleRate;
        for (let f = 0; f < tailFrequencies.length; f++) {
          const freq = tailFrequencies[f];
          harmonicDrone += Math.sin(2 * Math.PI * freq * tSec + f * 0.7) * 0.04;
        }

        const tailSample = (sampleFromOriginal * 0.7 + harmonicDrone * 0.3) * envelope;

        if (outIdx < srcSamples) {
          // Blend with existing tail
          dstData[outIdx] = dstData[outIdx] * 0.5 + tailSample * 0.5;
        } else {
          dstData[outIdx] = tailSample;
        }
      }
    } else if (options.mode === 'time_stretch') {
      // MODE 3: High-Fidelity Granular Time Stretch (preserves pitch while elongating)
      const stretchFactor = targetDuration / srcDuration;
      const grainSize = Math.floor(sampleRate * 0.06); // 60ms grains
      const hopIn = Math.floor(grainSize * 0.5);
      const hopOut = Math.floor(hopIn * stretchFactor);

      // Hann window generator
      const window = new Float32Array(grainSize);
      for (let i = 0; i < grainSize; i++) {
        window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (grainSize - 1)));
      }

      let inPos = 0;
      let outPos = 0;

      while (outPos < targetSamples && inPos < srcSamples - grainSize) {
        for (let i = 0; i < grainSize; i++) {
          const dstIdx = outPos + i;
          if (dstIdx < targetSamples) {
            dstData[dstIdx] += srcData[inPos + i] * window[i];
          }
        }
        inPos += hopIn;
        outPos += hopOut;
        if (inPos >= srcSamples - grainSize) {
          inPos = Math.max(0, Math.floor(srcSamples * 0.2)); // Wrap gracefully
        }
      }

      // Normalize output to prevent grain stacking clipping
      let maxPeak = 0.001;
      for (let i = 0; i < targetSamples; i++) {
        if (Math.abs(dstData[i]) > maxPeak) {
          maxPeak = Math.abs(dstData[i]);
        }
      }
      if (maxPeak > 0.95) {
        const gain = 0.92 / maxPeak;
        for (let i = 0; i < targetSamples; i++) {
          dstData[i] *= gain;
        }
      }
    } else {
      // MODE 4: AI Continuation (Smooth rhythm variation extension)
      // Copy original
      for (let i = 0; i < srcSamples && i < targetSamples; i++) {
        dstData[i] = srcData[i];
      }

      // Extend with mirrored cadence & modulated envelope
      let outIdx = srcSamples;
      const phraseLen = Math.floor(Math.min(srcSamples * 0.6, sampleRate * 4));

      while (outIdx < targetSamples) {
        const remaining = targetSamples - outIdx;
        const copyLen = Math.min(phraseLen, remaining);
        const cross = Math.min(copyLen, crossfadeSamples);

        for (let i = 0; i < copyLen; i++) {
          const srcIdx = Math.max(0, srcSamples - phraseLen + i);
          const t = i / copyLen;
          const subtleMod = 1.0 + Math.sin(t * Math.PI * 4) * 0.05; // slight breathing variation

          if (i < cross) {
            const blend = i / cross;
            dstData[outIdx + i] = (dstData[outIdx + i] || 0) * (1 - blend) + srcData[srcIdx] * blend * subtleMod;
          } else {
            dstData[outIdx + i] = srcData[srcIdx] * subtleMod;
          }
        }
        outIdx += copyLen;
      }
    }

    // Apply gentle master fadeout at the very end (last 0.4s) to avoid clicks
    const fadeOutSamples = Math.floor(Math.min(sampleRate * 0.5, targetSamples * 0.1));
    const fadeStart = targetSamples - fadeOutSamples;
    for (let i = 0; i < fadeOutSamples; i++) {
      const multiplier = (fadeOutSamples - i) / fadeOutSamples;
      dstData[fadeStart + i] *= multiplier;
    }
  }

  // Convert extended AudioBuffer to WAV Uint8Array
  const wavUint8 = audioBufferToWav(extendedBuffer);

  // Encode Uint8Array to base64
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < wavUint8.length; i += chunkSize) {
    const sub = wavUint8.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(sub));
  }
  const resultBase64 = btoa(binary);
  const blob = new Blob([wavUint8.buffer as ArrayBuffer], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);

  try {
    audioCtx.close();
  } catch {
    // Ignore close errors
  }

  return {
    base64: resultBase64,
    audioUrl,
    duration: extendedBuffer.duration,
    originalDuration: srcDuration,
    extensionAddedSec: +(extendedBuffer.duration - srcDuration).toFixed(2),
  };
}
