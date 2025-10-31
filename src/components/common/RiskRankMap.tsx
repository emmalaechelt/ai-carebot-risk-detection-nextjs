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
  const router = useRouter();

  useEffect(() => {
    setZoomLevel(level);
  }, [level]);

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

        {shouldShowInfoWindow && (
          <CustomOverlayMap
            position={{
              lat: selectedSenior.latitude ?? 0,
              lng: selectedSenior.longitude ?? 0,
            }}
            yAnchor={1.35} // 마커 바로 위로 띄움
            xAnchor={0.5} // 수평 중앙 정렬
          >
            <div
              onClick={() =>
                router.push(`/app/main/analysis/${selectedSenior.senior_id}`)
              }
              className="bg-white rounded-lg shadow-lg border-2 border-blue-500 cursor-pointer hover:shadow-2xl transition-shadow"
              style={{
                display: 'inline-block',      // 글자 길이에 맞게 최소한으로 가로
                padding: '4px 8px',           // 내부 여백 최소화
                whiteSpace: 'pre-line',
                wordBreak: 'keep-all',
                minWidth: '390px',            // 기본적으로 넓게 나오도록 최소폭 설정
                maxWidth: '90vw',             // 화면 줄어들면 최대 90%까지 줄어들게
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
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold">조치 여부: </span>
                  {selectedSenior.is_resolved ? (
                    <span className="px-2 py-0.5 text-xs font-semibold text-white bg-green-500 rounded-full">
                      조치 완료
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">
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
