// Contact Page - Tek Pou Nou
// File: src/pages/ContactPage.tsx

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, ArrowLeft } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar"; // ✅ import Navbar

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // TODO: Replace with your API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ✅ Navbar on top */}
      <Navbar />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Kontakte Nou
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Ou gen yon kesyon oswa yon pwojè an tèt ou? Ranpli fòm kontak la
              pou rantre an relasyon ak ekip Tek Pou Nou.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="shadow-md">
                <CardBody className="p-6 flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-indigo-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Imèl
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      contact@tekpounou.com
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-md">
                <CardBody className="p-6 flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-indigo-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Telefòn
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      +509 1234-5678
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="shadow-md">
                <CardBody className="p-6 flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-indigo-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Adrès
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Pòtoprens, Ayiti
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              <Card className="shadow-lg">
                <CardBody className="p-8">
                  {success ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">✅</div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Mèsi pou mesaj ou!
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        Nou resevwa mesaj ou, epi ekip nou an ap kontakte ou
                        byento.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="name">Non ou</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Eg: Marie Jean"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Imèl</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Eg: ou@example.com"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="subject">Sijè</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Eg: Koperasyon oswa sèvis"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="message">Mesaj</Label>
                        <Textarea
                          id="message"
                          rows={5}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Ekri mesaj ou la..."
                          required
                        />
                      </div>

                      <div className="text-right">
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {submitting ? "N ap soumèt..." : "Voye mesaj la"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-12">
            <Link
              to="/"
              className="inline-flex items-center px-5 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retounen lakay
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
