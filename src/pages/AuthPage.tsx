// src/pages/AuthPage.tsx
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import LoginPage from "@/components/auth/LoginPage"
import RegisterPage from "@/components/auth/RegisterPage"

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Byenvini nan Tek Pou Nou
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Konekte</TabsTrigger>
              <TabsTrigger value="register">Enskri</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginPage />
            </TabsContent>

            <TabsContent value="register">
              <RegisterPage />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
