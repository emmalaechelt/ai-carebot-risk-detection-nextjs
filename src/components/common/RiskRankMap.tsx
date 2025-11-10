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

// stateColors는 이제 마커에서 사용되지 않지만, 다른 곳에서 필요할 수 있어 유지합니다.
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
  // ✨ 기존의 내부 상태 관리 로직을 그대로 유지합니다.
  const [zoomLevel, setZoomLevel] = useState(level);
  const [center, setCenter] = useState(mapCenter);
  const router = useRouter();

  useEffect(() => setZoomLevel(level), [level]);
  
  // ✨ 기존의 지도 이동 로직을 그대로 유지합니다.
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
        // 부자연스러움을 유발했던 Math.max(prev, 6) 부분을 제거하고 부모가 주는 레벨을 우선적으로 따르도록 수정
        // 만약 특정 레벨 이상으로 확대되길 원한다면, 이 부분을 다시 조정할 수 있습니다.
        setZoomLevel(level); 
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setCenter(mapCenter);
    }
  }, [selectedSenior, mapCenter, level]);

  // ✨ 수정된 부분: isDashboardView 여부와 관계없이 selectedSenior가 있으면 인포윈도우가 표시되도록 조건을 변경
  const shouldShowInfoWindow =
    selectedSenior?.latitude !== null &&
    selectedSenior?.longitude !== null &&
    selectedSenior?.latitude !== undefined &&
    selectedSenior?.longitude !== undefined;

  // ⛔️ 원형 마커가 제거되었으므로 관련 함수들을 모두 삭제하여 코드를 정리했습니다.

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
                  if (!isDashboardView) onMarkerClick(senior);
                }}
              >
                {/* ✨ 수정된 부분: isDashboardView일 때 렌더링되던 동그란 원과 숫자를 모두 제거했습니다. */}
                {/* 이제 자식 엘리먼트가 없으므로 카카오맵 기본 마커(핀)가 표시됩니다. */}
              </MapMarker>
            );
          })}

        {/* shouldShowInfoWindow 조건이 수정되어 이제 대시보드에서도 인포윈도우가 잘 나타납니다. */}
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
                // ✨ onInfoWindowClick을 사용하도록 로직을 일관성 있게 수정했습니다.
                if (selectedSenior.latest_overall_result_id) {
                  onInfoWindowClick(selectedSenior);
                }
              }}
              className="bg-white rounded-lg shadow-lg border-2 border-blue-500 cursor-pointer hover:shadow-2xl transition-shadow"
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                whiteSpace: 'pre-line',
                wordBreak: 'keep-all',
                minWidth: '500px',
                maxWidth: '90vw',
                cursor: selectedSenior.latest_overall_result_id ? 'pointer' : 'default',
              }}
            >
              <div className="font-bold text-base mb-1 text-blue-700">
                {`${selectedSenior.name} (${selectedSenior.age}세 / ${selectedSenior.sex === 'MALE' ? '남' : '여'})`}
              </div>
              <div className="space-y-1.5 text-sm text-gray-800">
                <div>
                  <span className="font-semibold">· 요약 : </span>
                  <span>{selectedSenior.summary ?? '최근 분석 결과가 없습니다.'}</span>
                </div>
                <div>
                  <span className="font-semibold">· 대처방안 : </span>
                  <span style={{ whiteSpace: 'pre-line' }}>
                    {selectedSenior.treatment_plan ?? '최근 분석 결과가 없습니다.'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const riskColors: Record<RiskLevel, { text: string; bg: string; border: string; label: string }> = {
                      EMERGENCY: { text: 'text-red-600', bg: 'bg-red-500', border: 'border-red-200', label: '긴급' },
                      CRITICAL: { text: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-200', label: '위험' },
                      DANGER: { text: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-200', label: '주의' },
                      POSITIVE: { text: 'text-green-600', bg: 'bg-green-500', border: 'border-green-200', label: '안전' },
                    };

                    if (selectedSenior.latest_overall_result_id) {
                      const currentLabel = selectedSenior.resolved_label ?? 'POSITIVE';
                      const previousLabel = selectedSenior.pre_resolved_label ?? currentLabel;
                      const currentColor = riskColors[currentLabel];
                      const previousColor = riskColors[previousLabel];

                      return (
                        <>
                          <span className="font-semibold">· 조치 여부 : </span>
                          {selectedSenior.is_resolved === false ? (
                            <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">확인 필요</span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-semibold text-white bg-green-500 rounded-full">조치 완료</span>
                          )}
                          
                          {selectedSenior.resolved_label && (
                            <>
                              <span className="text-xs text-gray-500">|</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${previousColor.border} ${previousColor.text}`}>{previousColor.label}</span>
                              <span className="text-sm text-gray-500">→</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${currentColor.border} ${currentColor.text}`}>{currentColor.label}</span>
                            </>
                          )}
                        </>
                      );
                    } else {
                      return (
                        <>
                          <span className="font-semibold">· 현재 상태 : </span>
                          <span className={`px-2 py-0.5 text-xs font-semibold text-white ${riskColors[currentLevel].bg} rounded-full`}>
                            {riskColors[currentLevel].label}
                          </span>
                        </>
                      );
                    }
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