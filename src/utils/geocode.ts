// src/utils/geocode.ts
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * 도로명 주소 → 위도/경도 변환 (최신 통합 안정형)
 * ---------------------------------------------------
 * ✅ SDK 로드 여부를 즉시 확인 (window.kakao?.maps?.services 검사)
 * ✅ 잘못된 주소 입력 방지
 * ✅ NaN 좌표 필터링 (0 포함 허용)
 * ✅ 예외 상황 및 오류 로깅 강화
 * ✅ Promise 반환으로 await 사용 가능
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!address || address.trim() === "") {
    console.warn("⚠️ geocodeAddress: 유효하지 않은 주소");
    return null;
  }

  // ✅ Kakao SDK 로드 상태 즉시 확인
  if (typeof window === "undefined" || !window.kakao?.maps?.services) {
    console.warn("⚠️ Kakao Maps SDK 아직 준비되지 않음");
    return null;
  }

  try {
    const geocoder = new window.kakao.maps.services.Geocoder();

    return await new Promise((resolve) => {
      geocoder.addressSearch(address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          const { y, x } = result[0];
          const lat = parseFloat(y);
          const lng = parseFloat(x);

          // ✅ NaN 좌표 필터링 (단, 0은 허용)
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log(`📍 Geocode 성공: ${address} → (${lat}, ${lng})`);
            resolve({ lat, lng });
          } else {
            console.error("❌ 좌표 변환 실패 (NaN 값 발견)", result[0]);
            resolve(null);
          }
        } else {
          console.error("❌ 주소 변환 실패:", status, result);
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.error("❌ geocodeAddress() 실행 중 오류:", err);
    return null;
  }
}