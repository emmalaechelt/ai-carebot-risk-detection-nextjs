"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [monitoringData, setMonitoringData] = useState<MonitoringItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 로그인 여부 + API 호출
  useEffect(() => {
    const token = sessionStorage.getItem("jwtToken");

    if (!token) {
      alert("로그인이 필요합니다!");
      router.push("/");
      return;
    }

    // 보호된 API 요청
    fetch("http://localhost:8080/api/dashboard", {
      headers: {
        Authorization: token, // 백엔드에서 Bearer 요구 시 → `Bearer ${token}`
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("API 요청 실패");
        return res.json();
      })
      .then((data: MonitoringItem[]) => {
        setMonitoringData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert("데이터를 불러오는 데 실패했습니다.");
        setLoading(false);
      });
  }, [router]);

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

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">데이터 불러오는 중...</p>;
  }

  return (
    <>
      {/* 위험도 현황 카드 */}
      <div className="border rounded-lg p-4 bg-white mb-6">
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
            <div
              key={index}
              className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <span>👤</span>
                <div>
                  <div>
                    <Link
                      href={`/users/view/${item.id}`} // id 기반 동적 라우트
                      className="text-blue-600 hover:underline"
                    >
                      {item.name}
                    </Link>{" "}
                    ({item.gender} / {item.age}세)
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
