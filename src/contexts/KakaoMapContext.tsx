'use client';

import { ReactNode } from 'react';

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

export function KakaoMapProvider({ children }: { children: ReactNode }) {
  if (!KAKAO_APP_KEY) {
    console.error("환경 변수 'NEXT_PUBLIC_KAKAO_APP_KEY'가 설정되지 않았습니다.");
    return <>{children}</>;
  }

  // react-kakao-maps-sdk v2 이상에서는 스크립트를 자동으로 로드
  return <>{children}</>;
}