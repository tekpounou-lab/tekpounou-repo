// File: src/pages/services/ServiceDetailPage.tsx
// Service Detail Page - View details and request a single service

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Label } from "../../components/ui/Label";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/textarea";
import { DollarSign, Tag, Clock, Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price_range: string;
  status: string;
  created_at: string;
  creator?: {
    user_profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    requirements: "",
    budget_range: "",
    deadline: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchService(id);
  }, [id]);

  const fetchService = async (serviceId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${user?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load service");
      }

      const data = await response.json();
      setService(data.service);
      setRequestForm({
        title: `${data.service.name} - Service Request`,
        description: "",
        requirements: "",
        budget_range: data.service.price_range || "",
        deadline: "",
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const submitServiceRequest = async () => {
    if (!service) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          service_id: service.id,
          ...requestForm,
        }),
      });

      if (response.ok) {
        alert("Service request submitted successfully!");
        setRequestDialogOpen(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error submitting request:", err);
      alert("Error submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading service...</span>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Service not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{error || "We couldn’t load this service."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{service.name}</CardTitle>
                <Badge variant="secondary" className="mt-2">
                  {service.category}
                </Badge>
              </div>
              <Badge variant={service.status === "active" ? "default" : "secondary"}>
                {service.status === "active" ? "Aktif" : "Inaktif"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <CardDescription className="text-lg mb-6">{service.description}</CardDescription>

            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {service.price_range && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span>{service.price_range}</span>
                </div>
              )}

              {service.creator && (
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-purple-600" />
                  <span>
                    {service.creator.user_profiles.first_name}{" "}
                    {service.creator.user_profiles.last_name}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Published on {new Date(service.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="space-x-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              Retounen
            </Button>

            {user && service.status === "active" && (
              <Button onClick={() => setRequestDialogOpen(true)}>Mande sèvis</Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Service Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mande sèvis: {service.name}</DialogTitle>
            <DialogDescription>
              Ranpli fòm nan pou ou mande sèvis la. Nou ap kontakte ou nan kèk jou
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tit demande a</Label>
              <Input
                id="title"
                value={requestForm.title}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsyon</Label>
              <Textarea
                id="description"
                rows={4}
                value={requestForm.description}
                onChange={(e) =>
                  setRequestForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="requirements">Egzijans ak kondisyon yo</Label>
              <Textarea
                id="requirements"
                rows={3}
                value={requestForm.requirements}
                onChange={(e) =>
                  setRequestForm((prev) => ({ ...prev, requirements: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Bidjè</Label>
                <Input
                  id="budget"
                  value={requestForm.budget_range}
                  onChange={(e) =>
                    setRequestForm((prev) => ({ ...prev, budget_range: e.target.value }))
                  }
                  placeholder="Ex: $500-1000"
                />
              </div>

              <div>
                <Label htmlFor="deadline">Delè</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={requestForm.deadline}
                  onChange={(e) =>
                    setRequestForm((prev) => ({ ...prev, deadline: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Anile
            </Button>
            <Button
              onClick={submitServiceRequest}
              disabled={submitting || !requestForm.title || !requestForm.description}
            >
              {submitting ? "N ap soumèt..." : "Soumèt demande a"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
