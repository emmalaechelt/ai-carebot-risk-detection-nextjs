// src/types/notification.ts

/**
 * 알림 객체의 데이터 구조를 정의합니다.
 * - id: 알림의 고유 식별자 (백엔드에서 제공)
 * - type: 알림 종류 ('urgent' | 'csv_analysis')
 * - message: 알림 메시지
 * - link: 알림 클릭 시 이동할 경로 (선택 사항)
 */
export interface Notification {
  notification_id: number;
  type: "csv_analysis" | "urgent";
  message: string;
  is_read: boolean;
  created_at: string;
  summary: string;
  link?: string;
  resource_id?: number;
}

/**
 * 클라이언트 상태 관리를 위한 타입.
 * 백엔드에서 받은 Notification 데이터에 'read' 속성을 추가합니다.
 */
export interface ClientNotification extends Notification {
  read: boolean;
}