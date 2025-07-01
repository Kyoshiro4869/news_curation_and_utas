"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Link2Icon, SendIcon, Loader2, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { safeDate, safeFormat } from "@/lib/date-utils"
import { getAllOwners } from "@/lib/owner-utils"
import type { Owner } from "@/types/article"

// Firebase関連のインポート
import { db, storage } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

const formSchema = z.object({
  owner: z.string({
    required_error: "配信元を選択してください",
  }),
  title: z.string().min(5, {
    message: "タイトルは5文字以上で入力してください",
  }),
  url: z.string().url({
    message: "有効なURLを入力してください",
  }),
  publishType: z.enum(["now", "scheduled"], {
    required_error: "配信タイプを選択してください",
  }),
  date: z.date({
    required_error: "配信日を選択してください",
  }),
  imageUrl: z.string({
    required_error: "サムネイル画像を選択してください",
  }),
})

export default function ArticleForm() {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [owners, setOwners] = useState<Owner[]>([])
  const [fileInputKey, setFileInputKey] = useState<number>(0) // ファイル入力をリセットするためのキー
  const fileInputRef = useRef<HTMLInputElement>(null) // ファイル入力への参照

  // 配信元一覧を取得
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const ownersList = await getAllOwners()
        setOwners(ownersList)
      } catch (error) {
        console.error("配信元一覧の取得中にエラーが発生しました:", error)
        toast({
          title: "エラーが発生しました",
          description: "配信元一覧の取得に失敗しました。",
          variant: "destructive",
        })
      }
    }

    fetchOwners()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publishType: "now",
      date: new Date(), // 現在の日時を設定
      imageUrl: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // サムネイル画像が選択されていない場合はエラーを表示
    if (!thumbnailFile) {
      form.setError("imageUrl", {
        type: "manual",
        message: "サムネイル画像を選択してください",
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // 選択された配信元の情報を取得
      const [ownerType, ownerId] = values.owner.split(":")
      const selectedOwner = owners.find((o) => `${o.type}:${o.id}` === values.owner)

      if (!selectedOwner) {
        throw new Error("選択された配信元が見つかりません")
      }

      let imageUrl = "/placeholder.svg"

      // 画像をFirebase Storageにアップロード
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

      // 日付を安全に処理
      const safePublishDate = safeDate(values.date)

      // Firebaseに保存するデータを作成
      const articleData = {
        title: values.title,
        url: values.url,
        imageUrl: imageUrl,
        date: safePublishDate,
        ownerType: selectedOwner.type,
        ownerId: selectedOwner.id,
      }

      // サブコレクションのパスを作成
      const newsCollectionRef = collection(db, selectedOwner.type, selectedOwner.id, "news")

      // Firestoreのnewsサブコレクションに追加
      const docRef = await addDoc(newsCollectionRef, articleData)
      console.log("記事が追加されました。ID:", docRef.id)
      setUploadProgress(100)

      // 成功時の処理
      if (values.publishType === "now") {
        toast({
          title: "記事を配信しました",
          description: "アプリ内に記事が表示されます",
        })
      } else {
        const formattedDate = safeFormat(safePublishDate, "yyyy年MM月dd日 HH時mm分")
        toast({
          title: "記事の配信を予約しました",
          description: `${formattedDate}に記事が配信されます`,
        })
      }

      // 配信元の値を保持して他のフィールドをリセット
      const currentOwner = values.owner
      form.reset({
        owner: currentOwner, // 配信元の値を保持
        title: "",
        url: "",
        publishType: "now",
        date: new Date(),
        imageUrl: "",
      })

      // サムネイル関連の状態をリセット
      setThumbnailPreview(null)
      setThumbnailFile(null)

      // ファイル入力をリセット（keyを変更して強制的に再レンダリング）
      setFileInputKey((prev) => prev + 1)

      // または、ファイル入力の値を直接リセット（ブラウザによっては動作しない場合があります）
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("記事の保存中にエラーが発生しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "記事の配信に失敗しました。もう一度お試しください。",
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
      form.clearErrors("imageUrl")

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setThumbnailPreview(result)
        form.setValue("imageUrl", result, { shouldValidate: true })
      }
      reader.readAsDataURL(file)
    } else {
      // ファイルが選択されていない場合（キャンセルされた場合など）
      setThumbnailFile(null)
      setThumbnailPreview(null)
      form.setValue("imageUrl", "", { shouldValidate: true })
    }
  }

  // 現在の日付を取得
  const currentDate = new Date()
  const currentHour = currentDate.getHours().toString().padStart(2, "0")
  const currentMinute = currentDate.getMinutes()
  const currentMinuteStr = currentMinute.toString().padStart(2, "0")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="owner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                配信元<span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
                            loading="lazy"
                          />
                        )}
                        {owner.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>記事を配信する配信元を選択してください</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                記事タイトル<span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="記事のタイトルを入力" {...field} />
              </FormControl>
              <FormDescription>アプリ内に表示される記事のタイトルです</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                記事URL<span className="text-red-500 ml-1">*</span>
              </FormLabel>
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
              <FormDescription>記事の詳細ページのURLを入力してください</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="publishType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>
                配信タイプ<span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="publish-now"
                      value="now"
                      checked={field.value === "now"}
                      onChange={() => field.onChange("now")}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="publish-now" className="text-sm font-medium">
                      今すぐ配信
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="publish-scheduled"
                      value="scheduled"
                      checked={field.value === "scheduled"}
                      onChange={() => field.onChange("scheduled")}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="publish-scheduled" className="text-sm font-medium">
                      予約配信
                    </label>
                  </div>
                </div>
              </FormControl>
              <FormDescription>記事をすぐに配信するか、特定の日時に予約配信するかを選択してください</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>
                配信日時<span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        disabled={form.watch("publishType") === "now"}
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
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex space-x-2">
                  <Select
                    disabled={form.watch("publishType") === "now"}
                    value={field.value ? safeFormat(field.value, "HH") : currentHour}
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
                    disabled={form.watch("publishType") === "now"}
                    value={field.value ? safeFormat(field.value, "mm") : currentMinuteStr}
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
                      {Array.from({ length: 60 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                          {i.toString().padStart(2, "0")}分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <FormDescription>
                {form.watch("publishType") === "now"
                  ? "今すぐ配信を選択しているため、現在の日時で配信されます"
                  : "記事がアプリ内に表示される日時を選択してください"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                サムネイル画像<span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      key={fileInputKey} // キーを変更して強制的に再レンダリング
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleThumbnailChange(e)
                      }}
                      required
                    />
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
              <FormDescription>記事のサムネイル画像をアップロードしてください（5MB以下）</FormDescription>
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

        <div className="text-sm text-gray-500 mb-2">
          <span className="text-red-500">*</span> は必須項目です
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              処理中...
            </span>
          ) : (
            <span className="flex items-center">
              <SendIcon className="mr-2 h-4 w-4" />
              記事を配信する
            </span>
          )}
        </Button>
      </form>
    </Form>
  )
}
