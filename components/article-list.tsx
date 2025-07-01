"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Eye, Loader2, Clock, CheckCircle } from "lucide-react"

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import EditArticleDialog from "./edit-article-dialog"
import DeleteArticleDialog from "./delete-article-dialog"
import ArticlePreviewModal from "./article-preview-modal"
import type { Article, Owner } from "@/types/article"
import { safeDate, safeFormat, safeCompareDate } from "@/lib/date-utils"
import { getAllOwners } from "@/lib/owner-utils"

// Firebaseからデータを取得するための処理を追加
import { db } from "@/lib/firebase"
import { collectionGroup, query, orderBy, deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore"

export default function ArticleList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // 編集ダイアログの状態
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null)

  // 削除ダイアログの状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)

  // プレビューモーダルの状態
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null)

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

  // 現在時刻を1分ごとに更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 1分ごとに更新

    return () => clearInterval(timer)
  }, [])

  // 配信元情報のマップをメモ化
  const ownersMap = useMemo(() => {
    const map = new Map<string, Owner>()
    owners.forEach((owner) => {
      const key = `${owner.type}:${owner.id}`
      map.set(key, owner)
    })
    return map
  }, [owners])

  // 配信元情報を取得する関数
  const getOwner = useCallback(
    (article: Article): Owner | undefined => {
      const key = `${article.ownerType}:${article.ownerId}`
      return ownersMap.get(key)
    },
    [ownersMap],
  )

  // 配信元名を取得する関数
  const getOwnerName = useCallback(
    (article: Article): string => {
      const owner = getOwner(article)
      return owner?.name || "不明"
    },
    [getOwner],
  )

  // 配信元ロゴを取得する関数
  const getOwnerLogo = useCallback(
    (article: Article): string | undefined => {
      const owner = getOwner(article)
      return owner?.logo
    },
    [getOwner],
  )

  // フィルタリングされた記事をメモ化
  const filteredArticles = useMemo(() => {
    if (sourceFilter === "all") {
      return articles
    }

    const [ownerType, ownerId] = sourceFilter.split(":")
    return articles.filter((article) => article.ownerType === ownerType && article.ownerId === ownerId)
  }, [articles, sourceFilter])

  // 記事を編集する関数
  const handleEditArticle = useCallback((article: Article) => {
    setCurrentArticle(article)
    setEditDialogOpen(true)
  }, [])

  // 編集した記事を保存する関数
  const handleSaveArticle = useCallback(async (updatedArticle: Article) => {
    try {
      // Firestoreの記事を更新
      const articleRef = doc(db, updatedArticle.ownerType, updatedArticle.ownerId, "news", updatedArticle.id)
      await updateDoc(articleRef, {
        title: updatedArticle.title,
        url: updatedArticle.url,
        imageUrl: updatedArticle.imageUrl,
        date: updatedArticle.date,
        ownerType: updatedArticle.ownerType,
        ownerId: updatedArticle.ownerId,
      })

      toast({
        title: "記事を更新しました",
        description: "記事情報が正常に更新されました",
      })
    } catch (error) {
      console.error("記事の更新中にエラーが発生しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "記事の更新に失敗しました。",
        variant: "destructive",
      })
    }
  }, [])

  // 記事の削除を確認するダイアログを表示する関数
  const handleDeleteConfirm = useCallback((article: Article) => {
    setArticleToDelete(article)
    setDeleteDialogOpen(true)
  }, [])

  // 記事を削除する関数
  const handleDeleteArticle = useCallback(async () => {
    if (!articleToDelete) return

    try {
      // Firestoreから記事を削除
      const articleRef = doc(db, articleToDelete.ownerType, articleToDelete.ownerId, "news", articleToDelete.id)
      await deleteDoc(articleRef)

      toast({
        title: "記事を削除しました",
        description: `「${articleToDelete.title.substring(0, 20)}...」を削除しました`,
      })
    } catch (error) {
      console.error("記事の削除中にエラーが発生しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "記事の削除に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setArticleToDelete(null)
    }
  }, [articleToDelete])

  // プレビューモーダルを表示する関数
  const handlePreview = useCallback(
    (article: Article) => {
      const owner = getOwner(article)
      setPreviewArticle({
        ...article,
        source: owner?.name || "不明",
        sourceLogo: owner?.logo,
      } as any)
      setPreviewModalOpen(true)
    },
    [getOwner],
  )

  // 配信ステータスを判定する関数
  const getPublishStatus = useCallback(
    (date: any) => {
      return safeCompareDate(date, currentTime) ? "published" : "scheduled"
    },
    [currentTime],
  )

  // テーブルのカラム定義をメモ化
  const columns = useMemo<ColumnDef<Article>[]>(
    () => [
      {
        accessorKey: "imageUrl",
        header: "サムネイル",
        cell: ({ row }) => (
          <div className="w-20 h-12 overflow-hidden rounded">
            <img
              src={row.original.imageUrl || "/placeholder.svg"}
              alt={row.original.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ),
      },
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              タイトル
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="max-w-[400px] truncate font-medium">{row.original.title}</div>,
      },
      {
        accessorKey: "ownerType",
        header: "配信元",
        cell: ({ row }) => {
          const article = row.original
          const ownerName = getOwnerName(article)
          const ownerLogo = getOwnerLogo(article)

          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {ownerLogo ? (
                  <AvatarImage src={ownerLogo || "/placeholder.svg"} alt={ownerName} loading="lazy" />
                ) : (
                  <AvatarFallback>{ownerName.substring(0, 2)}</AvatarFallback>
                )}
              </Avatar>
              <span>{ownerName}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => {
          return (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              配信日時
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const status = getPublishStatus(row.original.date)
          const formattedDate = safeFormat(row.original.date, "yyyy/MM/dd HH:mm")

          return (
            <div className="space-y-1">
              <div>{formattedDate}</div>
              {status === "published" ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 inline-flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  配信済み
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  配信予約中
                </Badge>
              )}
            </div>
          )
        },
        sortingFn: (rowA, rowB) => {
          const dateA = safeDate(rowA.original.date).getTime()
          const dateB = safeDate(rowB.original.date).getTime()
          return dateA < dateB ? -1 : dateA > dateB ? 1 : 0
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const article = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">メニューを開く</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>アクション</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handlePreview(article)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>プレビュー</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditArticle(article)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>編集</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDeleteConfirm(article)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>削除</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [getOwnerName, getOwnerLogo, getPublishStatus, handlePreview, handleEditArticle, handleDeleteConfirm],
  )

  // テーブルインスタンスをメモ化
  const table = useReactTable({
    data: filteredArticles,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  // useEffectを追加して、コンポーネントのマウント時にFirebaseからデータを取得
  useEffect(() => {
    setIsLoading(true)

    // collectionGroupを使用して、すべてのnewsサブコレクションからデータを取得
    const q = query(collectionGroup(db, "news"), orderBy("date", "desc"))

    // リアルタイムリスナーを設定
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedArticles: Article[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          try {
            // 日付データを安全に変換
            const date = safeDate(data.date)

            // パスからownerTypeとownerIdを取得
            const pathSegments = doc.ref.path.split("/")

            // データからownerTypeとownerIdを取得、なければパスから取得
            const ownerType = data.ownerType || (pathSegments.length >= 2 ? pathSegments[0] : null)
            const ownerId = data.ownerId || (pathSegments.length >= 2 ? pathSegments[1] : null)

            // ownerTypeとownerIdが有効な値であることを確認
            if (
              (ownerType === "companies" || ownerType === "TICMediaGroup") &&
              ownerId &&
              typeof ownerId === "string" &&
              ownerId.trim() !== ""
            ) {
              fetchedArticles.push({
                id: doc.id,
                title: data.title || "",
                url: data.url || "",
                imageUrl: data.imageUrl || "",
                date: date,
                ownerType: ownerType as "companies" | "TICMediaGroup",
                ownerId: ownerId,
              })
            } else {
              console.log("無効な記事データをスキップしました:", {
                id: doc.id,
                path: doc.ref.path,
                ownerType,
                ownerId,
              })
            }
          } catch (error) {
            console.error("記事データの変換中にエラーが発生しました:", error, data)
          }
        })

        setArticles(fetchedArticles)
        setIsLoading(false)
      },
      (error) => {
        console.error("記事の取得中にエラーが発生しました:", error)
        toast({
          title: "エラーが発生しました",
          description: "記事の取得に失敗しました。",
          variant: "destructive",
        })
        setIsLoading(false)
      },
    )

    // コンポーネントのアンマウント時にリスナーを解除
    return () => unsubscribe()
  }, [])

  // 配信元選択用のアイテムをメモ化
  const ownerSelectItems = useMemo(() => {
    return owners.map((owner) => (
      <SelectItem key={`${owner.type}:${owner.id}`} value={`${owner.type}:${owner.id}`}>
        <div className="flex items-center gap-2">
          {owner.logo ? (
            <img
              src={owner.logo || "/placeholder.svg"}
              alt={owner.name}
              className="h-4 w-4 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px]">
              {owner.name.substring(0, 1)}
            </div>
          )}
          <span>{owner.name}</span>
        </div>
      </SelectItem>
    ))
  }, [owners])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">記事を読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="記事タイトルで検索..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <span className="text-sm">配信元:</span>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="すべての配信元" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての配信元</SelectItem>
              {ownerSelectItems}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  記事が見つかりません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length}件の記事</div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            前へ
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            次へ
          </Button>
        </div>
      </div>

      {/* 編集ダイアログ */}
      <EditArticleDialog
        article={currentArticle}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveArticle}
        owners={owners}
      />

      {/* 削除確認ダイアログ */}
      {articleToDelete && (
        <DeleteArticleDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteArticle}
          articleTitle={articleToDelete.title}
        />
      )}

      {/* プレビューモーダル */}
      <ArticlePreviewModal
        article={previewArticle}
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        currentTime={currentTime}
      />
    </div>
  )
}
