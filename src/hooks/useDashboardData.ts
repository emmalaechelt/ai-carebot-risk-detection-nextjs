// src/hooks/useDashboardData.ts
import useSWR from 'swr';
import { useMemo } from 'react';
import api from '@/lib/api';
import type { DashboardData, SeniorsByState, RiskLevel } from '@/types';

// SWR에 사용할 fetcher 함수
const fetcher = (url: string) => api.get<DashboardData>(url).then(res => res.data);

interface ProcessedDashboardData {
  state_count: DashboardData['state_count'];
  seniors_by_state: SeniorsByState;
}

export function useDashboardData() {
  const { data, error, isLoading } = useSWR<DashboardData>('/dashboard', fetcher, {
    refreshInterval: 60000, // 60초마다 데이터 자동 갱신
  });

  const processedData: ProcessedDashboardData | null = useMemo(() => {
    // data가 없거나, recent_urgent_results가 배열이 아니면 null 반환
    if (!data || !Array.isArray(data.recent_urgent_results)) {
      return null;
    }

    // 상태별로 시니어 데이터를 그룹화할 초기 객체
    const groupedSeniors: SeniorsByState = {
      EMERGENCY: [],
      CRITICAL: [],
      DANGER: [],
      POSITIVE: [],
    };

    data.recent_urgent_results.forEach(senior => {
      // senior.label (e.g., 'EMERGENCY')을 키로 사용하여 해당 배열에 추가
      if (groupedSeniors[senior.label]) {
        groupedSeniors[senior.label].push(senior);
      }
    });
    
    // 각 그룹을 최신순으로 정렬
    Object.keys(groupedSeniors).forEach(key => {
        const level = key as RiskLevel;
        groupedSeniors[level].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    });

    return {
      state_count: data.state_count,
      seniors_by_state: groupedSeniors,
    };
  }, [data]);

  return {
    data: processedData,
    isLoading,
    isError: error,
  };
}