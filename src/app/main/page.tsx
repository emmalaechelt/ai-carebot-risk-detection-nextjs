"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DashboardData, RiskSenior, RiskLevel } from "@/types"; // ✨ 새로 만든 타입 import
import RiskRankMap from "@/components/common/RiskRankMap"; // ✨ 지도 컴포넌트 import
import RiskRankList from "@/components/common/RiskRankList"; // ✨ 목록 컴포넌트 import
import useKakaoMapScript from "@/hooks/useKakaoMapScript"; // ✨ 카카오맵 훅 import

// ... (DashboardSkeleton 컴포넌트는 그대로 유지)
function DashboardSkeleton() {
  /* ... 기존 스켈레톤 코드 ... */
}

// 리스크 레벨 한글명 매핑
const RISK_LABEL_MAP: Record<RiskLevel, string> = {
  EMERGENCY: '긴급',
  CRITICAL: '위험',
  DANGER: '주의',
  POSITIVE: '안전',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- 지도/목록 연동을 위한 상태 추가 ---
  const [riskSeniors, setRiskSeniors] = useState<RiskSenior[]>([]);
  const [selectedSenior, setSelectedSenior] = useState<RiskSenior | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 36.3504119, lng: 127.3845475 }); // 대전시청 기본 위치
  const [riskLevelLabel, setRiskLevelLabel] = useState<string>('긴급/위험');

  // --- 카카오맵 스크립트 로드 ---
  useKakaoMapScript();

  // --- 주소 좌표 변환 함수 추가 ---
  const geocodeAddress = (address: string): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!window.kakao || !window.kakao.maps) {
        reject(new Error("Kakao Map script is not loaded yet."));
        return;
      }
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
        } else {
          reject(new Error("주소 좌표 변환에 실패했습니다."));
        }
      });
    });
  };

  // --- 시니어 목록에 좌표를 추가하는 함수 추가 ---
  const addCoordinatesToSeniors = async (seniors: RiskSenior[]) => {
    const seniorsWithCoords = await Promise.all(
      seniors.map(async (senior) => {
        const fullAddress = `대전 ${senior.gu} ${senior.dong}`;
        try {
          const coords = await geocodeAddress(fullAddress);
          return { ...senior, ...coords };
        } catch (error) {
          console.error(`${senior.senior_name}님 주소 변환 실패: `, error);
          return { ...senior, lat: mapCenter.lat, lng: mapCenter.lng }; // 실패 시 기본 좌표
        }
      })
    );
    setRiskSeniors(seniorsWithCoords);
    if (seniorsWithCoords.length > 0 && seniorsWithCoords[0].lat) {
      setMapCenter({ lat: seniorsWithCoords[0].lat, lng: seniorsWithCoords[0].lng });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get<DashboardData>("/dashboard");
        setData(response.data);
        // ✨ 데이터 로드 성공 후, 지도에 표시할 좌표를 추가합니다.
        await addCoordinatesToSeniors(response.data.recent_urgent_results);
      } catch (err) {
        setError("대시보드 데이터를 불러오는 데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 지도/목록 상호작용 핸들러 추가 ---
  const handleSeniorSelect = (senior: RiskSenior) => {
    setSelectedSenior(senior);
    if (senior.lat && senior.lng) {
      setMapCenter({ lat: senior.lat, lng: senior.lng });
    }
  };

  const handleCloseOverlay = () => {
    setSelectedSenior(null);
  };

  const handleRiskCategoryClick = async (level: RiskLevel) => {
    setLoading(true);
    setSelectedSenior(null);
    setRiskLevelLabel(RISK_LABEL_MAP[level]);
    try {
      const response = await api.get(`/analyze?label=${level}&size=20`);
      await addCoordinatesToSeniors(response.data.content);
    } catch (err) {
      console.error(`${level} 목록 로드 실패: `, err);
      setRiskSeniors([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (!data && loading) return <DashboardSkeleton />;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;

  const riskInfo: Record<string, { label: string; className: string }> = {
    EMERGENCY: { label: "긴급", className: "text-red-600 border-red-200 bg-red-50 hover:bg-red-100" },
    CRITICAL: { label: "위험", className: "text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100" },
    DANGER: { label: "주의", className: "text-yellow-500 border-yellow-200 bg-yellow-50 hover:bg-yellow-100" },
    POSITIVE: { label: "안전", className: "text-green-600 border-green-200 bg-green-50 hover:bg-green-100" },
  };

  return (
    <div className="space-y-4">
      {/* 전체 현황 */}
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
              // ✨ 현황 카드를 클릭 가능하도록 수정
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

      {/* ▼▼▼ 기존 '최근 분석 결과' 섹션을 지도와 목록으로 교체 ▼▼▼ */}
      <div className="border rounded-lg p-3 bg-white shadow-sm">
        <h2 className="text-lg font-bold mb-3 text-black">긴급 발생 지역 및 {riskLevelLabel} 목록</h2>
        {loading ? (
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