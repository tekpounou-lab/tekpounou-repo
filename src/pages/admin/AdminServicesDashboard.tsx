// Admin Services Dashboard - Manage Services, Requests and Projects
// File: src/pages/admin/AdminServicesDashboard.tsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Label } from '../../components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/Dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Progress } from '../../components/ui/Progress'
import { Plus, Edit, Trash2, CheckCircle, XCircle, Clock, User, Calendar, DollarSign } from 'lucide-react'

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

interface ServiceRequest {
  id: string
  title: string
  description: string
  requirements: string
  budget_range: string
  deadline: string
  status: string
  admin_notes: string
  created_at: string
  service: {
    name: string
    category: string
  }
  client: {
    user_profiles: {
      first_name: string
      last_name: string
    }
  }
}

interface Project {
  id: string
  title: string
  description: string
  status: string
  completion_percentage: number
  start_date: string
  end_date: string
  budget: number
  created_at: string
  client: {
    user_profiles: {
      first_name: string
      last_name: string
    }
  }
  assignee?: {
    user_profiles: {
      first_name: string
      last_name: string
    }
  }
}

interface User {
  id: string
  email: string
  user_profiles: {
    first_name: string
    last_name: string
    role: string
  }
}

export default function AdminServicesDashboard() {
  const { user, profile } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('services')

  // Dialog states
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Form states
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: '',
    price_range: '',
    status: 'active',
  })

  const [requestUpdateForm, setRequestUpdateForm] = useState({
    status: '',
    admin_notes: '',
  })

  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    client_id: '',
    assigned_to: '',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'planning',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchServices(),
        fetchServiceRequests(),
        fetchProjects(),
        fetchUsers(),
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    const response = await fetch('/api/services', {
      headers: { 'Authorization': `Bearer ${user?.access_token}` },
    })
    if (response.ok) {
      const data = await response.json()
      setServices(data.services)
    }
  }

  const fetchServiceRequests = async () => {
    const response = await fetch('/api/service-requests', {
      headers: { 'Authorization': `Bearer ${user?.access_token}` },
    })
    if (response.ok) {
      const data = await response.json()
      setServiceRequests(data.serviceRequests)
    }
  }

  const fetchProjects = async () => {
    const response = await fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${user?.access_token}` },
    })
    if (response.ok) {
      const data = await response.json()
      setProjects(data.projects)
    }
  }

  const fetchUsers = async () => {
    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${user?.access_token}` },
    })
    if (response.ok) {
      const data = await response.json()
      setUsers(data.users || [])
    }
  }

  // Service Management
  const handleCreateService = async () => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(serviceForm),
      })

      if (response.ok) {
        await fetchServices()
        setServiceDialogOpen(false)
        resetServiceForm()
      }
    } catch (error) {
      console.error('Error creating service:', error)
    }
  }

  const handleUpdateService = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/services/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(serviceForm),
      })

      if (response.ok) {
        await fetchServices()
        setServiceDialogOpen(false)
        resetServiceForm()
      }
    } catch (error) {
      console.error('Error updating service:', error)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Ou vle efase sèvis sa a?')) return

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.access_token}` },
      })

      if (response.ok) {
        await fetchServices()
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  // Request Management
  const handleUpdateRequest = async () => {
    if (!selectedItem) return

    try {
      const response = await fetch(`/api/service-requests/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(requestUpdateForm),
      })

      if (response.ok) {
        await fetchServiceRequests()
        setRequestDialogOpen(false)
      }
    } catch (error) {
      console.error('Error updating request:', error)
    }
  }

  const handleCreateProjectFromRequest = async (request: ServiceRequest) => {
    setProjectForm({
      title: `${request.service.name} - ${request.client.user_profiles.first_name} ${request.client.user_profiles.last_name}`,
      description: request.description,
      client_id: request.client.id || '',
      assigned_to: '',
      start_date: '',
      end_date: '',
      budget: request.budget_range || '',
      status: 'planning',
    })
    setSelectedItem({ service_request_id: request.id })
    setProjectDialogOpen(true)
  }

  // Project Management
  const handleCreateProject = async () => {
    try {
      const projectData = {
        ...projectForm,
        budget: projectForm.budget ? parseFloat(projectForm.budget) : undefined,
        service_request_id: selectedItem?.service_request_id,
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(projectData),
      })

      if (response.ok) {
        await fetchProjects()
        await fetchServiceRequests()
        setProjectDialogOpen(false)
        resetProjectForm()
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      category: '',
      price_range: '',
      status: 'active',
    })
    setSelectedItem(null)
  }

  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      description: '',
      client_id: '',
      assigned_to: '',
      start_date: '',
      end_date: '',
      budget: '',
      status: 'planning',
    })
    setSelectedItem(null)
  }

  const openEditService = (service: Service) => {
    setSelectedItem(service)
    setServiceForm({
      name: service.name,
      description: service.description,
      category: service.category,
      price_range: service.price_range,
      status: service.status,
    })
    setServiceDialogOpen(true)
  }

  const openEditRequest = (request: ServiceRequest) => {
    setSelectedItem(request)
    setRequestUpdateForm({
      status: request.status,
      admin_notes: request.admin_notes || '',
    })
    setRequestDialogOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'in_progress':
        return 'default'
      case 'rejected':
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Ap tann',
      'in_progress': 'K ap travay',
      'active': 'Aktif',
      'completed': 'Fini',
      'rejected': 'Rejte',
      'cancelled': 'Anile',
      'planning': 'Planifikasyon',
      'on_hold': 'Sispann',
      'inactive': 'Inaktif',
    }
    return statusMap[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
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
            Dashboard sèvis yo - Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Jere sèvis yo, demande yo ak pwojè yo
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sèvis aktif</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {services.filter(s => s.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Demande k ap tann</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {serviceRequests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pwojè aktif</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(p => p.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pwojè konplè</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Sèvis yo</TabsTrigger>
            <TabsTrigger value="requests">Demande yo</TabsTrigger>
            <TabsTrigger value="projects">Pwojè yo</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Jere sèvis yo
              </h2>
              <Button onClick={() => { resetServiceForm(); setServiceDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajoute sèvis
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {services.map(service => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription>{service.category}</CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(service.status)}>
                        {formatStatus(service.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {service.description}
                    </p>
                    
                    {service.price_range && (
                      <p className="text-sm text-gray-500 mb-4">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        {service.price_range}
                      </p>
                    )}

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditService(service)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifye
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Efase
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Service Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Jere demande sèvis yo
              </h2>
            </div>

            <div className="space-y-4">
              {serviceRequests.map(request => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {request.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {request.service.name} - {request.client.user_profiles.first_name} {request.client.user_profiles.last_name}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {formatStatus(request.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <strong>Deskripsyon:</strong> {request.description}
                        </p>
                        {request.requirements && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Egzijans:</strong> {request.requirements}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {request.budget_range && (
                          <p className="text-sm">
                            <strong>Bidjè:</strong> {request.budget_range}
                          </p>
                        )}
                        {request.deadline && (
                          <p className="text-sm">
                            <strong>Delè:</strong> {new Date(request.deadline).toLocaleDateString('fr-HT')}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(request.created_at).toLocaleDateString('fr-HT')}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditRequest(request)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifye
                      </Button>
                      
                      {request.status === 'pending' && (
                        <Button size="sm" onClick={() => handleCreateProjectFromRequest(request)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Kreye pwojè
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Jere pwojè yo
              </h2>
              <Button onClick={() => { resetProjectForm(); setProjectDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajoute pwojè
              </Button>
            </div>

            <div className="space-y-6">
              {projects.map(project => (
                <Card key={project.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {project.description}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {formatStatus(project.status)}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Pwogrè
                        </span>
                        <span className="text-sm text-gray-500">
                          {project.completion_percentage}%
                        </span>
                      </div>
                      <Progress value={project.completion_percentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>Kliyan:</strong> {project.client.user_profiles.first_name} {project.client.user_profiles.last_name}
                      </div>
                      {project.assignee && (
                        <div>
                          <strong>Asiyen:</strong> {project.assignee.user_profiles.first_name} {project.assignee.user_profiles.last_name}
                        </div>
                      )}
                      {project.start_date && (
                        <div>
                          <strong>Kòmansman:</strong> {new Date(project.start_date).toLocaleDateString('fr-HT')}
                        </div>
                      )}
                      {project.budget && (
                        <div>
                          <strong>Bidjè:</strong> ${project.budget}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifye sèvis' : 'Ajoute nouvo sèvis'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Non sèvis la</Label>
              <Input
                id="name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Non sèvis la"
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsyon</Label>
              <Textarea
                id="description"
                value={serviceForm.description}
                onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsyon sèvis la"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Teknoloji, Konsèy"
                />
              </div>

              <div>
                <Label htmlFor="price_range">Kantite lajan</Label>
                <Input
                  id="price_range"
                  value={serviceForm.price_range}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, price_range: e.target.value }))}
                  placeholder="Ex: $500-1500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Estati</Label>
              <Select 
                value={serviceForm.status} 
                onValueChange={(value) => setServiceForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Inaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>
              Anile
            </Button>
            <Button 
              onClick={selectedItem ? handleUpdateService : handleCreateService}
              disabled={!serviceForm.name || !serviceForm.description}
            >
              {selectedItem ? 'Modifye' : 'Kreye'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Update Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifye demande sèvis</DialogTitle>
            <DialogDescription>
              Chanje estati ak ajoute nòt sou demande a
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Nouvo estati</Label>
              <Select 
                value={requestUpdateForm.status} 
                onValueChange={(value) => setRequestUpdateForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Ap tann</SelectItem>
                  <SelectItem value="in_progress">K ap travay</SelectItem>
                  <SelectItem value="completed">Fini</SelectItem>
                  <SelectItem value="rejected">Rejte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="admin_notes">Nòt administratè</Label>
              <Textarea
                id="admin_notes"
                value={requestUpdateForm.admin_notes}
                onChange={(e) => setRequestUpdateForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                placeholder="Ajoute nòt pou kliyan an..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Anile
            </Button>
            <Button onClick={handleUpdateRequest}>
              Modifye
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kreye nouvo pwojè</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="project_title">Tit pwojè a</Label>
              <Input
                id="project_title"
                value={projectForm.title}
                onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Tit pwojè a"
              />
            </div>

            <div>
              <Label htmlFor="project_description">Deskripsyon</Label>
              <Textarea
                id="project_description"
                value={projectForm.description}
                onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsyon pwojè a"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Kliyan</Label>
                <Select 
                  value={projectForm.client_id} 
                  onValueChange={(value) => setProjectForm(prev => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chwazi kliyan" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.user_profiles?.role !== 'super_admin' && u.user_profiles?.role !== 'admin').map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.user_profiles?.first_name} {user.user_profiles?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assigned_to">Asiyen bay</Label>
                <Select 
                  value={projectForm.assigned_to} 
                  onValueChange={(value) => setProjectForm(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chwazi asiyen" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => ['admin', 'teacher'].includes(u.user_profiles?.role || '')).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.user_profiles?.first_name} {user.user_profiles?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_date">Dat kòmansman</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={projectForm.start_date}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="end_date">Dat fen</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={projectForm.end_date}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="budget">Bidjè</Label>
                <Input
                  id="budget"
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
              Anile
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={!projectForm.title || !projectForm.client_id}
            >
              Kreye pwojè
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}