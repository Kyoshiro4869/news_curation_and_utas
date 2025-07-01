// 記事データの型定義
export type Article = {
  id: string
  date: Date
  imageUrl: string
  title: string
  url: string
  ownerType: "companies" | "TICMediaGroup" // 所属コレクション
  ownerId: string // 所属ドキュメントのID
}

// 配信元の型定義
export type Owner = {
  id: string
  name: string
  type: "companies" | "TICMediaGroup"
  logo?: string // ロゴ画像のURL
}
