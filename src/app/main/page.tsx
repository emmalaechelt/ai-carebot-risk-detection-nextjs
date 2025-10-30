'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusSummary from '@/components/common/StatusSummary';
import RiskRankMap from '@/components/common/RiskRankMap';
import RiskRankList from '@/components/common/RiskRankList';
import type { DashboardData, DashboardSenior, RiskLevel, SeniorsByState } from '@/types';

// 기본 지도 설정
const DEFAULT_MAP_CENTER = { lat: 36.3504, lng: 127.3845 }; // 대한민국 중심 좌표
const DEFAULT_MAP_LEVEL = 7; // 시/도 단위가 잘 보이는 레벨
const ZOOM_ON_SELECT = 4; // 특정 시니어 선택 시 확대 레벨

/**
 * 데이터 로딩 중 표시될 스켈레톤 UI 컴포넌트
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white shadow-sm animate-pulse h-40" />
      <div className="border rounded-lg p-3 bg-white shadow-sm animate-pulse h-[600px]" />
    </div>
  );
}

/**
 * 고독사 예방 시니어케어 돌봄로봇 데이터 분석 플랫폼의 메인 대시보드 페이지
 */
export default function DashboardPage() {
  const router = useRouter();

  // --- 상태 관리 (State) ---
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<RiskLevel>('EMERGENCY');
  const [selectedSenior, setSelectedSenior] = useState<DashboardSenior | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapLevel, setMapLevel] = useState(DEFAULT_MAP_LEVEL);

  const eventSourceRef = useRef<EventSource | null>(null);

  // --- 데이터 패칭 ---
  const fetchDashboardData = useCallback(async () => {
    if (!loading) setLoading(true);
    try {
      const resp = await api.get<DashboardData>('/dashboard');
      setData(resp.data);
    } catch (err) {
      console.error('대시보드 데이터 패칭 에러:', err);
      setError('대시보드 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 실시간 업데이트 (SSE) ---
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const url = token
      ? `/api/notifications/subscribe?access_token=${encodeURIComponent(token)}`
      : '/api/notifications/subscribe';

    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.onopen = () => console.log('SSE 연결이 열렸습니다.');
    es.onerror = (err) => console.error('SSE 연결 오류 발생:', err);
    es.addEventListener('notification', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'ANALYSIS_COMPLETE' || payload.type === 'SENIOR_STATE_CHANGED') {
          fetchDashboardData();
        }
      } catch (err) {
        console.error('SSE 알림 메시지 파싱 중 오류 발생:', err);
      }
    });

    return () => {
      if (es) es.close();
      eventSourceRef.current = null;
    };
  }, [fetchDashboardData]);

  // ✅ [수정됨] --- 데이터 가공 (Memoization) ---
  // 새로운 API 응답 구조(seniors_by_state)에 맞춰 데이터를 가공합니다.
    const filteredSeniors = useMemo(() => {
    if (!data?.seniors_by_state) return [];
    
    // selectedLevel ('EMERGENCY', 'CRITICAL' 등)을 키로 사용하여 해당 배열을 직접 가져옵니다.
    // API 응답의 키가 소문자일 경우를 대비해 toLowerCase()를 사용할 수 있으나, 타입 정의에 따라 대문자를 사용합니다.
    const key = selectedLevel.toLowerCase() as Lowercase<RiskLevel>;
    const seniorsForLevel = data.seniors_by_state[key] || [];
    return seniorsForLevel
      .filter(s => s.latitude != null && s.longitude != null)
      .sort((a, b) => new Date(b.last_state_changed_at).getTime() - new Date(a.last_state_changed_at).getTime());
  }, [data, selectedLevel]);

  // --- 부가 효과 (Side Effects) ---
  useEffect(() => {
    if (selectedSenior && !filteredSeniors.some(s => s.senior_id === selectedSenior.senior_id)) {
      setSelectedSenior(null);
    }
  }, [filteredSeniors, selectedSenior]);

  useEffect(() => {
    if (selectedSenior?.latitude != null && selectedSenior?.longitude != null) {
      setMapCenter({ lat: selectedSenior.latitude, lng: selectedSenior.longitude });
      setMapLevel(ZOOM_ON_SELECT);
    } else if (filteredSeniors.length > 0 && filteredSeniors[0].latitude != null && filteredSeniors[0].longitude != null) {
      setMapCenter({ lat: filteredSeniors[0].latitude, lng: filteredSeniors[0].longitude });
      setMapLevel(DEFAULT_MAP_LEVEL);
    } else {
      setMapCenter(DEFAULT_MAP_CENTER);
      setMapLevel(DEFAULT_MAP_LEVEL);
    }
  }, [selectedSenior, filteredSeniors]);

  // --- 이벤트 핸들러 ---
  const handleLevelSelect = (level: RiskLevel) => {
    setSelectedLevel(level);
    setSelectedSenior(null);
    setMapLevel(DEFAULT_MAP_LEVEL);
  };

  const handleSeniorSelect = (senior: DashboardSenior) => {
    setSelectedSenior(senior);
  };

  // ✅ [수정됨] 상세 분석 페이지로 이동하는 핸들러
  // API 응답의 'overall_result_id'가 'latest_overall_result_id'로 변경되었습니다.
  const handleInfoWindowClick = (senior?: DashboardSenior) => {
    if (senior?.latest_overall_result_id && senior?.senior_id) {
      router.push(`/analysis/${senior.latest_overall_result_id}/page?senior_id=${senior.senior_id}`);
    }
  };

  // --- 렌더링 로직 ---
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;

  return (
    <div className="container mx-auto space-y-6 p-4">
      <StatusSummary
        counts={data.state_count}
        selectedLevel={selectedLevel}
        onSelectLevel={handleLevelSelect}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        <div className="md:col-span-2">
            <RiskRankMap
                seniors={filteredSeniors}
                selectedSenior={selectedSenior}
                mapCenter={mapCenter}
                level={mapLevel}
                onMarkerClick={handleSeniorSelect}
                onInfoWindowClick={handleInfoWindowClick}
                // ✅ [수정됨] 마커 색상을 결정하기 위해 현재 선택된 레벨을 prop으로 전달합니다.
                currentLevel={selectedLevel}
            />
        </div>

        <div className="md:col-span-1">
            <RiskRankList
                seniors={filteredSeniors}
                selectedSeniorId={selectedSenior?.senior_id ?? null}
                onSeniorSelect={handleSeniorSelect}
                riskLevelLabel={selectedLevel}
            />
        </div>
      </div>
    </div>
  );
}