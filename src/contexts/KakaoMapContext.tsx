"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface KakaoMapContextValue {
  isKakaoLoaded: boolean;
  isPostcodeLoaded: boolean;
}

const KakaoMapContext = createContext<KakaoMapContextValue>({
  isKakaoLoaded: false,
  isPostcodeLoaded: false,
});

export default function KakaoMapProvider({ children }: { children: ReactNode }) {
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);
  const [isPostcodeLoaded, setIsPostcodeLoaded] = useState(false);

  useEffect(() => {
    // ✅ Kakao 지도 SDK 로드
    if (!window.kakao?.maps) {
      const kakaoScript = document.createElement("script");
      kakaoScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&autoload=false&libraries=services`;
      kakaoScript.async = true;
      kakaoScript.onload = () => {
        window.kakao.maps.load(() => setIsKakaoLoaded(true));
      };
      document.head.appendChild(kakaoScript);
    } else {
      setIsKakaoLoaded(true);
    }

    // ✅ Daum 주소 검색 스크립트 로드
    if (!window.daum?.Postcode) {
      const daumScript = document.createElement("script");
      daumScript.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      daumScript.async = true;
      daumScript.onload = () => setIsPostcodeLoaded(true);
      document.head.appendChild(daumScript);
    } else {
      setIsPostcodeLoaded(true);
    }
  }, []);

  if (!isKakaoLoaded || !isPostcodeLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        지도 및 주소 검색 로딩 중...
      </div>
    );
  }

  return (
    <KakaoMapContext.Provider value={{ isKakaoLoaded, isPostcodeLoaded }}>
      {children}
    </KakaoMapContext.Provider>
  );
}

export const useKakaoMap = () => useContext(KakaoMapContext);
