import { Timestamp } from "firebase/firestore";

// お知らせデータの型定義
export type Notification = {
  id: string; // Firestoreのドキュメントidに対応
  title: string;
  content: string;
  department: string;
  publishedAt: Date;
  targetFaculties: string[];
  targetGrades: string[];
  isImportant: boolean;
  status: "published" | "scheduled" | "draft";
  links: string[];
  utasPublishedDate: string;
  utasPublishedTime: string;
  deliveryType?: "immediate" | "scheduled";
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt?: Date; // 作成日時
  updatedAt?: Date; // 更新日時
};

// Firestoreに保存するためのNotification型（Dateを文字列として扱う）
export type NotificationFirestore = Omit<
  Notification,
  "createdAt" | "updatedAt" | "publishedAt"
> & {
  createdAt: string; // ISO文字列として保存
  updatedAt: string; // ISO文字列として保存
  publishedAt: Timestamp; // Timestampとして保存
};

// お知らせフォームデータの型定義
export type NotificationFormData = {
  title: string;
  content: string;
  department: string;
  targetFaculties: string[];
  targetGrades: string[];
  isImportant: boolean;
  links: string[];
  utasPublishedDate: string;
  utasPublishedTime: string;
  deliveryType: "immediate" | "scheduled";
  scheduledDate?: string;
  scheduledTime?: string;
};
