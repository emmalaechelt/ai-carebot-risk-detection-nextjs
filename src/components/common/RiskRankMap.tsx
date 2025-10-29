// src/components/common/RiskRankMap.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { DashboardSenior, RiskLevel } from '@/types';

interface RiskRankMapProps {
  seniors: DashboardSenior[];
  selectedSenior: DashboardSenior | null;
  mapCenter: { lat: number; lng: number };
  onMarkerClick: (senior: DashboardSenior) => void;
}

const getMarkerImage = (level: RiskLevel, isSelected: boolean) => {
  const size = isSelected ? { width: 38, height: 52 } : { width: 28, height: 40 };
  const urls: Record<RiskLevel, string> = {
    EMERGENCY: "http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
    CRITICAL: "http://t1.daumcdn.net/mapjsapi/images/marker_red.png",
    DANGER: "https://i1.daumcdn.net/dmaps/apis/marker_yellow.png",
    POSITIVE: "https://i1.daumcdn.net/dmaps/apis/marker_blue.png",
  };
  const src = urls[level] || urls.POSITIVE;
  if (level === 'EMERGENCY') {
    return { src, size: isSelected ? { width: 34, height: 49 } : { width: 24, height: 35 } };
  }
  return { src, size };
};

export default function RiskRankMap({ seniors, selectedSenior, mapCenter, onMarkerClick }: RiskRankMapProps) {
  const router = useRouter();

  const handleOverlayClick = (senior: DashboardSenior) => {
    router.push(`/analysis/${senior.overall_result_id}?senior_id=${senior.senior_id}`);
  };

  return (
    <div className="w-full md:w-2/3 h-[600px] rounded-lg overflow-hidden shadow-xl relative flex-1">
      <Map center={mapCenter} style={{ width: '100%', height: '100%' }} level={8} isPanto>
        {seniors.map((senior, index) => {
          if (senior.latitude === null || senior.longitude === null) return null;
          
          const isSelected = selectedSenior?.senior_id === senior.senior_id;
          const markerImage = getMarkerImage(senior.label, isSelected);

          return (
            <MapMarker
              key={senior.senior_id}
              position={{ lat: senior.latitude, lng: senior.longitude }}
              onClick={() => onMarkerClick(senior)}
              image={markerImage}
              zIndex={isSelected ? 100 : index}
            >
              {!isSelected && (
                <div style={{
                  padding: '2px 5px', color: '#000', textAlign: 'center', fontWeight: 'bold',
                  fontSize: '12px', background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '4px', marginTop: '-35px', border: '1px solid #aaa'
                }}>
                  {index + 1}
                </div>
              )}
            </MapMarker>
          );
        })}

        {selectedSenior && selectedSenior.latitude && selectedSenior.longitude && (
          <CustomOverlayMap position={{ lat: selectedSenior.latitude, lng: selectedSenior.longitude }} yAnchor={1.5}>
            <div
              onClick={() => handleOverlayClick(selectedSenior)}
              className="bg-white rounded-lg shadow-lg p-4 w-80 border-2 border-blue-500 cursor-pointer hover:shadow-2xl transition-shadow"
            >
              <div className="font-bold text-lg mb-2 text-blue-700">
                {seniors.findIndex(s => s.senior_id === selectedSenior.senior_id) + 1}. {selectedSenior.name}님 정보
              </div>
              <div className="space-y-3 text-sm">
                <InfoSection title="분석 요약" content={selectedSenior.summary} />
                <InfoSection title="대처 방안" content={selectedSenior.treatment_plan} />
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

const InfoSection = ({ title, content }: { title: string; content?: string }) => (
  <div>
    <h4 className="font-semibold text-gray-700 mb-1">{title}</h4>
    <p className="text-gray-800 bg-gray-50 p-2 rounded text-xs leading-relaxed">
      {content || '정보가 없습니다.'}
    </p>
  </div>
);