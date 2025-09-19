// About Page - Tek Pou Nou
// File: src/pages/AboutPage.tsx

import React from "react"
import { Card, CardContent } from "../components/ui/Card"
import { Users, Target, Rocket, Globe } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Sou Tek Pou Nou
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tek Pou Nou se yon ekosistèm teknolojik ayisyen ki fèt pou soutni 
            antreprenè, etidyan, pwofesyonèl, ak biznis. Misyon nou se 
            pote zouti ak sèvis ki pèmèt kominote a grandi ansanm.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <Target className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Misyon Nou
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Bay aksè a resous teknolojik, fòmasyon, ak sèvis 
                pou amelyore kapasite ekonomik ak kreyativite jèn yo 
                ak antreprenè yo nan Ayiti.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <Rocket className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Vizyon Nou
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Kreye yon rezo inovatè ki pèmèt Ayiti vin yon pwen 
                referans nan teknoloji ak antreprenarya nan rejyon an.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
            Valè Nou yo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <Users className="mx-auto h-10 w-10 text-indigo-500 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Kolaborasyon
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Nou kwè nan fòs kominote a pou kreye chanjman.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <Globe className="mx-auto h-10 w-10 text-indigo-500 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Inovasyon
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Nou sèvi ak teknoloji pou rezoud pwoblèm lokal yo.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <Rocket className="mx-auto h-10 w-10 text-indigo-500 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Ekselans
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Nou ap chèche toujou ofri sèvis ki gen kalite siperyè.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <Target className="mx-auto h-10 w-10 text-indigo-500 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Enpak Sosyal
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Chak aksyon vize amelyore lavi moun nan kominote a.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Vle rantre nan mouvman an?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Vin fè pati kominote Tek Pou Nou jodi a pou grandi ansanm ak 
            yon ekip pasyone ak vizyonè.
          </p>
          <a
            href="/contact"
            className="inline-block bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Kontakte Nou
          </a>
        </div>
      </div>
    </div>
  )
}
