"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Send, X, Plus, AlertTriangle } from "lucide-react";
import { Notification, NotificationFormData } from "@/types/notification";
import { FACULTIES, GRADES } from "@/lib/notification-targets";

const DEPARTMENTS = [
  "教務課",
  "学生課",
  "附属図書館",
  "保健センター",
  "多様性包摂共創センター/ジェンダー・エクイティ推進オフィス",
  "国際センター",
  "キャリアサポート室",
  "情報システム部",
];

interface NotificationFormProps {
  notification?: Notification;
  onSubmit: (data: NotificationFormData & { id?: string }) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export function NotificationForm({
  notification,
  onSubmit,
  onCancel,
  isEdit = false,
}: NotificationFormProps) {
  const [formData, setFormData] = useState<NotificationFormData>({
    title: "",
    content: "",
    department: "",
    targetFaculties: [],
    targetGrades: [],
    isImportant: false,
    links: [""],
    deliveryType: "immediate",
    scheduledDate: "",
    scheduledTime: "",
    utasPublishedDate: "",
    utasPublishedTime: "",
  });

  useEffect(() => {
    if (notification) {
      // 編集時に「全学部」「全学年」の場合は全ての選択肢を選択状態にする
      const targetFaculties =
        notification.targetFaculties?.includes("全学部") ||
        notification.targetFaculties?.length === FACULTIES.length
          ? [...FACULTIES]
          : notification.targetFaculties || [];

      const targetGrades =
        notification.targetGrades?.includes("全学年") ||
        notification.targetGrades?.length === GRADES.length
          ? [...GRADES]
          : notification.targetGrades || [];

      setFormData({
        title: notification.title || "",
        content: notification.content || "",
        department: notification.department || "",
        targetFaculties,
        targetGrades,
        isImportant: notification.isImportant || false,
        links: notification.links?.length > 0 ? notification.links : [""],
        deliveryType: notification.deliveryType || "immediate",
        scheduledDate: notification.scheduledDate || "",
        scheduledTime: notification.scheduledTime || "",
        utasPublishedDate: notification.utasPublishedDate || "",
        utasPublishedTime: notification.utasPublishedTime || "",
      });
    } else {
      // 新規作成時のデフォルト値
      setFormData({
        title: "",
        content: "",
        department: "",
        targetFaculties: [],
        targetGrades: [],
        isImportant: false,
        links: [""],
        deliveryType: "immediate",
        scheduledDate: "",
        scheduledTime: "",
        utasPublishedDate: "",
        utasPublishedTime: "",
      });
    }
  }, [notification]);

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      links: formData.links.filter((link) => link.trim() !== ""),
      ...(notification && { id: notification.id }),
    };
    onSubmit(submitData);
  };

  const selectAllFaculties = () => {
    setFormData((prev) => ({
      ...prev,
      targetFaculties:
        prev.targetFaculties.length === FACULTIES.length ? [] : [...FACULTIES],
    }));
  };

  const selectAllGrades = () => {
    setFormData((prev) => ({
      ...prev,
      targetGrades:
        prev.targetGrades.length === GRADES.length ? [] : [...GRADES],
    }));
  };

  const handleFacultyToggle = (faculty: string) => {
    setFormData((prev) => ({
      ...prev,
      targetFaculties: prev.targetFaculties.includes(faculty)
        ? prev.targetFaculties.filter((f) => f !== faculty)
        : [...prev.targetFaculties, faculty],
    }));
  };

  const handleGradeToggle = (grade: string) => {
    setFormData((prev) => ({
      ...prev,
      targetGrades: prev.targetGrades.includes(grade)
        ? prev.targetGrades.filter((g) => g !== grade)
        : [...prev.targetGrades, grade],
    }));
  };

  const handleLinkChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.map((link, i) => (i === index ? value : link)),
    }));
  };

  const addLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, ""],
    }));
  };

  const removeLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEdit ? "お知らせを編集" : "新規お知らせを作成"}
          {formData.isImportant && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              重要
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? "お知らせの内容を編集して更新してください"
            : "新しいお知らせを作成して学内生に配信します"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="important"
                checked={formData.isImportant}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isImportant: !!checked }))
                }
              />
              <Label htmlFor="important" className="text-sm font-medium">
                重要なお知らせとしてマークする
              </Label>
            </div>

            <div>
              <Label htmlFor="title">
                タイトル <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="お知らせのタイトルを入力してください"
                required
              />
            </div>

            <div>
              <Label htmlFor="department">
                配信元団体 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                placeholder="配信元団体名を入力してください"
                required
              />
            </div>

            <div>
              <Label htmlFor="content">
                内容 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="お知らせの詳細内容を入力してください"
                rows={8}
                required
              />
            </div>
          </div>

          {/* UTAS掲載日時 */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              UTAS内の掲載日時 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="utasPublishedDate">
                  掲載日 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="utasPublishedDate"
                  type="date"
                  value={formData.utasPublishedDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      utasPublishedDate: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="utasPublishedTime">
                  掲載時刻 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="utasPublishedTime"
                  type="time"
                  value={formData.utasPublishedTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      utasPublishedTime: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              東京大学UTAS内に実際に掲載された日時を入力してください
            </p>
          </div>

          {/* 対象設定 */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>
                  対象学部 <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllFaculties}
                >
                  {formData.targetFaculties.length === FACULTIES.length
                    ? "全て解除"
                    : "全て選択"}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {FACULTIES.map((faculty) => (
                  <div key={faculty} className="flex items-center space-x-2">
                    <Checkbox
                      id={`faculty-${faculty}`}
                      checked={formData.targetFaculties.includes(faculty)}
                      onCheckedChange={() => handleFacultyToggle(faculty)}
                    />
                    <Label htmlFor={`faculty-${faculty}`} className="text-sm">
                      {faculty}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.targetFaculties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.targetFaculties.length === FACULTIES.length ? (
                    <Badge variant="secondary" className="text-xs">
                      全学部
                    </Badge>
                  ) : (
                    <>
                      {formData.targetFaculties.slice(0, 5).map((faculty) => (
                        <Badge
                          key={faculty}
                          variant="secondary"
                          className="text-xs"
                        >
                          {faculty}
                        </Badge>
                      ))}
                      {formData.targetFaculties.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{formData.targetFaculties.length - 5}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>
                  対象学年 <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllGrades}
                >
                  {formData.targetGrades.length === GRADES.length
                    ? "全て解除"
                    : "全て選択"}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GRADES.map((grade) => (
                  <div key={grade} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grade-${grade}`}
                      checked={formData.targetGrades.includes(grade)}
                      onCheckedChange={() => handleGradeToggle(grade)}
                    />
                    <Label htmlFor={`grade-${grade}`} className="text-sm">
                      {grade}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.targetGrades.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.targetGrades.length === GRADES.length ? (
                    <Badge variant="secondary" className="text-xs">
                      全学年
                    </Badge>
                  ) : (
                    <>
                      {formData.targetGrades.map((grade) => (
                        <Badge
                          key={grade}
                          variant="secondary"
                          className="text-xs"
                        >
                          {grade}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 関連リンク */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>関連リンク</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
              >
                <Plus className="h-4 w-4 mr-1" />
                リンク追加
              </Button>
            </div>
            <div className="space-y-2">
              {formData.links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link}
                    onChange={(e) => handleLinkChange(index, e.target.value)}
                    placeholder="https://example.com"
                  />
                  {formData.links.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* アプリ配信設定 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">アプリ内配信設定</Label>

            {isEdit ? (
              // 編集時は配信日時を直接表示・編集
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  配信日時
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Input
                      type="date"
                      value={
                        formData.scheduledDate ||
                        new Date().toISOString().split("T")[0]
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          scheduledDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <select
                      value={
                        formData.scheduledTime
                          ? formData.scheduledTime.split(":")[0]
                          : "00"
                      }
                      onChange={(e) => {
                        const minutes = formData.scheduledTime
                          ? formData.scheduledTime.split(":")[1]
                          : "00";
                        setFormData((prev) => ({
                          ...prev,
                          scheduledTime: `${e.target.value}:${minutes}`,
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, "0")}>
                          {i.toString().padStart(2, "0")}時
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <select
                      value={
                        formData.scheduledTime
                          ? formData.scheduledTime.split(":")[1]
                          : "00"
                      }
                      onChange={(e) => {
                        const hours = formData.scheduledTime
                          ? formData.scheduledTime.split(":")[0]
                          : "00";
                        setFormData((prev) => ({
                          ...prev,
                          scheduledTime: `${hours}:${e.target.value}`,
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, "0")}>
                          {i.toString().padStart(2, "0")}分
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              // 新規作成時は従来のラジオボタン形式
              <>
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    配信タイプ <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="immediate"
                        name="deliveryType"
                        value="immediate"
                        checked={formData.deliveryType === "immediate"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            deliveryType: e.target.value as
                              | "immediate"
                              | "scheduled",
                          }))
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <Label
                        htmlFor="immediate"
                        className="text-sm font-normal"
                      >
                        今すぐ配信
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="scheduled"
                        name="deliveryType"
                        value="scheduled"
                        checked={formData.deliveryType === "scheduled"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            deliveryType: e.target.value as
                              | "immediate"
                              | "scheduled",
                          }))
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <Label
                        htmlFor="scheduled"
                        className="text-sm font-normal"
                      >
                        予約配信
                      </Label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    お知らせをすぐに配信するか、特定の日時に予約配信するかを選択してください
                  </p>
                </div>

                {formData.deliveryType === "scheduled" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduledDate">
                        アプリ配信予定日 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            scheduledDate: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduledTime">
                        アプリ配信予定時刻{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="scheduledTime"
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            scheduledTime: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                      今すぐ配信を選択しているため、現在の日時で配信されます
                    </p>
                  </div>
                )}
              </>
            )}
            <p className="text-sm text-gray-500">
              アプリ内にプッシュ通知として配信する日時を設定します
            </p>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={
                !formData.title ||
                !formData.content ||
                !formData.department ||
                !formData.utasPublishedDate ||
                !formData.utasPublishedTime ||
                formData.targetFaculties.length === 0 ||
                formData.targetGrades.length === 0 ||
                (formData.deliveryType === "scheduled" &&
                  (!formData.scheduledDate || !formData.scheduledTime))
              }
            >
              <Send className="h-4 w-4 mr-2" />
              {formData.deliveryType === "immediate"
                ? isEdit
                  ? "更新して配信"
                  : "配信する"
                : isEdit
                ? "更新して予約"
                : "配信予約する"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
