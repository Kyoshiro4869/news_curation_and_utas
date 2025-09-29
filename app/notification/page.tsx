"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { safeFormat } from "@/lib/date-utils";
import { FACULTIES, GRADES } from "@/lib/notification-targets";
type SortKey = "utas" | "app";
type SortDirection = "asc" | "desc";
type SortConfig = { key: SortKey; direction: SortDirection };

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [activeTab, setActiveTab] = useState("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [editingNotification, setEditingNotification] =
    useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "utas",
    direction: "desc",
  });

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
    return safeFormat(date, "yyyy年MM月dd日 HH:mm");
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

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        const normalizedQuery = searchTerm.toLowerCase();
        const matchesSearch =
          notification.title.toLowerCase().includes(normalizedQuery) ||
          notification.department.toLowerCase().includes(normalizedQuery);

        const faculties = notification.targetFaculties || [];
        const grades = notification.targetGrades || [];

        const matchesFaculty =
          facultyFilter === "all" ||
          faculties.includes(facultyFilter) ||
          faculties.includes("全学部");

        const matchesGrade =
          gradeFilter === "all" ||
          grades.includes(gradeFilter) ||
          grades.includes("全学年");

        return matchesSearch && matchesFaculty && matchesGrade;
      }),
    [notifications, searchTerm, facultyFilter, gradeFilter]
  );

  const parseUtasDateTime = (date?: string, time?: string) => {
    if (!date || !time) return null;

    const dateParts = date.split(/[./-]/).map((part) => parseInt(part, 10));
    const timeParts = time.split(":").map((part) => parseInt(part, 10));

    if (
      dateParts.length < 3 ||
      dateParts.some((value) => Number.isNaN(value)) ||
      timeParts.length < 2 ||
      timeParts.some((value) => Number.isNaN(value))
    ) {
      return null;
    }

    const [year, month, day] = dateParts;
    const [hours, minutes] = timeParts;

    return new Date(year, month - 1, day, hours, minutes);
  };

  const sortedNotifications = useMemo(() => {
    const fallbackValue =
      sortConfig.direction === "asc"
        ? Number.POSITIVE_INFINITY
        : Number.NEGATIVE_INFINITY;

    const getSortValue = (notification: Notification) => {
      if (sortConfig.key === "app") {
        const timestamp = notification.publishedAt?.getTime();
        return Number.isFinite(timestamp) ? (timestamp as number) : fallbackValue;
      }

      const utasDate = parseUtasDateTime(
        notification.utasPublishedDate,
        notification.utasPublishedTime
      );

      return utasDate ? utasDate.getTime() : fallbackValue;
    };

    const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;

    return [...filteredNotifications].sort((a, b) => {
      const diff = getSortValue(a) - getSortValue(b);
      if (Number.isNaN(diff) || diff === 0) {
        return 0;
      }

      return diff * directionMultiplier;
    });
  }, [filteredNotifications, sortConfig]);

  const handleSortChange = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return { key, direction: "desc" };
    });
  };

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex w-full flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="お知らせを検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select value={facultyFilter} onValueChange={setFacultyFilter}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="対象学部を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ての学部</SelectItem>
                    {FACULTIES.map((faculty) => (
                      <SelectItem key={faculty} value={faculty}>
                        {faculty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="対象学年を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ての学年</SelectItem>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={() => setActiveTab("create")}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </div>

          <div className="text-sm text-gray-500 text-right">
            表示件数: {sortedNotifications.length}件
          </div>

          <NotificationList
            notifications={sortedNotifications}
            onView={setSelectedNotification}
            onEdit={setEditingNotification}
            onDelete={handleDeleteNotification}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
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
