// src/contexts/KakaoMapContext.tsx
'use client';

import { ReactNode } from 'react';
import { KakaoMapsScriptLoader } from 'react-kakao-maps-sdk';

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

export function KakaoMapProvider({ children }: { children: ReactNode }) {
  if (!KAKAO_APP_KEY) {
    console.error("환경 변수 'NEXT_PUBLIC_KAKAO_APP_KEY'가 설정되지 않았습니다.");
    // 키가 없으면 카카오맵 관련 기능을 제외하고 렌더링합니다.
    return <>{children}</>;
  }

  return (
    <KakaoMapsScriptLoader
      appkey={KAKAO_APP_KEY}
      // 'services' 라이브러리를 로드해야 주소-좌표 변환 기능을 사용할 수 있습니다.
      libraries={['services']}
    >
      {children}
    </KakaoMapsScriptLoader>
  );
}