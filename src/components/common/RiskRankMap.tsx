'use client';

import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { DashboardSenior, RiskLevel } from '@/types';

interface RiskRankMapProps {
  seniors: DashboardSenior[];
  selectedSenior: DashboardSenior | null;
  mapCenter: { lat: number; lng: number };
  level: number;
  onMarkerClick: (senior: DashboardSenior) => void;
  onInfoWindowClick: (senior: DashboardSenior) => void;
  // ✅ [수정됨] 부모로부터 현재 선택된 위험 레벨을 받아 마커 색상을 결정합니다.
  currentLevel: RiskLevel;
}

const getMarkerImage = (level: RiskLevel, isSelected: boolean) => {
  const size = isSelected ? { width: 38, height: 52 } : { width: 28, height: 40 };
  const urls: Record<RiskLevel, string> = {
    EMERGENCY: 'http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
    CRITICAL: 'http://t1.daumcdn.net/mapjsapi/images/marker_red.png',
    DANGER: 'https://i1.daumcdn.net/dmaps/apis/marker_yellow.png',
    POSITIVE: 'https://i1.daumcdn.net/dmaps/apis/marker_blue.png',
  };
  const src = urls[level];
  if (level === 'EMERGENCY') {
    return { src, size: isSelected ? { width: 34, height: 49 } : { width: 24, height: 35 } };
  }
  return { src, size };
};

export default function RiskRankMap({
  seniors,
  selectedSenior,
  mapCenter,
  level,
  onMarkerClick,
  onInfoWindowClick,
  currentLevel, // ✅ [수정됨] prop 받기
}: RiskRankMapProps) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-xl relative">
        <Map center={mapCenter} style={{ width: '100%', height: '100%' }} level={level} isPanto>
        {seniors.map((senior, index) => {
          if (senior.latitude == null || senior.longitude == null) return null;

          const isSelected = selectedSenior?.senior_id === senior.senior_id;
          // ✅ [수정됨] senior 객체에 더 이상 label이 없으므로, prop으로 받은 currentLevel을 사용합니다.
          const markerImage = getMarkerImage(currentLevel, isSelected);

          return (
            // ✅ [수정됨] key를 새로운 ID 필드명으로 변경합니다.
            <MapMarker
              key={senior.latest_overall_result_id}
              position={{ lat: senior.latitude, lng: senior.longitude }}
              onClick={() => onMarkerClick(senior)}
              image={markerImage}
              zIndex={isSelected ? 100 : index}
            >
              {!isSelected && (
                <div
                  style={{
                    padding: '2px 5px', color: '#000', textAlign: 'center',
                    fontWeight: 'bold', fontSize: '12px', background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '4px', marginTop: '-35px', border: '1px solid #aaa',
                  }}
                >
                  {index + 1}
                </div>
              )}
            </MapMarker>
          );
        })}

        {selectedSenior && selectedSenior.latitude != null && selectedSenior.longitude != null && (
          <CustomOverlayMap
            position={{ lat: selectedSenior.latitude, lng: selectedSenior.longitude }}
            yAnchor={1.5}
          >
            {/* ✅ [수정됨] 중복된 div를 제거하고, 부모의 핸들러를 사용하도록 정리했습니다. */}
            <div
              onClick={() => onInfoWindowClick(selectedSenior)}
              className="bg-white rounded-lg shadow-lg p-4 w-80 border-2 border-blue-500 cursor-pointer hover:shadow-2xl transition-shadow"
            >
              <div className="font-bold text-lg mb-2 text-blue-700">
                {`${selectedSenior.name} (${selectedSenior.age}세)`}
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">분석 요약</h4>
                  <p className="text-gray-800 bg-gray-50 p-2 rounded text-xs leading-relaxed">
                    {selectedSenior.summary ?? '정보없음'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">대처 방안</h4>
                  <p className="text-gray-800 bg-gray-50 p-2 rounded text-xs leading-relaxed">
                    {selectedSenior.treatment_plan ?? '정보없음'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">조치 여부</h4>
                  {selectedSenior.is_resolved ? (
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                      조치 완료
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                      확인 필요
                    </span>
                  )}
                </div>
                <div className="text-center pt-2 text-blue-600 font-semibold text-xs border-t mt-3">
                  클릭하여 전체 분석 결과 보기
                </div>
              </div>
            </div>
          </CustomOverlayMap>
        )}
      </Map>
    </div>
  );
}