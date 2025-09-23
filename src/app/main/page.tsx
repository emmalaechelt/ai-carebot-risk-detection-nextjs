"use client";
import Link from "next/link";

interface MonitoringItem {
  id: number;
  name: string;
  gender: string;
  age: number;
  location: string;
  lastSeen: string;
  riskLevel: "긴급" | "위험" | "주의" | "안전";
}

export default function Page() {
  const monitoringData: MonitoringItem[] = [
    { id: 1, name: "김신선", gender: "여", age: 79, location: "중구 문창동", lastSeen: "1분 전", riskLevel: "긴급" },
    { id: 2, name: "이철수", gender: "남", age: 82, location: "동구 판암동", lastSeen: "5분 전", riskLevel: "위험" },
    { id: 3, name: "박영희", gender: "여", age: 76, location: "서구 탄방동", lastSeen: "10분 전", riskLevel: "주의" },
    { id: 4, name: "최민수", gender: "남", age: 80, location: "유성구 봉명동", lastSeen: "2분 전", riskLevel: "안전" },
  ];

  const riskColorMap: { [key in MonitoringItem["riskLevel"]]: string } = {
    긴급: "text-red-600",
    위험: "text-orange-500",
    주의: "text-yellow-500",
    안전: "text-green-600",
  };

  const riskIconMap: { [key in MonitoringItem["riskLevel"]]: string } = {
    긴급: "❗",
    위험: "⚠️",
    주의: "⚠",
    안전: "✅",
  };

  return (
    <>
      {/* 위험도 현황 카드 */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-bold mb-4 text-center text-black">위험도별 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-gray-700">총 이용자 수</div>
            <div className="text-2xl font-bold">{monitoringData.length}명</div>
          </div>
          {(["긴급", "위험", "주의", "안전"] as MonitoringItem["riskLevel"][]).map((risk) => (
            <div key={risk} className={riskColorMap[risk]}>
              <div>{risk}</div>
              <div className="text-xl font-bold">
                {monitoringData.filter((item) => item.riskLevel === risk).length}명
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 위험도 모니터링 카드 */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-bold text-black mb-4">위험도 모니터링</h2>
        <div className="text-black space-y-3 ">
          {monitoringData.map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <span>👤</span>
                <div>
                  <div>
                    <Link href={`/users/view/${item.id}`} // id 기반 동적 라우트
                  className="text-blue-600 hover:underline">
                    </Link>
                    {item.name} ({item.gender} / {item.age}세)
                  </div>
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <span>📍 {item.location}</span>
                    <span>⏱ {item.lastSeen}</span>
                  </div>
                </div>
              </div>
              <button className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                상세정보
              </button>
              <span className={`${riskColorMap[item.riskLevel]} text-xl font-bold`}>
                {riskIconMap[item.riskLevel]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
