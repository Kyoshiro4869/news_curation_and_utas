// Firebase Firestoreを使用した通知管理サービス
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Notification,
  NotificationFirestore,
  NotificationFormData,
} from "@/types/notification";

const COLLECTION_NAME = "tic-utas-notifications";

// Firestoreデータを型付きNotificationに変換
const convertFirestoreToNotification = (
  id: string,
  data: DocumentData
): Notification => {
  return {
    ...data,
    id,
    createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
  } as Notification;
};

// Notificationデータを Firestoreデータに変換
const convertNotificationToFirestore = (
  notification: Partial<Notification>
): Partial<NotificationFirestore> => {
  const { createdAt, updatedAt, ...rest } = notification;
  return {
    ...rest,
    createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// 全通知を取得
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      convertFirestoreToNotification(doc.id, doc.data())
    );
  } catch (error) {
    console.error("通知の取得に失敗しました:", error);
    throw error;
  }
};

// 通知をリアルタイムで監視
export const subscribeToNotifications = (
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (querySnapshot: QuerySnapshot<DocumentData>) => {
      const notifications = querySnapshot.docs.map((doc) =>
        convertFirestoreToNotification(doc.id, doc.data())
      );
      callback(notifications);
    },
    (error) => {
      console.error("通知の監視でエラーが発生しました:", error);
    }
  );
};

// 特定の通知を取得
export const getNotificationById = async (
  id: string
): Promise<Notification | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertFirestoreToNotification(docSnap.id, docSnap.data());
    } else {
      return null;
    }
  } catch (error) {
    console.error("通知の取得に失敗しました:", error);
    throw error;
  }
};

// 新しい通知を作成
export const createNotification = async (
  notificationData: NotificationFormData
): Promise<Notification> => {
  try {
    const now = new Date();
    const newNotification: Partial<Notification> = {
      ...notificationData,
      status:
        notificationData.deliveryType === "immediate"
          ? "published"
          : "scheduled",
      publishedAt:
        notificationData.deliveryType === "immediate"
          ? formatDateTime(now)
          : `${notificationData.scheduledDate} ${notificationData.scheduledTime}`,
      createdAt: now,
      updatedAt: now,
    };

    const firestoreData = convertNotificationToFirestore(newNotification);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), firestoreData);

    return {
      ...newNotification,
      id: docRef.id,
    } as Notification;
  } catch (error) {
    console.error("通知の作成に失敗しました:", error);
    throw error;
  }
};

// 通知を更新
export const updateNotification = async (
  id: string,
  updateData: NotificationFormData
): Promise<Notification> => {
  try {
    const now = new Date();
    const updatedNotification: Partial<Notification> = {
      ...updateData,
      status:
        updateData.deliveryType === "immediate" ? "published" : "scheduled",
      publishedAt:
        updateData.deliveryType === "immediate"
          ? formatDateTime(now)
          : `${updateData.scheduledDate} ${updateData.scheduledTime}`,
      updatedAt: now,
    };

    const firestoreData = convertNotificationToFirestore(updatedNotification);
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, firestoreData);

    return {
      ...updatedNotification,
      id,
    } as Notification;
  } catch (error) {
    console.error("通知の更新に失敗しました:", error);
    throw error;
  }
};

// 通知を削除
export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("通知の削除に失敗しました:", error);
    throw error;
  }
};

// 日時フォーマット関数
const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).format(date);
};
