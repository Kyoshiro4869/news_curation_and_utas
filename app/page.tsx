"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Calendar, TrendingUp } from "lucide-react";
import ArticleForm from "@/components/article-form";
import ArticleList from "@/components/article-list";
import AuthCheck from "@/components/auth-check";
import Header from "@/components/header";
import AdminDashboard from "./notification/page";
import type { Article } from "@/types/article";
import { safeDate } from "@/lib/date-utils";

// Firebase関連のインポート
import { db } from "@/lib/firebase";
import {
  collectionGroup,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Firestoreから記事をリアルタイムで取得
    const q = query(collectionGroup(db, "news"), orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedArticles: Article[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          try {
            // 日付データを安全に変換
            const date = safeDate(data.date);

            // パスからownerTypeとownerIdを取得
            const pathSegments = doc.ref.path.split("/");
            const ownerType =
              data.ownerType ||
              (pathSegments.length >= 2 ? pathSegments[0] : null);
            const ownerId =
              data.ownerId ||
              (pathSegments.length >= 2 ? pathSegments[1] : null);

            if (ownerType && ownerId) {
              fetchedArticles.push({
                id: doc.id,
                title: data.title || "",
                url: data.url || "",
                imageUrl: data.imageUrl || "/placeholder.svg",
                date: date,
                ownerType: ownerType as "companies" | "TICMediaGroup",
                ownerId: ownerId,
              });
            }
          } catch (error) {
            console.error("記事データの処理中にエラーが発生しました:", error);
          }
        });

        setArticles(fetchedArticles);
        setLoading(false);
      },
      (error) => {
        console.error("記事の取得中にエラーが発生しました:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const calculateArticleStats = () => {
    if (!mounted) return { total: 0, today: 0, thisWeek: 0 };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return {
      total: articles.length,
      today: articles.filter((article) => {
        try {
          const publishDate = safeDate(article.date);
          const publishDateOnly = new Date(
            publishDate.getFullYear(),
            publishDate.getMonth(),
            publishDate.getDate()
          );
          return publishDateOnly.getTime() === today.getTime();
        } catch {
          return false;
        }
      }).length,
      thisWeek: articles.filter((article) => {
        try {
          const publishDate = safeDate(article.date);
          return publishDate > weekAgo;
        } catch {
          return false;
        }
      }).length,
    };
  };

  const articleStats = calculateArticleStats();

  return (
    <AuthCheck>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto py-6 flex-1">
          <Tabs defaultValue="news" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">TICコンテンツ管理画面</h1>
              <TabsList className="w-fit">
                <TabsTrigger value="news" className="px-6 py-2">
                  ニュースキュレーション
                </TabsTrigger>
                <TabsTrigger value="notifications" className="px-6 py-2">
                  UTASお知らせ
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="news" className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-2">
                    ニュースキュレーション
                  </h2>
                  <p className="text-gray-600">
                    学内生向けニュース記事の配信・管理を行います
                  </p>
                </div>

                {/* 統計カード */}
                {!loading && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          総記事数
                        </CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {articleStats.total}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          配信済み
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          今日の配信
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {articleStats.today}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          本日配信
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          今週の配信
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {articleStats.thisWeek}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          過去7日間
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Tabs defaultValue="create" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">記事配信</TabsTrigger>
                    <TabsTrigger value="list">配信済み記事一覧</TabsTrigger>
                  </TabsList>
                  <TabsContent value="create">
                    <ArticleForm />
                  </TabsContent>
                  <TabsContent value="list">
                    <ArticleList />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <AdminDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthCheck>
  );
}
