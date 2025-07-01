"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="font-semibold text-lg">TICコンテンツ管理</div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-1" />
              <span>{user.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" />
              ログアウト
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
