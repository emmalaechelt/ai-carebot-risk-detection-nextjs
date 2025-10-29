'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import StatusSummary from '@/components/common/StatusSummary';
import RiskRankMap from '@/components/common/RiskRankMap';
import RiskRankList from '@/components/common/RiskRankList';
import { DashboardData, DashboardSenior, RiskLevel } from '@/types';

// 대전 중심 좌표
const DEFAULT_MAP_CENTER = { lat: 36.3504, lng: 127.3845 };

// 스켈레톤 UI
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white shadow-sm animate-pulse h-40"></div>
      <div className="border rounded-lg p-3 bg-white shadow-sm animate-pulse h-[500px]"></div>
    </div>
  );
}

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

  const [selectedLevel, setSelectedLevel] = useState<RiskLevel>('EMERGENCY');
  const [selectedSenior, setSelectedSenior] = useState<DashboardSenior | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);

  // SSE/알림과는 별개로 초기 대시보드 데이터 fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get<DashboardData>('/dashboard');
        setData(response.data);
      } catch {
        setError('대시보드 데이터를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSeniors = useMemo(() => {
    if (!data) return [];
    const seniors = data.seniors_by_state[selectedLevel] || [];
    return [...seniors].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [data, selectedLevel]);

  // 선택한 시니어가 필터링 목록에 없으면 선택 해제
  useEffect(() => {
    if (selectedSenior && !filteredSeniors.some(s => s.senior_id === selectedSenior.senior_id)) {
      setSelectedSenior(null);
    }
  }, [filteredSeniors, selectedSenior]);

  // 지도 센터 설정
  useEffect(() => {
    if (selectedSenior?.latitude && selectedSenior?.longitude) {
      setMapCenter({ lat: selectedSenior.latitude, lng: selectedSenior.longitude });
    } else if (filteredSeniors.length > 0 && filteredSeniors[0].latitude && filteredSeniors[0].longitude) {
      setMapCenter({ lat: filteredSeniors[0].latitude, lng: filteredSeniors[0].longitude });
    } else {
      setMapCenter(DEFAULT_MAP_CENTER);
    }
  }, [selectedSenior, filteredSeniors]);

  const handleLevelSelect = (level: RiskLevel) => {
    setSelectedLevel(level);
    setSelectedSenior(null);
  };

  const handleSeniorSelect = (senior: DashboardSenior) => {
    setSelectedSenior(senior);
  };

  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;

  return (
    <div className="container mx-auto space-y-6">
      {/* 전체 현황 / 상태 요약 */}
      <StatusSummary
        counts={data.state_count}
        selectedLevel={selectedLevel}
        onSelectLevel={handleLevelSelect}
      />

      {/* 긴급 상황 발생 지역 지도 + 목록 */}
      <div className="flex flex-col md:flex-row gap-4">
        <RiskRankMap
          seniors={filteredSeniors}
          selectedSenior={selectedSenior}
          mapCenter={mapCenter}
          onMarkerClick={handleSeniorSelect}
        />
        <RiskRankList
          seniors={filteredSeniors}
          selectedSeniorId={selectedSenior?.senior_id || null}
          onSeniorSelect={handleSeniorSelect}
          riskLevel={selectedLevel}
        />
      </div>
    </div>
  );
}
