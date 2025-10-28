'use client';

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardData, RiskSenior, RiskLevel } from "@/types";
import RiskRankMap from "@/components/common/RiskRankMap";
import RiskRankList from "@/components/common/RiskRankList";

// 스켈레톤
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white shadow-sm animate-pulse h-80"></div>
      <div className="border rounded-lg p-3 bg-white shadow-sm animate-pulse h-[500px]"></div>
    </div>
  );
}

const RISK_LABEL_MAP: Record<RiskLevel, string> = {
  EMERGENCY: "긴급",
  CRITICAL: "위험",
  DANGER: "주의",
  POSITIVE: "안전",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [riskSeniors, setRiskSeniors] = useState<RiskSenior[]>([]);
  const [selectedSenior, setSelectedSenior] = useState<RiskSenior | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 36.3504119, lng: 127.3845475 });
  const [riskLevelLabel, setRiskLevelLabel] = useState("긴급/위험");

  const geocodeAddress = (address: string): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        setTimeout(() => geocodeAddress(address).then(resolve).catch(reject), 100);
        return;
      }
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
        } else reject(new Error(`'${address}' 좌표 변환 실패`));
      });
    });
  };

  const addCoordinatesToSeniors = async (seniors: RiskSenior[]) => {
    const seniorsWithCoords = await Promise.all(
      seniors.map(async (senior) => {
        try {
          const coords = await geocodeAddress(`대전 ${senior.gu} ${senior.dong}`);
          return { ...senior, ...coords };
        } catch {
          return { ...senior };
        }
      })
    );
    setRiskSeniors(seniorsWithCoords);

    const firstSeniorWithCoord = seniorsWithCoords.find(s => s.lat && s.lng);
    if (firstSeniorWithCoord) setMapCenter({ lat: firstSeniorWithCoord.lat!, lng: firstSeniorWithCoord.lng! });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get<DashboardData>("/dashboard");
        setData(response.data);
        setTimeout(() => addCoordinatesToSeniors(response.data.recent_urgent_results), 100);
      } catch {
        setError("대시보드 데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSeniorSelect = (senior: RiskSenior) => {
    setSelectedSenior(senior);
    if (senior.lat && senior.lng) setMapCenter({ lat: senior.lat, lng: senior.lng });
  };

  const handleCloseOverlay = () => setSelectedSenior(null);

  const handleRiskCategoryClick = async (level: RiskLevel) => {
    setLoading(true);
    setSelectedSenior(null);
    setRiskLevelLabel(RISK_LABEL_MAP[level]);
    try {
      const response = await api.get(`/analyze?label=${level}&size=20`);
      await addCoordinatesToSeniors(response.data.content);
    } catch {
      setRiskSeniors([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (!data && loading) return <DashboardSkeleton />;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;

  const riskInfo: Record<string, { label: string; className: string }> = {
    EMERGENCY: { label: "긴급", className: "text-red-600 border-red-200 bg-red-50" },
    CRITICAL: { label: "위험", className: "text-orange-600 border-orange-200 bg-orange-50" },
    DANGER: { label: "주의", className: "text-yellow-500 border-yellow-200 bg-yellow-50" },
    POSITIVE: { label: "안전", className: "text-green-600 border-green-200 bg-green-50" },
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-center text-black">전체 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="border rounded-lg bg-gray-100 p-2">
            <div className="text-gray-700">총 이용자</div>
            <div className="text-2xl font-bold text-black">{data.state_count.total}명</div>
          </div>
          {(["EMERGENCY", "CRITICAL", "DANGER", "POSITIVE"] as const).map((key) => {
            const risk = riskInfo[key];
            const countKey = key.toLowerCase() as keyof DashboardData["state_count"];
            return (
              <div
                key={key}
                className={`${risk.className} rounded-lg p-2 cursor-pointer transition-transform transform hover:scale-105`}
                onClick={() => handleRiskCategoryClick(key)}
              >
                <div className="font-semibold text-xl">{risk.label}</div>
                <div className="text-xl font-bold">{data.state_count[countKey]}명</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border rounded-lg p-3 bg-white shadow-sm">
        <h2 className="text-lg font-bold mb-3 text-black">긴급 발생 지역 및 {riskLevelLabel} 목록</h2>
        {loading && riskSeniors.length === 0 ? (
          <div className="flex justify-center items-center h-[500px]">
            <p className="text-gray-600">지도와 목록을 불러오는 중입니다...</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            <RiskRankMap
              seniors={riskSeniors}
              selectedSenior={selectedSenior}
              mapCenter={mapCenter}
              onMarkerClick={handleSeniorSelect}
              onCloseOverlay={handleCloseOverlay}
            />
            <RiskRankList
              seniors={riskSeniors}
              selectedSeniorId={selectedSenior?.overall_result_id || null}
              onSeniorSelect={handleSeniorSelect}
              riskLevelLabel={riskLevelLabel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
