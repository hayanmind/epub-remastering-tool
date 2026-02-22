'use client';

import { useMemo } from 'react';

interface WaveformProps {
  playing: boolean;
  progress: number; // 0-100
  barCount?: number;
}

/**
 * CSS 기반 오디오 파형 시각화
 * - barCount개의 bar를 표시
 * - progress에 따라 좌→우로 하이라이트
 * - playing 시 bar 높이 미세 애니메이션
 */
export default function Waveform({ playing, progress, barCount = 20 }: WaveformProps) {
  // 일관된 랜덤 높이 (seed 기반)
  const heights = useMemo(() => {
    const h: number[] = [];
    let seed = 42;
    for (let i = 0; i < barCount; i++) {
      seed = (seed * 16807 + 7) % 2147483647;
      h.push(20 + (seed % 80));
    }
    return h;
  }, [barCount]);

  const activeIndex = Math.floor((progress / 100) * barCount);

  return (
    <div className="flex items-end gap-[2px] h-8">
      {heights.map((h, i) => {
        const isActive = i <= activeIndex;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-300"
            style={{
              height: `${h}%`,
              backgroundColor: isActive ? '#4F46E5' : '#D1D5DB',
              opacity: playing && isActive ? undefined : 1,
              animation: playing && isActive ? `waveformPulse 0.8s ease-in-out ${i * 0.05}s infinite alternate` : 'none',
            }}
          />
        );
      })}
      <style>{`
        @keyframes waveformPulse {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0.6); }
        }
      `}</style>
    </div>
  );
}
