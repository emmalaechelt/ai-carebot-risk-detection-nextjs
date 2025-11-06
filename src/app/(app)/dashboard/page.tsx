"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import StatusSummary from "@/components/common/StatusSummary";
import RiskRankMap from "@/components/common/RiskRankMap";
import RiskRankList from "@/components/common/RiskRankList";
import type { DashboardSenior, RiskLevel } from "@/types";
import KakaoMapProvider from "@/contexts/KakaoMapContext";
import { useDashboardData } from "@/hooks/useDashboardData";

const DEFAULT_MAP_CENTER = { lat: 36.3504, lng: 127.3845 };
const DEFAULT_MAP_LEVEL = 8;
const ZOOM_ON_SELECT = 4;

function DashboardContent() {
  const router = useRouter();
  
  const { data, isLoading, isError } = useDashboardData();

  const [selectedLevel, setSelectedLevel] = useState<RiskLevel>("EMERGENCY");
  const [selectedSenior, setSelectedSenior] = useState<DashboardSenior | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapLevel, setMapLevel] = useState(DEFAULT_MAP_LEVEL);

  useEffect(() => {
    setSelectedSenior(null);
    setMapCenter(DEFAULT_MAP_CENTER);
    setMapLevel(DEFAULT_MAP_LEVEL);
  }, [selectedLevel]);

  const filteredSeniors = useMemo(() => {
    if (!data?.seniors_by_state) return [];
    const key = selectedLevel.toLowerCase() as keyof typeof data.seniors_by_state;
    return (data.seniors_by_state[key] ?? []).filter(
      (s) => s.latitude != null && s.longitude != null
    );
  }, [data, selectedLevel]);

  useEffect(() => {
    if (selectedSenior?.latitude && selectedSenior?.longitude) {
      setMapCenter({ lat: selectedSenior.latitude, lng: selectedSenior.longitude });
      setMapLevel(ZOOM_ON_SELECT);
    } else {
      setMapCenter(DEFAULT_MAP_CENTER);
      setMapLevel(DEFAULT_MAP_LEVEL);
    }
  }, [selectedSenior]);
  
  if (isError) return <p className="text-center mt-10 text-red-600">대시보드 데이터를 불러오는 데 실패했습니다.</p>;
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;

  return (
    <div className="flex flex-col h-full space-y-4">
      <StatusSummary
        counts={data.state_count}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        <div className="md:col-span-2">
          <RiskRankMap
            seniors={filteredSeniors}
            selectedSenior={selectedSenior}
            mapCenter={mapCenter}
            level={mapLevel}
            onMarkerClick={setSelectedSenior}
            onInfoWindowClick={(s) =>
              router.push(`/analysis/${s.latest_overall_result_id}?senior_id=${s.senior_id}`)
            }
            currentLevel={selectedLevel}
            // isDashboardView prop은 자식 컴포넌트의 기본값이 false이므로 명시적으로 전달해줍니다.
            isDashboardView={true}
          />
        </div>
        <div className="md:col-span-1">
          <RiskRankList
            seniors={filteredSeniors}
            selectedSeniorId={selectedSenior?.senior_id ?? null}
            onSeniorSelect={setSelectedSenior}
            riskLevelLabel={selectedLevel}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <KakaoMapProvider>
      <DashboardContent />
    </KakaoMapProvider>
  );
}