// Services Page - Browse and Request Services
// File: src/pages/services/ServicesPage.tsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/Dialog'
import { Label } from '../../components/ui/Label'
import { Textarea } from '../../components/ui/Textarea'
import { Search, Filter, ExternalLink, Clock, DollarSign, Tag } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  category: string
  price_range: string
  status: string
  created_at: string
  creator?: {
    user_profiles: {
      first_name: string
      last_name: string
    }
  }
}

interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: string
}

export default function ServicesPage() {
  const { user, profile } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    requirements: '',
    budget_range: '',
    deadline: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchServices()
    fetchCategories()
  }, [selectedCategory])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services' + (selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''), {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setServices(data.services)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/service-categories', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleRequestService = (service: Service) => {
    setSelectedService(service)
    setRequestForm({
      title: `${service.name} - Service Request`,
      description: '',
      requirements: '',
      budget_range: service.price_range || '',
      deadline: '',
    })
    setRequestDialogOpen(true)
  }

  const submitServiceRequest = async () => {
    if (!selectedService) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          ...requestForm,
        }),
      })

      if (response.ok) {
        alert('Service request submitted successfully!')
        setRequestDialogOpen(false)
        setRequestForm({
          title: '',
          description: '',
          requirements: '',
          budget_range: '',
          deadline: '',
        })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Error submitting request')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName)
    return category?.icon || '🔧'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Services nan Tek Pou Nou
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Jwenn sèvis ak ekspètiz pou devlope biznis ou an
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechèche sèvis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout kategori yo</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.name}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCategoryIcon(service.category)}</span>
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {service.category}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                    {service.status === 'active' ? 'Aktif' : 'Inaktif'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-sm mb-4 line-clamp-3">
                  {service.description}
                </CardDescription>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {service.price_range && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{service.price_range}</span>
                    </div>
                  )}
                  
                  {service.creator && (
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4" />
                      <span>
                        {service.creator.user_profiles.first_name} {service.creator.user_profiles.last_name}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Detay yo
                </Button>
                
                {user && service.status === 'active' && (
                  <Button 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRequestService(service)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mande sèvis
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nou pa jwenn okenn sèvis
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Eseye chanje rechèch la oswa filtè a
            </p>
          </div>
        )}
      </div>

      {/* Service Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mande sèvis: {selectedService?.name}</DialogTitle>
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
                onChange={(e) => setRequestForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Tit demande sèvis la"
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsyon</Label>
              <Textarea
                id="description"
                value={requestForm.description}
                onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Eksplike kisa ou vle yo fè..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="requirements">Egzijans ak kondisyon yo</Label>
              <Textarea
                id="requirements"
                value={requestForm.requirements}
                onChange={(e) => setRequestForm(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Egzijans ak kondisyon yo (opsyonèl)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Bidjè</Label>
                <Input
                  id="budget"
                  value={requestForm.budget_range}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, budget_range: e.target.value }))}
                  placeholder="Ex: $500-1000"
                />
              </div>

              <div>
                <Label htmlFor="deadline">Delè</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={requestForm.deadline}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, deadline: e.target.value }))}
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
              {submitting ? 'N ap soumèt...' : 'Soumèt demande a'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}