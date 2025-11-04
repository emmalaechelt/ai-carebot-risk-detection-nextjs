// src/utils/geocode.ts
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * 도로명 주소 → 위도/경도 변환 (안정형)
 * - Kakao SDK 로드 상태 확인 강화
 * - 예외 상황 (빈 주소, 네트워크 오류 등) 처리 강화
 * - 반환값 타입 안정화
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!address || address.trim() === "") {
    console.warn("⚠️ geocodeAddress: 유효하지 않은 주소");
    return null;
  }

  // Kakao SDK 로드 확인
  if (
    typeof window === "undefined" ||
    !window.kakao ||
    !window.kakao.maps ||
    !window.kakao.maps.services
  ) {
    console.warn("⚠️ Kakao Maps SDK 미로드 상태에서 geocodeAddress 호출됨");
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

          // ✅ 좌표 유효성 체크 (0 포함 허용)
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log(`📍 Geocode 성공: ${address} → (${lat}, ${lng})`);
            resolve({ lat, lng });
          } else {
            console.error("❌ 좌표 변환 실패 (NaN)", result[0]);
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
