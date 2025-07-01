"use client"
import { ExternalLink } from "lucide-react"
import type { Article } from "@/types/article"
import { safeFormat } from "@/lib/date-utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ArticlePreviewModalProps = {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onArticleClick?: () => void
  currentTime?: Date
}

export default function ArticlePreviewModal({
  article,
  open,
  onOpenChange,
  onArticleClick,
  currentTime = new Date(),
}: ArticlePreviewModalProps) {
  if (!article) return null

  const handleArticleClick = () => {
    if (onArticleClick) {
      onArticleClick()
    }
    window.open(article.url, "_blank")
  }

  const formattedDate = safeFormat(article.date, "yyyy年MM月dd日 HH:mm")
  const sourceName = (article as any).source || "不明"
  const sourceLogo = (article as any).sourceLogo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg font-semibold">アプリ内プレビュー</DialogTitle>
        </DialogHeader>

        <div className="phone-frame bg-gray-100 p-4 max-h-[70vh] overflow-y-auto">
          {/* 横長カードスタイルのプレビュー */}
          <div
            className="bg-white rounded-xl overflow-hidden shadow-md flex cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleArticleClick}
          >
            {/* 左側：サムネイル画像 */}
            <div className="w-1/3 h-32 overflow-hidden flex-shrink-0">
              <img
                src={article.imageUrl || "/placeholder.svg?height=128&width=128"}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 右側：記事情報 */}
            <div className="w-2/3 p-3 flex flex-col justify-between">
              {/* 記事タイトル */}
              <h3 className="text-base font-bold line-clamp-2 mb-2">{article.title}</h3>

              {/* 配信元と配信日時 */}
              <div className="mt-auto">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    {sourceLogo ? (
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={sourceLogo || "/placeholder.svg"} alt={sourceName} />
                        <AvatarFallback>{sourceName.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    ) : null}
                    <span className="font-medium">{sourceName}</span>
                  </div>
                  <span className="mx-1">-</span>
                  <span className="text-gray-500 text-xs">{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t">
          <div className="w-full flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <span>実際のアプリ表示イメージです</span>
            </div>
            <Button onClick={handleArticleClick} className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              記事を開く
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
