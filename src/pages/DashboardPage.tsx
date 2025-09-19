// Dashboard Page - Tek Pou Nou
// File: src/pages/DashboardPage.tsx

import React from "react"
import { useAuthStore } from "@/stores/authStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { LogOut, User } from "lucide-react"

export default function DashboardPage() {
  const { user, profile, signOut, isLoading } = useAuthStore()

  const handleLogout = async () => {
    await signOut()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Chajman...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">
          Ou pa konekte. Tanpri konekte pou wè tablodbò a.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">
            Tablodbò Itilizatè
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Dekonekte
          </Button>
        </CardHeader>

        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || ""} alt={profile?.display_name || user.email} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">
                {profile?.display_name || "San non"}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">
                Dènye koneksyon:{" "}
                {user.last_login
                  ? new Date(user.last_login).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Wòl yo</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                  {profile?.roles?.length ? (
                    profile.roles.map((role) => <li key={role}>{role}</li>)
                  ) : (
                    <li>Etidyan (pa defo)</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Lang Preferans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {profile?.preferred_language || "ht-HT"}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
