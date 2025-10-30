'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusSummary from '@/components/common/StatusSummary';
import RiskRankMap from '@/components/common/RiskRankMap';
import RiskRankList from '@/components/common/RiskRankList';
import type { DashboardData, DashboardSenior, RiskLevel, SeniorsByState } from '@/types';

const DEFAULT_MAP_CENTER = { lat: 36.3504, lng: 127.3845 };
const DEFAULT_MAP_LEVEL = 7; // 기본 지도 레벨
const ZOOM_ON_SELECT = 4; // 카드 클릭 시 줌 레벨

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white shadow-sm animate-pulse h-40" />
      <div className="border rounded-lg p-3 bg-white shadow-sm animate-pulse h-[500px]" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLevel, setSelectedLevel] = useState<RiskLevel>('EMERGENCY');
  const [selectedSenior, setSelectedSenior] = useState<DashboardSenior | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapLevel, setMapLevel] = useState(DEFAULT_MAP_LEVEL);

  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE / 대시보드 데이터 fetch
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get<DashboardData>('/main');
      setData(resp.data);
    } catch (err) {
      console.error(err);
      setError('대시보드 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // SSE 구독
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const url = token
      ? `/api/notifications/subscribe?access_token=${encodeURIComponent(token)}`
      : '/api/notifications/subscribe';

    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener('open', () => console.debug('SSE 연결 열림'));
    es.addEventListener('error', (err) => console.error('SSE 에러', err));
    es.addEventListener('notification', (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data);
        if (payload.type === 'ANALYSIS_COMPLETE' || payload.type === 'SENIOR_STATE_CHANGED') {
          fetchDashboardData();
        }
      } catch (err) {
        console.error('SSE notification parse error', err);
      }
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [fetchDashboardData]);

  // 상태별 필터링 + 안전한 recent_urgent_results 처리
  const filteredSeniors = useMemo(() => {
    if (!data) return [];
    const arr = data.recent_urgent_results ?? [];
    return arr
      .filter(s => s.label === selectedLevel && s.latitude != null && s.longitude != null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data, selectedLevel]);

  // 선택된 시니어가 목록에 없으면 해제
  useEffect(() => {
    if (selectedSenior && !filteredSeniors.some(s => s.senior_id === selectedSenior.senior_id)) {
      setSelectedSenior(null);
    }
  }, [filteredSeniors, selectedSenior]);

  // 지도 중심 + 레벨 조정
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

  const handleLevelSelect = (level: RiskLevel) => {
    setSelectedLevel(level);
    setSelectedSenior(null);
    setMapLevel(DEFAULT_MAP_LEVEL);
  };

  const handleSeniorSelect = (senior: DashboardSenior) => {
    setSelectedSenior(senior);
    if (senior.latitude != null && senior.longitude != null) {
      setMapCenter({ lat: senior.latitude, lng: senior.longitude });
      setMapLevel(ZOOM_ON_SELECT);
    }
  };

  const handleInfoWindowClick = (senior?: DashboardSenior) => {
    if (!senior || !senior.overall_result_id) return;
    router.push(`/analysis/${senior.overall_result_id}/page`);
  };

  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;

  return (
    <div className="container mx-auto space-y-6">
      <StatusSummary
        counts={data.state_count}
        selectedLevel={selectedLevel}
        onSelectLevel={handleLevelSelect}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <RiskRankMap
          seniors={filteredSeniors}
          selectedSenior={selectedSenior}
          mapCenter={mapCenter}
          mapLevel={mapLevel}
          onMarkerClick={handleSeniorSelect}
          onInfoWindowClick={handleInfoWindowClick}
        />
        <RiskRankList
          seniors={filteredSeniors}
          selectedSeniorId={selectedSenior?.senior_id ?? null}
          onSeniorSelect={handleSeniorSelect}
          riskLevel={selectedLevel}
        />
      </div>
    </div>
  );
}
