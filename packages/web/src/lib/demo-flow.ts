'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export type DemoStep = 'idle' | 'upload' | 'convert' | 'preview' | 'report';

/**
 * 원클릭 데모 오케스트레이터
 *
 * - startDemoFlow: 업로드 → 변환 → 미리보기 자동 진행
 * - skipToPreview: 미리보기 바로 이동
 * - skipToReport: 리포트 바로 이동
 */
export function useDemoFlow() {
  const router = useRouter();
  const [step, setStep] = useState<DemoStep>('idle');
  const [isRunning, setIsRunning] = useState(false);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const startDemoFlow = useCallback(async () => {
    setIsRunning(true);

    // Step 1: Navigate to upload
    setStep('upload');
    router.push('/upload');
    await wait(1500);

    // Step 2: Navigate to convert (auto-select sample)
    setStep('convert');
    const demoId = 'demo-' + Date.now();
    router.push(`/convert?job=${demoId}`);
    await wait(8000); // 5-stage simulation takes ~7.5s

    // Step 3: Navigate to preview
    setStep('preview');
    router.push(`/preview?job=${demoId}`);

    setIsRunning(false);
    setStep('idle');
  }, [router]);

  const skipToPreview = useCallback(() => {
    const demoId = 'demo-preview';
    router.push(`/preview?job=${demoId}`);
  }, [router]);

  const skipToReport = useCallback(() => {
    const demoId = 'demo-report';
    router.push(`/report?job=${demoId}`);
  }, [router]);

  return {
    step,
    isRunning,
    startDemoFlow,
    skipToPreview,
    skipToReport,
  };
}
