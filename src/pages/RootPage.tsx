// src/pages/RootPage.tsx
import React from "react";
import { useAuthStore } from "@/stores/authStore";
import DashboardPage from "./DashboardPage";
import HomePage from "./HomePage";

const RootPage: React.FC = () => {
  const { user } = useAuthStore();

  // If user is logged in → go straight to Dashboard
  if (user) {
    return <DashboardPage />;
  }

  // Otherwise → show the HomePage (marketing/landing content)
  return <HomePage />;
};

export default RootPage;
