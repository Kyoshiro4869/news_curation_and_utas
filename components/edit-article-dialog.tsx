"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Link2Icon, Loader2, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { safeDate, safeFormat } from "@/lib/date-utils"
import type { Article, Owner } from "@/types/article"

// Firebaseの更新処理を追加
import { db, storage } from "@/lib/firebase"
import { doc, updateDoc, collection, addDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

const formSchema = z.object({
  id: z.string(),
  owner: z.string({
    required_error: "配信元を選択してください",
  }),
  title: z.string().min(5, {
    message: "タイトルは5文字以上で入力してください",
  }),
  url: z.string().url({
    message: "有効なURLを入力してください",
  }),
  date: z.date({
    required_error: "配信日を選択してください",
  }),
  imageUrl: z.string().optional(),
  ownerType: z.enum(["companies", "TICMediaGroup"]),
  ownerId: z.string(),
})

type EditArticleDialogProps = {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (article: Article) => void
  owners: Owner[]
}

export default function EditArticleDialog({ article, open, onOpenChange, onSave, owners }: EditArticleDialogProps) {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedOwner, setSelectedOwner] = useState<string>("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      owner: "",
      title: "",
      url: "",
      date: new Date(),
      imageUrl: "",
      ownerType: "companies" as const,
      ownerId: "",
    },
  })

  // 記事データが変更されたときにフォームを更新
  useEffect(() => {
    if (article) {
      // 配信元の値を設定
      const ownerValue = `${article.ownerType}:${article.ownerId}`
      setSelectedOwner(ownerValue)

      form.reset({
        id: article.id,
        owner: ownerValue,
        title: article.title,
        url: article.url,
        date: article.date,
        imageUrl: article.imageUrl,
        ownerType: article.ownerType,
        ownerId: article.ownerId,
      })

      setThumbnailPreview(article.imageUrl)
      setThumbnailFile(null)
    }
  }, [article, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // 選択された配信元の情報を取得
      const [newOwnerType, newOwnerId] = values.owner.split(":") as ["companies" | "TICMediaGroup", string]
      const selectedOwner = owners.find((o) => `${o.type}:${o.id}` === values.owner)

      if (!selectedOwner) {
        throw new Error("選択された配信元が見つかりません")
      }

      let imageUrl = article?.imageUrl || "/placeholder.svg"

      // 新しい画像がアップロードされている場合は、Firebase Storageにアップロード
      if (thumbnailFile) {
        setUploadProgress(10)

        // ファイル名を一意にするために現在のタイムスタンプを追加
        const timestamp = new Date().getTime()
        const fileName = `news/${timestamp}_${thumbnailFile.name}`

        // Storageの参照を作成
        const storageRef = ref(storage, fileName)

        // ファイルをアップロード
        setUploadProgress(30)
        await uploadBytes(storageRef, thumbnailFile)

        // アップロードされたファイルのURLを取得
        setUploadProgress(70)
        imageUrl = await getDownloadURL(storageRef)
        setUploadProgress(90)
      }

      // 配信元が変更された場合
      const ownerChanged = article?.ownerType !== newOwnerType || article?.ownerId !== newOwnerId

      // 更新された記事データを作成
      const updatedArticle: Article = {
        id: values.id,
        title: values.title,
        url: values.url,
        imageUrl: imageUrl,
        date: values.date,
        ownerType: newOwnerType,
        ownerId: newOwnerId,
      }

      if (ownerChanged && article) {
        // 元の場所から記事を削除
        const oldArticleRef = doc(db, article.ownerType, article.ownerId, "news", article.id)
        await updateDoc(oldArticleRef, { deleted: true })

        // 新しい場所に記事を作成
        const newNewsCollectionRef = collection(db, newOwnerType, newOwnerId, "news")
        const newDocRef = await addDoc(newNewsCollectionRef, {
          title: updatedArticle.title,
          url: updatedArticle.url,
          imageUrl: updatedArticle.imageUrl,
          date: updatedArticle.date,
          ownerType: newOwnerType,
          ownerId: newOwnerId,
        })

        // 新しいIDを設定
        updatedArticle.id = newDocRef.id
      } else {
        // 同じ場所で記事を更新
        const articleRef = doc(db, updatedArticle.ownerType, updatedArticle.ownerId, "news", updatedArticle.id)
        await updateDoc(articleRef, {
          title: updatedArticle.title,
          url: updatedArticle.url,
          imageUrl: updatedArticle.imageUrl,
          date: updatedArticle.date,
          ownerType: updatedArticle.ownerType,
          ownerId: updatedArticle.ownerId,
        })
      }

      setUploadProgress(100)

      // 親コンポーネントに更新データを渡す
      onSave(updatedArticle)

      // 成功メッセージ
      toast({
        title: "記事を更新しました",
        description: "記事情報が正常に更新されました",
      })

      // ダイアログを閉じる
      onOpenChange(false)
    } catch (error) {
      console.error("記事の更新中にエラーが発生しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "記事の更新に失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルサイズチェック (5MB以下)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ファイルサイズが大きすぎます",
          description: "5MB以下の画像を選択してください",
          variant: "destructive",
        })
        return
      }

      // 画像ファイルかどうかチェック
      if (!file.type.startsWith("image/")) {
        toast({
          title: "画像ファイルを選択してください",
          description: "JPG、PNG、GIF形式の画像を選択してください",
          variant: "destructive",
        })
        return
      }

      setThumbnailFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setThumbnailPreview(result)
        form.setValue("imageUrl", result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>記事を編集</DialogTitle>
          <DialogDescription>記事の情報を編集して保存ボタンをクリックしてください。</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>配信元</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || selectedOwner}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="配信元を選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={`${owner.type}:${owner.id}`} value={`${owner.type}:${owner.id}`}>
                          <div className="flex items-center gap-2">
                            {owner.logo && (
                              <img
                                src={owner.logo || "/placeholder.svg"}
                                alt={owner.name}
                                className="h-4 w-4 rounded-full object-cover"
                              />
                            )}
                            {owner.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>記事タイトル</FormLabel>
                  <FormControl>
                    <Input placeholder="記事のタイトルを入力" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>記事URL</FormLabel>
                  <FormControl>
                    <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <Link2Icon className="ml-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="https://example.com/article"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>配信日時</FormLabel>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? safeFormat(field.value, "yyyy年MM月dd日") : <span>日付を選択</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={safeDate(field.value)}
                          onSelect={(date) => field.onChange(date || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="flex space-x-2">
                      <Select
                        value={field.value ? safeFormat(field.value, "HH") : "00"}
                        onValueChange={(hour) => {
                          const newDate = safeDate(field.value)
                          newDate.setHours(Number.parseInt(hour, 10))
                          field.onChange(newDate)
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="時" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }).map((_, i) => (
                            <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                              {i.toString().padStart(2, "0")}時
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={field.value ? safeFormat(field.value, "mm") : "00"}
                        onValueChange={(minute) => {
                          const newDate = safeDate(field.value)
                          newDate.setMinutes(Number.parseInt(minute, 10))
                          field.onChange(newDate)
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="分" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <SelectItem key={i} value={(i * 5).toString().padStart(2, "0")}>
                              {(i * 5).toString().padStart(2, "0")}分
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>サムネイル画像</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input type="file" accept="image/*" onChange={handleThumbnailChange} />
                        {thumbnailFile && (
                          <div className="text-sm text-muted-foreground">
                            {(thumbnailFile.size / 1024 / 1024).toFixed(2)}MB
                          </div>
                        )}
                      </div>
                      {thumbnailPreview ? (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground mb-2">プレビュー:</p>
                          <div className="relative w-40 h-24 overflow-hidden rounded-md border">
                            <img
                              src={thumbnailPreview || "/placeholder.svg"}
                              alt="サムネイルプレビュー"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-40 h-24 bg-gray-100 rounded-md border">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">アップロード中... {uploadProgress}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
