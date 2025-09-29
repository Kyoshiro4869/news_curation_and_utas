"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  Check,
  Building,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { Notification } from "@/types/notification";
import { FACULTIES, GRADES } from "@/lib/notification-targets";
import { safeFormat } from "@/lib/date-utils";

type SortKey = "utas" | "app";
type SortDirection = "asc" | "desc";

interface NotificationListProps {
  notifications: Notification[];
  onView: (notification: Notification) => void;
  onEdit: (notification: Notification) => void;
  onDelete: (id: string) => void;

  sortConfig: { key: SortKey; direction: SortDirection };
  onSortChange: (key: SortKey) => void;

}

export function NotificationList({
  notifications,
  onView,
  onEdit,
  onDelete,

  sortConfig,
  onSortChange,

}: NotificationListProps) {
  const formatTargets = (faculties: string[], grades: string[]) => {
    const hasAllFaculties =
      faculties.length === FACULTIES.length || faculties.includes("全学部");
    const hasAllGrades =
      grades.length === GRADES.length || grades.includes("全学年");

    const facultyText = hasAllFaculties
      ? "全学部"
      : faculties.slice(0, 2).join(", ") +
        (faculties.length > 2 ? "..." : "");
    const gradeText = hasAllGrades
      ? "全学年"
      : grades.slice(0, 2).join(", ") + (grades.length > 2 ? "..." : "");
    return `${facultyText} / ${gradeText}`;
  };

  const formatUtasDateTime = (date?: string, time?: string) => {
    if (!date || !time) return "未設定";
    return `${date} ${time}`;
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500 mb-4">お知らせが見つかりません</p>
            <p className="text-sm text-gray-400">検索条件を変更してください</p>
          </div>
        </CardContent>
      </Card>
    );
  }


  const isUtasSort = sortConfig.key === "utas";
  const isAppSort = sortConfig.key === "app";

  const sortIconClass = (key: SortKey) =>
    `${sortConfig.key === key ? "text-blue-600" : "text-gray-400"} ${
      sortConfig.key === key && sortConfig.direction === "asc"
        ? "rotate-180"
        : ""
    }`;

  const getSortState = (key: SortKey): "ascending" | "descending" | "none" => {
    if (sortConfig.key !== key) {
      return "none";
    }

    return sortConfig.direction === "asc" ? "ascending" : "descending";
  };


  return (
    <Card>
      <CardContent className="p-0">
        {/* ヘッダー */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 font-medium text-sm text-gray-700">
          <div className="col-span-3">タイトル</div>
          <div className="col-span-2">配信元</div>
          <div className="col-span-2">対象学部/学年</div>
          <div

            className="col-span-2"
            role="columnheader"
            aria-sort={getSortState("utas")}
          >
            <Button
              variant="ghost"
              onClick={() => onSortChange("utas")}
              className={`-ml-3 h-auto px-2 py-1 text-left text-sm font-medium ${
                isUtasSort ? "text-blue-600" : "text-gray-700"
              }`}
            >
              <span className="flex items-center gap-1">
                UTAS掲載日時
                <ArrowUpDown className={`h-3.5 w-3.5 transition ${sortIconClass("utas")}`} />
              </span>
            </Button>
          </div>
          <div
            className="col-span-2"
            role="columnheader"
            aria-sort={getSortState("app")}
          >
            <Button
              variant="ghost"
              onClick={() => onSortChange("app")}
              className={`-ml-3 h-auto px-2 py-1 text-left text-sm font-medium ${
                isAppSort ? "text-blue-600" : "text-gray-700"
              }`}
            >
              <span className="flex items-center gap-1">
                アプリ配信日時
                <ArrowUpDown className={`h-3.5 w-3.5 transition ${sortIconClass("app")}`} />
              </span>
            </Button>

          </div>
          <div className="col-span-1"></div>
        </div>

        {/* データ行 */}
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* タイトル列 */}
              <div className="col-span-3">
                <div className="flex items-start gap-2">
                  {notification.isImportant && (
                    <Badge
                      variant="destructive"
                      className="text-xs mt-1 flex-shrink-0"
                    >
                      重要
                    </Badge>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2 leading-tight">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {notification.content}
                    </p>
                  </div>
                </div>
              </div>

              {/* 配信元列 */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-900 truncate">
                    {notification.department}
                  </span>
                </div>
              </div>

              {/* 対象学部/学年列 */}
              <div className="col-span-2">
                <div className="text-sm text-gray-900">
                  {formatTargets(
                    notification.targetFaculties,
                    notification.targetGrades
                  )}
                </div>
              </div>

              {/* UTAS掲載日時列 */}
              <div
                className={`col-span-2 ${
                  isUtasSort ? "text-blue-700" : ""
                }`}
              >
                <div className="flex items-center gap-1 text-sm text-gray-900">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span>
                    {formatUtasDateTime(
                      notification.utasPublishedDate,
                      notification.utasPublishedTime
                    )}
                  </span>
                </div>
              </div>

              {/* アプリ配信日時列 */}
              <div
                className={`col-span-2 ${
                  isAppSort ? "text-blue-700" : ""
                }`}
              >
                <div className="text-sm text-gray-900 mb-1">
                  {safeFormat(notification.publishedAt, "yyyy/MM/dd HH:mm")}
                </div>
                <Badge
                  variant={
                    notification.status === "published"
                      ? "default"
                      : "secondary"
                  }
                  className={`text-xs px-2 py-1 rounded-full ${
                    notification.status === "published"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-orange-100 text-orange-800 border-orange-200"
                  }`}
                >
                  {notification.status === "published" ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      配信済み
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      配信予約中
                    </>
                  )}
                </Badge>
              </div>

              {/* アクション列 */}
              <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(notification)}>
                      <Eye className="h-4 w-4 mr-2" />
                      プレビュー
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(notification)}>
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm("このお知らせを削除しますか？")) {
                          onDelete(notification.id);
                        }
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
