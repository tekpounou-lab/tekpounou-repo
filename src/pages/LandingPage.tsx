// src/pages/LandingPage.tsx

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowRight, Users, Briefcase, BookOpen } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* ✅ Use shared Navbar */}
      <Navbar />

      {/* Hero Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6">
            Byenveni nan Tek Pou Nou
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Nou se yon ekosistèm teknoloji k ap soutni antreprenè, etidyan ak
            PME yo ann Ayiti. Jwenn sèvis, aprann nouvo konpetans, epi rantre
            nan yon kominote solid.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register">
              <Button size="lg" className="flex items-center gap-2">
                Kòmanse Kounya <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline">
                Eksplore Sèvis
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Feature Highlights */}
      <section className="bg-white dark:bg-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Users className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Kominote Solid</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Rantre nan yon rezo pwofesyonèl ak antreprenè k ap grandi ansanm
                avèk ou.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Briefcase className="h-10 w-10 text-green-600 dark:text-green-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Sèvis pou Biznis</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Jwenn ekspètiz ak sèvis ki ede devlope biznis ou.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <BookOpen className="h-10 w-10 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aprantisaj</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Aksede ak resous pou aprann nouvo konpetans nan teknoloji ak
                antreprenarya.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()} Tek Pou Nou. Tout dwa rezève.
        </div>
      </footer>
    </div>
  );
}
