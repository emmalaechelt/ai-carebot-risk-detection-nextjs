// src/contexts/KakaoMapContext.tsx
'use client';

import { ReactNode } from 'react';
import { KakaoMapsScriptLoader, KakaoMapAPILoader } from 'react-kakao-maps-sdk';

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

export function KakaoMapProvider({ children }: { children: ReactNode }) {
  if (!KAKAO_APP_KEY) {
    // 개발 환경에서는 에러를 명확히 보여주는 것이 좋습니다.
    if (process.env.NODE_ENV === 'development') {
      throw new Error("환경 변수 'NEXT_PUBLIC_KAKAO_APP_KEY'가 설정되지 않았습니다.");
    }
    // 프로덕션에서는 맵 없이 렌더링하거나 다른 처리를 할 수 있습니다.
    return <>{children}</>;
  }

  return (
    <KakaoMapsScriptLoader
      appkey={KAKAO_APP_KEY}
      libraries={['services']} // 'services' 라이브러리(지오코더 등)를 로드합니다.
    >
      <KakaoMapAPILoader>
        {children}
      </KakaoMapAPILoader>
    </KakaoMapsScriptLoader>
  );
}