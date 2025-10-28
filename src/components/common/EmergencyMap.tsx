// src/components/common/EmergencyMap.tsx
'use client';

import { Map, MapMarker } from 'react-kakao-maps-sdk';

interface EmergencySenior {
  id: number;
  lat: number;
  lng: number;
}

interface EmergencyMapProps {
  seniors: EmergencySenior[];
  // 부모 컴포넌트에서 제어할 지도의 중심 좌표입니다.
  mapCenter: { lat: number; lng: number };
}

export default function EmergencyMap({ seniors, mapCenter }: EmergencyMapProps) {
  return (
    <div className="w-full md:w-2/3 h-96 rounded-lg overflow-hidden shadow-md">
       <Map
        center={mapCenter}
        style={{ width: "100%", height: "100%" }}
        level={5} // 지도 확대 레벨
      >
        {seniors.map((senior) => (
          <MapMarker
            key={senior.id}
            position={{ lat: senior.lat, lng: senior.lng }}
          />
        ))}
      </Map>
    </div>
  );
}