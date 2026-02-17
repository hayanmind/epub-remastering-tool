/**
 * TTS (Text-to-Speech) Module
 *
 * Generates speech audio with sync points for EPUB 3 Media Overlays.
 * Uses ElevenLabs API in real mode, or produces realistic mock metadata.
 */

import type { AiConfig, TtsResult, SyncPoint } from '../types.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate TTS audio for the given text.
 *
 * Real mode: calls ElevenLabs API and returns base64-encoded audio with
 * word-level timing.
 * Mock mode: produces a fake base64 payload and realistic sync points
 * computed from the text length.
 */
export async function generateTts(
  text: string,
  config: AiConfig,
): Promise<TtsResult> {
  if (config.useMock) {
    return generateMockTts(text);
  }

  return generateRealTts(text, config);
}

/**
 * Generate a SMIL (Synchronized Multimedia Integration Language) document
 * for EPUB 3 Media Overlays from a TtsResult.
 *
 * @param ttsResult  - The TTS output containing sync points
 * @param chapterId  - The chapter ID used to reference the audio file
 * @returns SMIL XML string
 */
export function generateMediaOverlay(
  ttsResult: TtsResult,
  chapterId: string,
): string {
  const pars = ttsResult.syncPoints
    .map((sp, i) => {
      const clipBegin = formatSmilTime(sp.startTime);
      const clipEnd = formatSmilTime(sp.endTime);
      return `    <par id="par-${i + 1}">
      <text src="${chapterId}.xhtml#seg-${i + 1}" />
      <audio src="audio/${chapterId}.mp3" clipBegin="${clipBegin}" clipEnd="${clipEnd}" />
    </par>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<smil xmlns="http://www.w3.org/ns/SMIL" version="3.0">
  <body>
    <seq id="seq-${chapterId}" epub:textref="${chapterId}.xhtml"
         xmlns:epub="http://www.idpf.org/2007/ops">
${pars}
    </seq>
  </body>
</smil>`;
}

// ---------------------------------------------------------------------------
// Real Implementation (ElevenLabs)
// ---------------------------------------------------------------------------

async function generateRealTts(
  text: string,
  config: AiConfig,
): Promise<TtsResult> {
  const apiKey = config.elevenlabsApiKey;
  if (!apiKey) {
    throw new Error('ElevenLabs API key is required for real TTS generation');
  }

  // Korean female voice - "Rachel" is a commonly available voice.
  // For Korean-optimised output a multilingual model is used.
  const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel
  const modelId = 'eleven_multilingual_v2';

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs API error (${response.status}): ${errorText}`,
    );
  }

  const data = (await response.json()) as {
    audio_base64: string;
    alignment: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
  };

  // Convert character-level alignment to word-level sync points
  const syncPoints = buildSyncPoints(
    data.alignment.characters,
    data.alignment.character_start_times_seconds,
    data.alignment.character_end_times_seconds,
  );

  const duration =
    syncPoints.length > 0 ? syncPoints[syncPoints.length - 1]!.endTime : 0;

  return {
    audioBase64: data.audio_base64,
    duration,
    syncPoints,
  };
}

/**
 * Merge character-level timing into word-level sync points by splitting on
 * whitespace characters.
 */
function buildSyncPoints(
  chars: string[],
  starts: number[],
  ends: number[],
): SyncPoint[] {
  const points: SyncPoint[] = [];
  let wordChars: string[] = [];
  let wordStart = 0;
  let wordEnd = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    if (ch === ' ' || ch === '\n' || ch === '\t') {
      if (wordChars.length > 0) {
        points.push({
          text: wordChars.join(''),
          startTime: wordStart,
          endTime: wordEnd,
        });
        wordChars = [];
      }
    } else {
      if (wordChars.length === 0) {
        wordStart = starts[i]!;
      }
      wordChars.push(ch);
      wordEnd = ends[i]!;
    }
  }

  if (wordChars.length > 0) {
    points.push({
      text: wordChars.join(''),
      startTime: wordStart,
      endTime: wordEnd,
    });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Mock Implementation
// ---------------------------------------------------------------------------

function generateMockTts(text: string): TtsResult {
  // Split text into segments (sentences or clause-sized chunks)
  const segments = splitIntoSegments(text);

  let currentTime = 0;
  const syncPoints: SyncPoint[] = [];

  for (const seg of segments) {
    // Korean speech rate: roughly 3.5~4 characters per second
    const charCount = seg.replace(/\s/g, '').length;
    const duration = Math.max(0.5, charCount / 3.8);

    syncPoints.push({
      text: seg,
      startTime: Math.round(currentTime * 1000) / 1000,
      endTime: Math.round((currentTime + duration) * 1000) / 1000,
    });

    // Small pause between segments
    currentTime += duration + 0.15;
  }

  const totalDuration =
    syncPoints.length > 0 ? syncPoints[syncPoints.length - 1]!.endTime : 0;

  // Generate a small fake base64 payload (header of an MP3 silence frame)
  // This is NOT valid audio but looks plausible in demo/logs
  const fakeHeader = Buffer.from(
    'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjMuMTAwAAAAAAAAAAAAAAA=',
    'base64',
  );
  const audioBase64 = fakeHeader.toString('base64');

  return {
    audioBase64,
    duration: totalDuration,
    syncPoints,
  };
}

/**
 * Split text into sentence-like segments for sync point generation.
 */
function splitIntoSegments(text: string): string[] {
  // Split on Korean/general sentence-ending punctuation
  const raw = text.split(/(?<=[.!?\u3002])\s*/);
  const segments: string[] = [];

  for (const r of raw) {
    const trimmed = r.trim();
    if (!trimmed) continue;

    // If a segment is very long, break it at commas or mid-sentence markers
    if (trimmed.length > 60) {
      const sub = trimmed.split(/(?<=[,\uFF0C\uB2E4\uBA70])\s*/);
      for (const s of sub) {
        const st = s.trim();
        if (st) segments.push(st);
      }
    } else {
      segments.push(trimmed);
    }
  }

  return segments.length > 0 ? segments : [text.trim() || '(empty)'];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a time value in seconds to SMIL clock format (hh:mm:ss.mmm).
 */
function formatSmilTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = s.toFixed(3).padStart(6, '0');
  return `${hh}:${mm}:${ss}`;
}
