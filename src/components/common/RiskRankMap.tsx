'use client';

import { useState, useEffect } from 'react';
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { DashboardSenior, RiskLevel } from '@/types';

interface RiskRankMapProps {
  seniors: DashboardSenior[];
  selectedSenior: DashboardSenior | null;
  mapCenter: { lat: number; lng: number };
  level: number;
  onMarkerClick: (senior: DashboardSenior) => void;
  onInfoWindowClick: (senior: DashboardSenior) => void;
  currentLevel: RiskLevel;
  isDashboardView?: boolean; // ✅ 전체 현황 여부
}

export default function RiskRankMap({
  seniors,
  selectedSenior,
  mapCenter,
  level,
  onMarkerClick,
  onInfoWindowClick,
  currentLevel,
  isDashboardView = false,
}: RiskRankMapProps) {
  const [zoomLevel, setZoomLevel] = useState(level);

  // 부모로부터 받는 level prop이 변경될 때마다 지도의 zoomLevel 상태를 업데이트합니다.
  useEffect(() => {
    setZoomLevel(level);
  }, [level]);

  // 🔹 마커 번호 원 & 글자 크기 자동 조정
  const getMarkerSize = (zoom: number) => 24 + (zoom - 5) * 2;
  const getFontSize = (zoom: number) => 12 + Math.floor((zoom - 5) / 2);

  // ✅ 정보창(말풍선) 표시 조건
  const shouldShowInfoWindow =
    !isDashboardView &&
    selectedSenior &&
    selectedSenior.latitude &&
    selectedSenior.longitude;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-xl relative">
      <Map
        center={mapCenter}
        style={{ width: '100%', height: '100%' }}
        level={zoomLevel}
        isPanto
        onZoomChanged={(map) => setZoomLevel(map.getLevel())}
      >
        {seniors.map((senior, idx) => {
          if (!senior.latitude || !senior.longitude) return null;

          const isSelected = selectedSenior?.senior_id === senior.senior_id;
          const circleSize = getMarkerSize(zoomLevel);
          const fontSize = getFontSize(zoomLevel);

          return (
            <MapMarker
              key={senior.latest_overall_result_id}
              position={{
                lat: senior.latitude ?? 0,
                lng: senior.longitude ?? 0,
              }}
              zIndex={isSelected ? 100 : idx}
              onClick={() => {
                if (!isDashboardView) {
                  onMarkerClick(senior);
                }
              }}
            />
          );
        })}

        {/* ✅ InfoWindow */}
        {shouldShowInfoWindow && (
          <CustomOverlayMap
            position={{
              lat: selectedSenior.latitude ?? 0,
              lng: selectedSenior.longitude ?? 0,
            }}
            yAnchor={1.5}
          >
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
