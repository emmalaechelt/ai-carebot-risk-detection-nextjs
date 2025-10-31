'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  isDashboardView?: boolean;
}

// 상태별 원색 정의
const stateColors: Record<RiskLevel, string> = {
  EMERGENCY: '#FF4C4C', // 빨강
  CRITICAL: '#FF9900',  // 주황
  DANGER: '#FFD700',    // 노랑
  POSITIVE: '#4CAF50',  // 초록
};

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
  const [center, setCenter] = useState(mapCenter); // 지도 중심
  const router = useRouter();

  useEffect(() => {
    setZoomLevel(level);
  }, [level]);

  // 선택된 시니어가 바뀌면 지도 중심 이동
  useEffect(() => {
    if (selectedSenior && selectedSenior.latitude && selectedSenior.longitude) {
      setCenter({ lat: selectedSenior.latitude, lng: selectedSenior.longitude });
    }
  }, [selectedSenior]);

  const shouldShowInfoWindow =
    !isDashboardView &&
    selectedSenior &&
    selectedSenior.latitude &&
    selectedSenior.longitude;

  const getMarkerSize = (zoom: number) => 24 + (zoom - 5) * 2;
  const getFontSize = (zoom: number) => 12 + Math.floor((zoom - 5) / 2);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-xl relative">
      <Map
        center={center}
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
            >
              {/* 전체 현황에서만 발생순 번호 표시 */}
              {isDashboardView && senior.resolved_label === 'EMERGENCY' && (
                <div
                  style={{
                    width: `${circleSize}px`,
                    height: `${circleSize}px`,
                    borderRadius: '50%',
                    backgroundColor: stateColors[senior.resolved_label],
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: `${fontSize}px`,
                    position: 'absolute',
                    top: `-${circleSize + 4}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    userSelect: 'none',
                    border: '1px solid #fff',
                  }}
                >
                  {idx + 1}
                </div>
              )}
            </MapMarker>
          );
        })}

        {/* 카드 클릭 시 네모창 */}
        {shouldShowInfoWindow && (
          <CustomOverlayMap
            position={{
              lat: selectedSenior.latitude ?? 0,
              lng: selectedSenior.longitude ?? 0,
            }}
            yAnchor={1.35}
            xAnchor={0.5}
          >
            <div
              onClick={() =>
                router.push(`/app/main/analysis/${selectedSenior.senior_id}`)
              }
              className="bg-white rounded-lg shadow-lg border-2 border-blue-500 cursor-pointer hover:shadow-2xl transition-shadow"
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                whiteSpace: 'pre-line',
                wordBreak: 'keep-all',
                minWidth: '400px', // 기본 넓게
                maxWidth: '90vw',  // 화면 줄어들면 90%까지
              }}
            >
              <div className="font-bold text-base mb-1 text-blue-700">
                {`${selectedSenior.name} (${selectedSenior.age}세)`}
              </div>
              <div className="space-y-1 text-xs text-gray-800">
                <div>
                  <span className="font-semibold">요약: </span>
                  <span>{selectedSenior.summary ?? '정보없음'}</span>
                </div>
                <div>
                  <span className="font-semibold">대처방안: </span>
                  <span style={{ whiteSpace: 'pre-line' }}>
                    {selectedSenior.treatment_plan ?? '정보없음'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="font-semibold">조치 여부: </span>
                  {selectedSenior.is_resolved ? (
                    <span className="px-2 py-0.5 font-semibold text-white bg-green-500 rounded-full">
                      조치 완료
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 font-semibold text-white bg-red-500 rounded-full">
                      확인 필요
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CustomOverlayMap>
        )}
      </Map>
    </div>
  );
}