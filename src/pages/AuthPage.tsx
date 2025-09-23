// AuthPage - Tek Pou Nou
// File: src/pages/AuthPage.tsx

import { useLocation, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import LoginPage from "@/components/auth/LoginPage"
import RegisterPage from "@/components/auth/RegisterPage"

export default function AuthPage({
  defaultTab = "login",
}: {
  defaultTab?: "login" | "register"
}) {
  const location = useLocation()
  const navigate = useNavigate()

  // derive tab from pathname if possible
  const currentPath = location.pathname.includes("register")
    ? "register"
    : "login"
  const activeTab = currentPath || defaultTab

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Byenvini nan Tek Pou Nou
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={activeTab}
            className="w-full"
            onValueChange={(val) => navigate(`/auth/${val}`)} // ✅ update URL on tab change
          >
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
