"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface KakaoMapContextValue {
  isKakaoLoaded: boolean;
}

const KakaoMapContext = createContext<KakaoMapContextValue>({
  isKakaoLoaded: false,
});

export default function KakaoMapProvider({ children }: { children: ReactNode }) {
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);

  useEffect(() => {
    if (window.kakao?.maps) {
      setIsKakaoLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsKakaoLoaded(true);
      });
    };
    document.head.appendChild(script);
  }, []);

  // --- ⬇️ 핵심 수정 부분 ---
  // isKakaoLoaded가 false이면, 자식 컴포넌트(children)를 렌더링하지 않고 로딩 화면을 보여줍니다.
  // 이렇게 하면 자식 컴포넌트에서는 더 이상 로딩 상태를 신경 쓸 필요가 없습니다.
  if (!isKakaoLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        지도 로딩 중...
      </div>
    );
  }

  return (
    <KakaoMapContext.Provider value={{ isKakaoLoaded }}>
      {children}
    </KakaoMapContext.Provider>
  );
}

export const useKakaoMap = () => useContext(KakaoMapContext);