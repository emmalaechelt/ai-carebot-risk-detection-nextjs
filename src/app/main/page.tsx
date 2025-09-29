"use client";

import { useEffect, useState } from "react";

interface MonitoringItem {
  id: number;
  name: string;
  gender: string;
  age: number;
  location: string;
  lastSeen: string;
  riskLevel: "긴급" | "위험" | "주의" | "안전";
}

export default function Dashboard() {
  const [data, setData] = useState<MonitoringItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("jwtToken");
    if (!token) return;

    // 서버 없이 더미 데이터 생성
    const dummyData: MonitoringItem[] = Array.from({ length: 20 }).map((_, i) => ({
      id: i + 1,
      name: `이용자 ${i + 1}`,
      gender: i % 2 === 0 ? "남" : "여",
      age: 65 + (i % 20),
      location: ["대덕구", "동구", "서구", "유성구", "중구"][i % 5],
      lastSeen: `2025-01-0${(i % 9) + 1} 12:${(i % 60).toString().padStart(2, "0")}`,
      riskLevel: ["긴급", "위험", "주의", "안전"][i % 4] as MonitoringItem["riskLevel"],
    }));

    setData(dummyData);
    setLoading(false);
  }, []);

  const riskColor: { [key in MonitoringItem["riskLevel"]]: string } = {
    긴급: "text-red-600",
    위험: "text-orange-500",
    주의: "text-yellow-500",
    안전: "text-green-600",
  };

  const riskIcon: { [key in MonitoringItem["riskLevel"]]: string } = {
    긴급: "❗",
    위험: "⚠️",
    주의: "⚠",
    안전: "✅",
  };

  if (loading) return <p className="text-center mt-10 text-gray-600">데이터 불러오는 중...</p>;

  return (
    <div className="space-y-6">
      {/* 위험도별 현황 */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-bold mb-4 text-center text-black">위험도별 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-gray-700">총 이용자 수</div>
            <div className="text-2xl font-bold">{data.length}명</div>
          </div>
          {(["긴급", "위험", "주의", "안전"] as MonitoringItem["riskLevel"][]).map((r) => (
            <div key={r} className={riskColor[r]}>
              <div>{r}</div>
              <div className="text-xl font-bold">{data.filter((i) => i.riskLevel === r).length}명</div>
            </div>
          ))}
        </div>
      </div>

      {/* 위험도 모니터링 */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-bold mb-4 text-black">위험도 모니터링</h2>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <span>👤</span>
                <div>
                  {item.name} ({item.gender}/{item.age}세)
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <span>📍 {item.location}</span>
                    <span>⏱ {item.lastSeen}</span>
                  </div>
                </div>
              </div>
              <span className={`${riskColor[item.riskLevel]} text-xl font-bold`}>{riskIcon[item.riskLevel]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}