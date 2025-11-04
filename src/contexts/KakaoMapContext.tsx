// src/contexts/KakaoMapContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface KakaoMapContextValue {
  isKakaoLoaded: boolean;
}

const KakaoMapContext = createContext<KakaoMapContextValue>({
  isKakaoLoaded: false,
});

export default function KakaoMapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);

  useEffect(() => {
    // 이미 로드된 경우
    if (window.kakao?.maps) {
      setIsKakaoLoaded(true);
      return;
    }

    // autoload=false이므로 직접 init
    const checkAndInit = () => {
      if (window.kakao && window.kakao.maps && !window.kakao.maps.LatLng) {
        window.kakao.maps.load(() => {
          setIsKakaoLoaded(true);
          console.log("✅ Kakao Maps SDK loaded successfully");
        });
      } else if (window.kakao?.maps) {
        setIsKakaoLoaded(true);
      } else {
        console.warn("⚠️ Kakao Maps SDK not yet available, retrying...");
        setTimeout(checkAndInit, 300);
      }
    };

    checkAndInit();
  }, []);

  return (
    <KakaoMapContext.Provider value={{ isKakaoLoaded }}>
      {children}
    </KakaoMapContext.Provider>
  );
}

// ✅ 커스텀 훅
export const useKakaoMap = () => useContext(KakaoMapContext);