// src/pages/RootPage.tsx
import React from "react";
import { useAuthStore } from "@/stores/authStore";
import DashboardPage from "./DashboardPage";
import HomePage from "./HomePage";
import LandingPage from "./LandingPage";

const RootPage: React.FC = () => {
  const { user } = useAuthStore();

  // CASE 1: User logged in → Dashboard
  if (user) {
    return <DashboardPage />;
  }

  // CASE 2: If you want to show LandingPage instead of HomePage sometimes,
  // you can decide based on a feature flag, query param, or random A/B testing
  const showLanding = true; // 👈 toggle logic here (replace with your own condition)

  if (showLanding) {
    return <LandingPage />;
  }

  // CASE 3: Default → HomePage
  return <HomePage />;
};

export default RootPage;
