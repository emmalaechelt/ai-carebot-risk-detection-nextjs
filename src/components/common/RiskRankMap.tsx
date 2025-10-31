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
  EMERGENCY: '#FF4C4C',
  CRITICAL: '#FF9900',
  DANGER: '#FFD700',
  POSITIVE: '#4CAF50',
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
  const [center, setCenter] = useState(mapCenter);
  const router = useRouter();

  useEffect(() => setZoomLevel(level), [level]);

  // 화면 크기 변화 및 카드 클릭 시 중앙
  useEffect(() => {
    const updateCenter = () => {
      if (
        selectedSenior?.latitude !== undefined &&
        selectedSenior?.longitude !== undefined
      ) {
        setCenter({
          lat: Number(selectedSenior.latitude),
          lng: Number(selectedSenior.longitude),
        });
      } else {
        setCenter(mapCenter);
      }
    };
    updateCenter();
    window.addEventListener('resize', updateCenter);
    return () => window.removeEventListener('resize', updateCenter);
  }, [selectedSenior?.senior_id, mapCenter.lat, mapCenter.lng]);

  // 카드 클릭 시 확대
  useEffect(() => {
    if (
      selectedSenior?.latitude !== undefined &&
      selectedSenior?.longitude !== undefined
    ) {
      setZoomLevel((prev) => Math.max(prev, 6));
    }
  }, [selectedSenior?.senior_id]);

  const shouldShowInfoWindow =
    !isDashboardView &&
    selectedSenior?.latitude !== undefined &&
    selectedSenior?.longitude !== undefined;

  const getMarkerSize = (zoom: number) => 24 + (zoom - 5) * 2;
  const getFontSize = (zoom: number) => 12 + Math.floor((zoom - 5) / 2);

  const emergencySeniors = seniors.filter(
    (s) => s.resolved_label === 'EMERGENCY'
  );

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
          if (
            senior.latitude === undefined ||
            senior.longitude === undefined
          )
            return null;

          const isSelected = selectedSenior?.senior_id === senior.senior_id;
          const circleSize = getMarkerSize(zoomLevel);
          const fontSize = getFontSize(zoomLevel);

          // 긴급 마커만 번호 표시
          let indexNumber = 0;
          if (isDashboardView && senior.resolved_label === 'EMERGENCY') {
            indexNumber =
              emergencySeniors.findIndex(
                (s) => s.senior_id === senior.senior_id
              ) + 1;
          }

          return (
            <MapMarker
              key={senior.latest_overall_result_id}
              position={{
                lat: Number(senior.latitude),
                lng: Number(senior.longitude),
              }}
              zIndex={isSelected ? 100 : idx}
              onClick={() => {
                if (!isDashboardView) onMarkerClick(senior);
              }}
            >
              {indexNumber > 0 && (
                <div
                  style={{
                    width: `${circleSize}px`,
                    height: `${circleSize}px`,
                    borderRadius: '50%',
                    backgroundColor: stateColors.EMERGENCY,
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
                  {indexNumber}
                </div>
              )}
            </MapMarker>
          );
        })}

        {shouldShowInfoWindow && (
          <CustomOverlayMap
            position={{
              lat: Number(selectedSenior.latitude),
              lng: Number(selectedSenior.longitude),
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
                minWidth: '400px',
                maxWidth: '90vw',
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