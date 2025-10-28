'use client';

import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
// 👇 import 경로를 새로 만든 타입 파일로 변경합니다.
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
  return (
    // 👇 flex-1을 추가하여 왼쪽 공간을 모두 차지하도록 설정
    <div className="w-full md:w-2/3 h-96 md:h-[500px] rounded-lg overflow-hidden shadow-md relative flex-1">
      <Map
        center={mapCenter}
        style={{ width: '100%', height: '100%' }}
        level={5}
      >
        {seniors.map((senior) =>
          senior.lat && senior.lng ? (
            <MapMarker
              key={senior.overall_result_id}
              position={{ lat: senior.lat, lng: senior.lng }}
              onClick={() => onMarkerClick(senior)}
            />
          ) : null
        )}
        {selectedSenior && selectedSenior.lat && selectedSenior.lng ? (
          <CustomOverlayMap
            position={{ lat: selectedSenior.lat, lng: selectedSenior.lng }}
            yAnchor={1.4}
          >
            <div className="relative bg-white rounded-lg shadow-lg p-4 w-72 border border-gray-200">
              <button onClick={onCloseOverlay} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">&times;</button>
              <div className="font-bold text-lg mb-2 text-blue-600">분석 정보</div>
              <div className="space-y-2 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-600">요약</h4>
                  <p className="text-gray-800">{selectedSenior.summary || '요약 정보가 없습니다.'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-600">대처 방안</h4>
                  <p className="text-gray-800">{selectedSenior.treatment_plan || '대처 방안이 없습니다.'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-600">조치 여부</h4>
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">확인 필요</span>
                </div>
              </div>
            </div>
          </CustomOverlayMap>
        ) : null}
      </Map>
    </div>
  );
}