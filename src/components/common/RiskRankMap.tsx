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

  useEffect(() => setZoomLevel(level), [level]);
  
  useEffect(() => {
    if (
      selectedSenior?.latitude != null &&
      selectedSenior?.longitude != null
    ) {
      const timer = setTimeout(() => {
        setCenter({
          lat: Number(selectedSenior.latitude),
          lng: Number(selectedSenior.longitude),
        });
        setZoomLevel(level); 
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setCenter(mapCenter);
    }
  }, [selectedSenior, mapCenter, level]);

  const shouldShowInfoWindow =
    selectedSenior?.latitude !== null &&
    selectedSenior?.longitude !== null &&
    selectedSenior?.latitude !== undefined &&
    selectedSenior?.longitude !== undefined;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-xl relative">
      <Map
        center={center}
        style={{ width: '100%', height: '100%' }}
        level={zoomLevel}
        isPanto
        onZoomChanged={(map) => setZoomLevel(map.getLevel())}
      >
        {seniors
          .filter(
            (s) =>
              s.latitude !== null &&
              s.longitude !== null &&
              s.latitude !== undefined &&
              s.longitude !== undefined
          )
          .map((senior, idx) => {
            const isSelected = selectedSenior?.senior_id === senior.senior_id;
            const markerKey = `${senior.latest_overall_result_id ?? senior.senior_id ?? 'unknown'}-${idx}`;

            return (
              <MapMarker
                key={markerKey}
                position={{
                  lat: Number(senior.latitude),
                  lng: Number(senior.longitude),
                }}
                zIndex={isSelected ? 100 : idx}
                onClick={() => {
                  // 대시보드 뷰에서는 마커 클릭 시 부모의 onMarkerClick을 호출합니다.
                  onMarkerClick(senior);
                }}
              />
            );
          })}

        {shouldShowInfoWindow && selectedSenior && (
          <CustomOverlayMap
            position={{
              lat: Number(selectedSenior.latitude),
              lng: Number(selectedSenior.longitude),
            }}
            yAnchor={1.4}
            xAnchor={0.5}
            zIndex={101}
          >
            <div
              onClick={() => {
                if (selectedSenior.latest_overall_result_id) {
                  onInfoWindowClick(selectedSenior);
                }
              }}
              className="bg-white rounded-lg p-2 shadow-lg border-2 border-blue-500 transition-shadow"
              style={{
                width: '550px', 
                maxWidth: '90vw',
                cursor: selectedSenior.latest_overall_result_id ? 'pointer' : 'default',
              }}
            >
              <div className="font-bold text-base mb-2 text-blue-700">
                {`${selectedSenior.name} (${selectedSenior.age}세 / ${selectedSenior.sex === 'MALE' ? '남' : '여'})`}
              </div>
              <div className="space-y-1.5 text-sm text-gray-800">
                <div className="flex">
                  <span className="font-semibold flex-shrink-0 mr-1">· 요약 : </span>
                  <span>{selectedSenior.summary ?? '최근 분석 결과가 없습니다.'}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold flex-shrink-0 mr-1">· 대처방안 : </span>
                  <span style={{ whiteSpace: 'pre-line' }}>
                    {selectedSenior.treatment_plan ?? '최근 분석 결과가 없습니다.'}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {(() => {
                    const riskColors: Record<RiskLevel, { text: string; bg: string; border: string; label: string }> = {
                      EMERGENCY: { text: 'text-red-600', bg: 'bg-red-500', border: 'border-red-200', label: '긴급' },
                      CRITICAL: { text: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-200', label: '위험' },
                      DANGER: { text: 'text-yellow-600', bg: 'bg-yellow-500', border: 'border-yellow-200', label: '주의' },
                      POSITIVE: { text: 'text-green-600', bg: 'bg-green-500', border: 'border-green-200', label: '안전' },
                    };

                    // DashboardSenior 타입의 속성을 사용하도록 수정
                    const currentLabel = selectedSenior.resolved_label ?? selectedSenior.pre_resolved_label ?? 'POSITIVE';
                    const previousLabel = selectedSenior.pre_resolved_label ?? currentLabel;
                    const currentColor = riskColors[currentLabel];
                    const previousColor = riskColors[previousLabel];

                    return (
                      <>
                        <span className="font-semibold flex-shrink-0">· 조치 여부 : </span>
                        {selectedSenior.is_resolved ? (
                          <span className="px-2 py-0.5 text-xs font-semibold text-white bg-green-500 rounded-full">조치 완료</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">확인 필요</span>
                        )}
                        
                        {selectedSenior.is_resolved && selectedSenior.resolved_label && (
                          <>
                            <span className="text-xs text-gray-500">|</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${previousColor.border} ${previousColor.text}`}>{previousColor.label}</span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${currentColor.border} ${currentColor.text}`}>{currentColor.label}</span>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CustomOverlayMap>
        )}
      </Map>
    </div>
  );
}