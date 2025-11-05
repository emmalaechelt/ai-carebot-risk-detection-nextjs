"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import StatusSummary from "@/components/common/StatusSummary";
import RiskRankMap from "@/components/common/RiskRankMap";
import RiskRankList from "@/components/common/RiskRankList";
import type { DashboardData, DashboardSenior, RiskLevel } from "@/types";
// --- ⬇️ 1번: useKakaoMap 훅을 import 합니다 ---
import { useKakaoMap } from "@/contexts/KakaoMapContext";

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
  
  // --- ⬇️ 2번: KakaoMapContext에서 isKakaoLoaded 상태를 가져옵니다 ---
  const { isKakaoLoaded } = useKakaoMap();

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
    <div className="flex flex-col h-full space-y-4">
      <StatusSummary
        counts={data.state_count}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
      />
      
      {/* --- ⬇️ 3번: isKakaoLoaded 상태를 확인하는 조건부 렌더링 추가 --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {isKakaoLoaded ? (
          <>
            <div className="md:col-span-2">
              <RiskRankMap
                seniors={filteredSeniors}
                selectedSenior={selectedSenior}
                mapCenter={mapCenter}
                level={mapLevel}
                onMarkerClick={setSelectedSenior}
                onInfoWindowClick={(s) =>
                  router.push(`/main/analysis/${s.latest_overall_result_id}?senior_id=${s.senior_id}`)
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
          </>
        ) : (
          // 지도가 로딩되는 동안 보여줄 화면
          <div className="md:col-span-3 text-center py-10 text-gray-500">
            지도 로딩 중...
          </div>
        )}
      </div>
    </div>
  );
}