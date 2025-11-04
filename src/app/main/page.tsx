// src/app/main/page.tsx

"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import StatusSummary from "@/components/common/StatusSummary";
import RiskRankMap from "@/components/common/RiskRankMap";
import RiskRankList from "@/components/common/RiskRankList";
import type { DashboardData, DashboardSenior, RiskLevel } from "@/types";

const DEFAULT_MAP_CENTER = { lat: 36.3504, lng: 127.3845 };
const DEFAULT_MAP_LEVEL = 7;
const ZOOM_ON_SELECT = 4;

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<RiskLevel>("EMERGENCY");
  const [selectedSenior, setSelectedSenior] = useState<DashboardSenior | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapLevel, setMapLevel] = useState(DEFAULT_MAP_LEVEL);

  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const resp = await api.get<DashboardData>("/dashboard");
      setData(resp.data);
    } catch (err) {
      console.error(err);
      setError("대시보드 데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // SSE 연결
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const url = token
      ? `/api/notifications/subscribe?access_token=${encodeURIComponent(token)}`
      : "/api/notifications/subscribe";
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener("notification", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (["ANALYSIS_COMPLETE", "SENIOR_STATE_CHANGED"].includes(payload.type))
          fetchDashboardData();
      } catch (err) {
        console.error("SSE 파싱 오류", err);
      }
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [fetchDashboardData]);

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

  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (loading && !data) return <div>Loading...</div>;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;

  return (
    /* --- 수정된 부분: flex 컨테이너로 변경 --- */
    // 이유: h-full과 flex-col을 사용해 부모 컴포넌트(MainLayout)의 높이에 맞춰 콘텐츠를 채우도록 설정.
    // 기존의 불필요한 p-4 여백을 제거하고 space-y-4로 내부 간격만 조절.
    <div className="flex flex-col h-full space-y-4">
      <StatusSummary
        counts={data.state_count}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
      />
      {/* --- 수정된 부분: 고정 높이 제거 및 flex-1 추가 --- */}
      {/* 이유: 스크롤의 핵심 원인이었던 h-[600px]를 제거. flex-1을 추가하여 StatusSummary를 제외한 나머지 모든 수직 공간을 채우도록 함. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        <div className="md:col-span-2">
          <RiskRankMap
            seniors={filteredSeniors}
            selectedSenior={selectedSenior}
            mapCenter={mapCenter}
            level={mapLevel}
            onMarkerClick={setSelectedSenior}
            onInfoWindowClick={(s) =>
              router.push(`/analysis/${s.latest_overall_result_id}/page?senior_id=${s.senior_id}`)
            }
            currentLevel={selectedLevel}
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