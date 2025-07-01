"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Send, Calendar, AlertTriangle } from "lucide-react";
import { NotificationForm } from "../components/notification-form";
import { NotificationPreview } from "../components/notification-preview";
import { NotificationList } from "../components/notification-list";
import { EditNotificationModal } from "../components/edit-notification-modal";
import { Notification, NotificationFormData } from "@/types/notification";
import {
  subscribeToNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
} from "@/lib/notification-service";

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [activeTab, setActiveTab] = useState("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingNotification, setEditingNotification] =
    useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // Firestoreから通知をリアルタイムで取得
    const unsubscribe = subscribeToNotifications((notifications) => {
      setNotifications(notifications);
      setLoading(false);
    });

    // クリーンアップ関数
    return () => unsubscribe();
  }, []);

  const formatDateTime = (date: Date): string => {
    if (!mounted) return "";
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    }).format(date);
  };

  const handleCreateNotification = async (
    notificationData: NotificationFormData
  ) => {
    if (!mounted) return;

    try {
      setLoading(true);
      await createNotification(notificationData);
      setActiveTab("list");
      setError(null);
    } catch (error) {
      console.error("通知の作成に失敗しました:", error);
      setError("通知の作成に失敗しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotification = async (
    updatedNotification: NotificationFormData & { id: string }
  ) => {
    if (!mounted) return;

    try {
      setLoading(true);
      await updateNotification(updatedNotification.id, updatedNotification);
      setEditingNotification(null);
      setError(null);
    } catch (error) {
      console.error("通知の更新に失敗しました:", error);
      setError("通知の更新に失敗しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      setLoading(true);
      await deleteNotification(id);
      setSelectedNotification(null);
      setError(null);
    } catch (error) {
      console.error("通知の削除に失敗しました:", error);
      setError("通知の削除に失敗しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateStats = () => {
    if (!mounted) return { total: 0, important: 0, thisWeek: 0 };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return {
      total: notifications.length,
      important: notifications.filter((n) => n.isImportant).length,
      thisWeek: notifications.filter((n) => {
        try {
          const publishDate = new Date(n.publishedAt);
          return publishDate > weekAgo;
        } catch {
          return false;
        }
      }).length,
    };
  };

  const stats = calculateStats();

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">UTAS お知らせ</h2>
        <p className="text-gray-600">
          学内生向けお知らせの配信・管理を行います
        </p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総お知らせ数</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">配信済み</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              重要なお知らせ
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.important}</div>
            <p className="text-xs text-muted-foreground">重要マーク付き</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今週の配信</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">過去7日間</p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">お知らせ配信</TabsTrigger>
          <TabsTrigger value="list">配信済みお知らせ一覧</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="お知らせを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setActiveTab("create")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Button>
          </div>

          <NotificationList
            notifications={filteredNotifications}
            onView={setSelectedNotification}
            onEdit={setEditingNotification}
            onDelete={handleDeleteNotification}
          />
        </TabsContent>

        <TabsContent value="create">
          <NotificationForm
            onSubmit={handleCreateNotification}
            onCancel={() => setActiveTab("list")}
          />
        </TabsContent>
      </Tabs>

      {/* プレビューモーダル */}
      {selectedNotification && activeTab === "list" && (
        <NotificationPreview
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}

      {/* 編集モーダル */}
      {editingNotification && (
        <EditNotificationModal
          notification={editingNotification}
          onSubmit={handleUpdateNotification}
          onClose={() => setEditingNotification(null)}
        />
      )}
    </div>
  );
}
