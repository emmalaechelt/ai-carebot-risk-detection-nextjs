"use client";

import React, { useEffect } from "react";
import { useKakaoMapScript } from "@/hooks/useKakaoMapScript";

interface EmergencyItem {
  id: number;
  time: string;
  gu: string;
  dong: string;
  lat: number;
  lng: number;
}

const emergencyData: EmergencyItem[] = [
  { id: 1, time: "16시", gu: "대덕구", dong: "상서동", lat: 36.361, lng: 127.420 },
  { id: 2, time: "16시", gu: "대덕구", dong: "중리동", lat: 36.358, lng: 127.416 },
  { id: 3, time: "16시", gu: "대덕구", dong: "법동", lat: 36.361, lng: 127.425 },
  { id: 4, time: "16시", gu: "대덕구", dong: "비래동", lat: 36.364, lng: 127.427 },
  { id: 5, time: "16시", gu: "대덕구", dong: "송촌동", lat: 36.368, lng: 127.423 },
];

export default function EmergencyMap() {
  const { isLoaded } = useKakaoMapScript();

  useEffect(() => {
    if (!isLoaded || !window.kakao) return;

    window.kakao.maps.load(() => {
      const container = document.getElementById("emergency-map");
      const center = new window.kakao.maps.LatLng(36.361, 127.420);
      const options = { center, level: 6 };
      const map = new window.kakao.maps.Map(container, options);

      emergencyData.forEach((item) => {
        const markerPosition = new window.kakao.maps.LatLng(item.lat, item.lng);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          map,
        });

        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px;font-size:13px;">${item.gu} ${item.dong}</div>`,
        });

        window.kakao.maps.event.addListener(marker, "mouseover", () => infowindow.open(map, marker));
        window.kakao.maps.event.addListener(marker, "mouseout", () => infowindow.close());
      });
    });
  }, [isLoaded]);

  return (
    <div className="flex w-full bg-white rounded-2xl shadow p-4 gap-4">
      <div className="w-2/3">
        <h2 className="text-center text-lg font-semibold mb-2">긴급 상황 발생 지역</h2>
        <div id="emergency-map" className="w-full h-[500px] rounded-xl border" />
      </div>

      <div className="w-1/3">
        <h2 className="text-center text-lg font-semibold mb-2">긴급 목록</h2>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border px-2 py-1 w-12">순번</th>
              <th className="border px-2 py-1 w-20">일시</th>
              <th className="border px-2 py-1">구</th>
              <th className="border px-2 py-1">동</th>
            </tr>
          </thead>
          <tbody>
            {emergencyData.map((item) => (
              <tr key={item.id} className="text-center">
                <td className="border px-2 py-1">{item.id}</td>
                <td className="border px-2 py-1">{item.time}</td>
                <td className="border px-2 py-1">{item.gu}</td>
                <td className="border px-2 py-1">{item.dong}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}