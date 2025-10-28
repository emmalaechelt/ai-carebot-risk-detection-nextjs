'use client';

import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { RiskSenior } from '@/types';

interface RiskRankMapProps {
  seniors: RiskSenior[];
  selectedSenior: RiskSenior | null;
  mapCenter: { lat: number; lng: number };
  onMarkerClick: (senior: RiskSenior) => void;
  onCloseOverlay: () => void;
}

export default function RiskRankMap({
  seniors,
  selectedSenior,
  mapCenter,
  onMarkerClick,
  onCloseOverlay,
}: RiskRankMapProps) {
  // 상태별 마커 이미지 URL 정의
  const markerImageUrls: Record<string, string> = {
    EMERGENCY: "http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
    CRITICAL: "http://t1.daumcdn.net/mapjsapi/images/marker_red.png",
    DANGER: "https://i1.daumcdn.net/dmaps/apis/marker_yellow.png",
  };

  return (
    <div className="w-full md:w-2/3 h-96 md:h-[500px] rounded-lg overflow-hidden shadow-md relative flex-1">
      <Map
        center={mapCenter}
        style={{ width: '100%', height: '100%' }}
        level={8}
      >
        {seniors.map((senior) => {
          if (!senior.lat || !senior.lng) return null;
          const markerImageSrc = markerImageUrls[senior.label];
          if (!markerImageSrc) return null;

          const imageSize = senior.label === 'EMERGENCY'
            ? { width: 24, height: 35 }
            : { width: 29, height: 42 };

          return (
            <MapMarker
              key={senior.overall_result_id}
              position={{ lat: senior.lat, lng: senior.lng }}
              onClick={() => onMarkerClick(senior)}
              image={{ src: markerImageSrc, size: imageSize }}
            />
          );
        })}

        {selectedSenior && selectedSenior.lat && selectedSenior.lng && (
          <CustomOverlayMap
            position={{ lat: selectedSenior.lat, lng: selectedSenior.lng }}
            yAnchor={1.4}
          >
            <div className="relative bg-white rounded-lg shadow-lg p-4 w-80 border border-gray-200">
              <button
                onClick={onCloseOverlay}
                className="absolute top-1 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
              >
                &times;
              </button>
              <div className="font-bold text-base mb-2 text-blue-600">
                {selectedSenior.senior_name}님 분석 정보
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">분석 요약</h4>
                  <p className="text-gray-800 bg-gray-50 p-2 rounded">
                    {selectedSenior.summary || '요약 정보가 없습니다.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-600 mb-1">대처 방안</h4>
                  <p className="text-gray-800 bg-gray-50 p-2 rounded">
                    {selectedSenior.treatment_plan || '대처 방안이 없습니다.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-600">조치 여부</h4>
                  {selectedSenior.is_resolved ? (
                    <span className="mt-1 inline-block px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                      조치 완료
                    </span>
                  ) : (
                    <span className="mt-1 inline-block px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
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
