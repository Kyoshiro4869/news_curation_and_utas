import { db } from "@/lib/firebase"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import type { Owner } from "@/types/article"

// 配信元のキャッシュ
const ownerCache: Record<string, Owner> = {}

// 配信元情報を取得する関数
export async function getOwnerById(ownerType: "companies" | "TICMediaGroup", ownerId: string): Promise<Owner | null> {
  // キャッシュキーを作成
  const cacheKey = `${ownerType}:${ownerId}`

  // キャッシュにあればそれを返す
  if (ownerCache[cacheKey]) {
    return ownerCache[cacheKey]
  }

  try {
    // Firestoreから配信元情報を取得
    const ownerRef = doc(db, ownerType, ownerId)
    const ownerSnap = await getDoc(ownerRef)

    if (ownerSnap.exists()) {
      const ownerData = ownerSnap.data()
      const owner: Owner = {
        id: ownerId,
        name: ownerData.name || "不明",
        type: ownerType,
        logo: ownerData.logo || null,
      }

      // キャッシュに保存
      ownerCache[cacheKey] = owner
      return owner
    }

    return null
  } catch (error) {
    console.error(`配信元情報の取得中にエラーが発生しました (${ownerType}/${ownerId}):`, error)
    return null
  }
}

// 配信元一覧を取得する関数
export async function getAllOwners(): Promise<Owner[]> {
  const owners: Owner[] = []

  try {
    // companiesコレクションからデータを取得
    const companiesSnapshot = await getDocs(collection(db, "companies"))
    companiesSnapshot.forEach((doc) => {
      const data = doc.data()
      const owner: Owner = {
        id: doc.id,
        name: data.name || "不明",
        type: "companies",
        logo: data.logo || null,
      }
      owners.push(owner)

      // キャッシュに保存
      const cacheKey = `companies:${doc.id}`
      ownerCache[cacheKey] = owner
    })

    // TICMediaGroupコレクションからデータを取得
    const mediaGroupSnapshot = await getDocs(collection(db, "TICMediaGroup"))
    mediaGroupSnapshot.forEach((doc) => {
      const data = doc.data()
      const owner: Owner = {
        id: doc.id,
        name: data.name || "不明",
        type: "TICMediaGroup",
        logo: data.logo || null,
      }
      owners.push(owner)

      // キャッシュに保存
      const cacheKey = `TICMediaGroup:${doc.id}`
      ownerCache[cacheKey] = owner
    })

    return owners
  } catch (error) {
    console.error("配信元一覧の取得中にエラーが発生しました:", error)
    return []
  }
}

// 配信元名を取得する関数
export async function getOwnerName(ownerType: "companies" | "TICMediaGroup", ownerId: string): Promise<string> {
  const owner = await getOwnerById(ownerType, ownerId)
  return owner?.name || "不明"
}

// 配信元ロゴを取得する関数
export async function getOwnerLogo(ownerType: "companies" | "TICMediaGroup", ownerId: string): Promise<string | null> {
  const owner = await getOwnerById(ownerType, ownerId)
  return owner?.logo || null
}
