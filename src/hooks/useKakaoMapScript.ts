"use client";

import { useEffect, useState } from "react";

/**
 * Kakao 지도 SDK 스크립트 로드 상태를 관리하는 커스텀 훅
 * KakaoMapLoader와 연동되어 지도 로드 완료 시점 제어
 */
export function useKakaoMapScript() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 이미 window.kakao가 존재하면 즉시 로드 완료로 설정
    if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = "kakao-map-sdk";
    const existingScript = document.getElementById(scriptId);

    // 기존 스크립트가 없으면 새로 추가
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&libraries=services&autoload=false`;
      script.async = true;

      script.onload = () => {
        window.kakao.maps.load(() => {
          setIsLoaded(true);
        });
      };

      document.head.appendChild(script);
    } else {
      // 이미 스크립트가 있으면 로드 완료 여부 확인
      if (window.kakao && window.kakao.maps) {
        setIsLoaded(true);
      }
    }
  }, []);

  return { isLoaded, setLoaded: setIsLoaded };
}