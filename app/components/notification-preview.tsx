"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, AlertTriangle, Building, Calendar } from "lucide-react";
import { Notification } from "@/types/notification";
import { safeFormat } from "@/lib/date-utils";

interface NotificationPreviewProps {
  notification: Notification;
  onClose: () => void;
}

export function NotificationPreview({
  notification,
  onClose,
}: NotificationPreviewProps) {
  const renderContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>お知らせプレビュー</DialogTitle>
        </DialogHeader>

        {/* モバイルプレビュー（PDFと同じレイアウト） */}
        <div className="bg-white">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b bg-blue-50">
            <span className="text-sm font-medium text-gray-700">
              お知らせ詳細
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* コンテンツ */}
          <div className="p-4 space-y-4">
            {/* タイトルと重要マーク */}
            <div>
              {notification.isImportant && (
                <Badge variant="destructive" className="text-xs mb-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  重要
                </Badge>
              )}
              <h2 className="font-semibold text-base leading-tight mb-3">
                {notification.title}
              </h2>
            </div>

            {/* 配信元と日時 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                <span>{notification.department}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>
                  掲載日時:{" "}
                  {safeFormat(notification.publishedAt, "yyyy年MM月dd日 HH:mm")}
                </span>
              </div>
            </div>

            {/* 内容 */}
            <div>
              <h3 className="font-medium text-sm mb-2">内容</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {renderContentWithLinks(notification.content)}
              </div>
            </div>

            {/* 対象 */}
            <div>
              <h3 className="font-medium text-sm mb-2">対象</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">対象学部: </span>
                  <span className="text-sm">
                    {notification.targetFaculties.length === 25
                      ? "全学部"
                      : notification.targetFaculties.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">対象学年: </span>
                  <span className="text-sm">
                    {notification.targetGrades.length === 7
                      ? "全学年"
                      : notification.targetGrades.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* 関連リンク */}
            {notification.links && notification.links.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2">関連リンク</h3>
                <div className="space-y-1">
                  {notification.links.map((link, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-600">URL{index + 1}: </span>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {link}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
