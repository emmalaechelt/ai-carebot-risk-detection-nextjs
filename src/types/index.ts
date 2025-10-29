// ==========================================================
// 📘 API 타입 정의 통합 파일 (index.ts)
// 버전: 1.6.0
// 시스템: 고독사 예방 시니어케어 돌봄로봇 데이터 분석 플랫폼
// ==========================================================

// ----------------------------------------------------------
// --- 인증 및 회원 ---
// ----------------------------------------------------------
export interface Member {
  username: string;
  role: "ROLE_ADMIN" | "ROLE_MEMBER";
  enabled: boolean;
}

// ----------------------------------------------------------
// --- 공통 페이징 응답 타입 ---
// ----------------------------------------------------------
export interface PagedResponse<T> {
  content: T[];
  page_number: number;
  page_size: number;
  total_elements: number;
  total_pages: number;
  is_last: boolean;
  is_first: boolean;
}

// ----------------------------------------------------------
// --- 공통 Enum 및 타입 정의 ---
// ----------------------------------------------------------
export type SeniorState = "POSITIVE" | "DANGER" | "CRITICAL" | "EMERGENCY";
export type SeniorSex = "MALE" | "FEMALE";
export type RiskLevel = SeniorState;

export enum Residence {
  SINGLE_FAMILY_HOME = "단독주택",
  MULTIPLEX_HOUSING = "다세대주택",
  MULTI_FAMILY_HOUSING = "다가구주택",
  APARTMENT = "아파트",
}

// ----------------------------------------------------------
// --- 시니어 상세 정보 (GET /seniors/{id}) ---
// ----------------------------------------------------------
export interface Senior {
  senior_id: number;
  doll_id: string;
  name: string;
  birth_date: string; // YYYY-MM-DD
  sex: SeniorSex;
  phone: string;
  address: string;
  address_detail: string;
  latitude?: number;
  longitude?: number;
  residence: Residence | "";
  diseases?: string;
  medications?: string;
  disease_note?: string;
  guardian_name: string;
  relationship: string;
  guardian_phone: string;
  guardian_note?: string;
  note?: string;
  photo: string | null;
  recent_overall_results?: {
    id: number;
    label: SeniorState;
    summary: string;
    timestamp: string;
    is_resolved: boolean;
  }[];
}

// ----------------------------------------------------------
// --- 시니어 목록 조회용 축약 정보 (GET /seniors) ---
// ----------------------------------------------------------
export interface SeniorListView {
  senior_id: number;
  name: string;
  age: number;
  sex: SeniorSex;
  gu: string;
  dong: string;
  state: SeniorState;
  latitude: number;
  longitude: number;
  doll_id: string;
  phone: string;
  created_at: string; // ISO 8601 "YYYY-MM-DDTHH:mm:ss"
}

// ----------------------------------------------------------
// --- 대시보드 데이터 (GET /dashboard) ---
// ----------------------------------------------------------
export interface DashboardSenior {
  overall_result_id: number;
  senior_id: number;
  label: SeniorState;
  name: string;
  age: number;
  sex: SeniorSex;
  gu: string;
  dong: string;
  latitude: number | null;
  longitude: number | null;
  summary: string;
  treatment_plan?: string;
  timestamp: string;
  is_resolved: boolean;
}

export interface DashboardData {
  state_count: {
    total: number;
    positive: number;
    danger: number;
    critical: number;
    emergency: number;
    [key: string]: number;
  };
  recent_urgent_results: DashboardSenior[];
}

// ----------------------------------------------------------
// --- 프론트엔드 가공 데이터 타입 ---
// ----------------------------------------------------------
export type SeniorsByState = {
  [key in RiskLevel]: DashboardSenior[];
};

// ----------------------------------------------------------
// --- 긴급 분석 결과 (대시보드 내 사용) ---
// ----------------------------------------------------------
export interface UrgentResult {
  overall_result_id: number;
  label: SeniorState;
  senior_name: string;
  age: number;
  sex: SeniorSex;
  gu: string;
  dong: string;
  summary: string;
  treatment_plan?: string;
  timestamp: string;
  is_resolved: boolean;
}

// ----------------------------------------------------------
// --- 지도/리스크 시니어용 확장 타입 ---
// ----------------------------------------------------------
export interface RiskSenior extends UrgentResult {
  name?: string;
  lat?: number;
  lng?: number;
}

// ----------------------------------------------------------
// --- 인형 목록 조회용 축약 정보 (GET /dolls) ---
// ----------------------------------------------------------
export interface DollListView {
  id: string;
  senior_id: number | null;
}

// ----------------------------------------------------------
// --- 공통 에러 응답 타입 ---
// ----------------------------------------------------------
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// ----------------------------------------------------------
// --- API 응답 유틸리티 타입 ---
// ----------------------------------------------------------
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
};

// ----------------------------------------------------------
// --- API 버전 정보 ---
// ----------------------------------------------------------
export const API_VERSION = "1.6.0";

// ==========================================================
// ✅ End of File
// ==========================================================