import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ArticleForm from "@/components/article-form"
import ArticleList from "@/components/article-list"
import AuthCheck from "@/components/auth-check"
import Header from "@/components/header"

export default function Home() {
  return (
    <AuthCheck>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto py-6 flex-1">
          <h1 className="text-3xl font-bold mb-6">ニュースキュレーションアプリ管理画面</h1>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">記事配信</TabsTrigger>
              <TabsTrigger value="list">配信済み記事一覧</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <div className="bg-white p-6 rounded-lg shadow">
                <ArticleForm />
              </div>
            </TabsContent>
            <TabsContent value="list">
              <div className="bg-white p-6 rounded-lg shadow">
                <ArticleList />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthCheck>
  )
}
