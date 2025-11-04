"use client";

import Script from "next/script";
import { ReactNode, useState } from "react";

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
const KAKAO_SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services&autoload=false`;

export default function KakaoMapContext({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!KAKAO_APP_KEY) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-red-100 text-red-700">
        <div className="text-center">
          <h2 className="text-xl font-bold">⚠️ 카카오 API 키가 설정되지 않았습니다.</h2>
          <p className="mt-2">
            .env.local에 <code>NEXT_PUBLIC_KAKAO_APP_KEY</code>를 추가해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        id="kakao-map-script"
        src={KAKAO_SDK_URL}
        strategy="afterInteractive"
        onLoad={() => {
          window.kakao.maps.load(() => {
            console.log("✅ Kakao Map API 로드 완료");
            setIsLoaded(true);
          });
        }}
        onError={(e) => {
          console.error("❌ Kakao 지도 스크립트 로드 실패:", e);
          setError("Kakao 지도 스크립트 로드 실패. API 키/도메인 등록을 확인해주세요.");
        }}
      />
      {error && <div className="text-center text-red-500 p-4">{error}</div>}
      {isLoaded ? children : <div className="flex h-screen items-center justify-center">🗺️ 지도를 로딩 중...</div>}
    </>
  );
}