// src/contexts/KakaoMapContext.tsx

'use client';

import Script from 'next/script';
import { ReactNode, useState } from 'react';

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
const KAKAO_SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services&autoload=false`;

export default function KakaoMapContext({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!KAKAO_APP_KEY || KAKAO_APP_KEY.includes("여기에")) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-red-100 text-red-700">
        <div className="text-center">
          <h2 className="text-xl font-bold">오류: 카카오 API 키가 설정되지 않았습니다.</h2>
          <p className="mt-2">프로젝트의 .env.local 파일에 유효한 NEXT_PUBLIC_KAKAO_APP_KEY를 설정해주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
      return (
          <div className="flex h-screen w-full flex-col items-center justify-center bg-red-100 text-red-700">
              <h2 className="text-xl font-bold">오류: 카카오 지도 API를 불러오는 데 실패했습니다.</h2>
              <p className="mt-4 text-sm">1. .env.local 파일의 카카오 JavaScript 키가 올바른지 확인해주세요.</p>
              <p className="text-sm">2. 카카오 개발자 사이트의 Web 플랫폼 도메인에 http://localhost:3000 이 등록되었는지 확인해주세요.</p>
              <p className="mt-2 text-xs">({error})</p>
          </div>
      );
  }

  return (
    <>
      <Script
        src={KAKAO_SDK_URL}
        // ✅ [핵심 수정] "beforeInteractive" 전략을 제거합니다. 
        //    (기본값인 "afterInteractive"가 자동으로 적용됩니다.)
        // strategy="beforeInteractive" 
        onLoad={() => {
          window.kakao.maps.load(() => {
            console.log("✅ Kakao Map API가 성공적으로 초기화되었습니다.");
            setIsLoaded(true);
          });
        }}
        onError={(e) => {
          console.error('Kakao Map 스크립트 로드 실패:', e);
          setError("스크립트 로드에 실패했습니다. 네트워크 연결, API 키, 또는 등록된 도메인을 확인하세요.");
        }}
      />
      
      {isLoaded ? children : <div className="h-full w-full flex items-center justify-center">지도 API 로딩 중...</div>}
    </>
  );
}