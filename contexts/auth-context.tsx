"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type User, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/")
    } catch (error) {
      console.error("ログインエラー:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("ログアウトエラー:", error)
      throw error
    }
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthはAuthProviderの中で使用する必要があります")
  }
  return context
}
