// src/types/notification.ts

export interface Notification {
  notification_id: number;
  type: string;
  message: string; 
  summary: string;
  is_read: boolean;
  created_at: string;
  resource_id: string;
  link: string;
}