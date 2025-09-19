// Client Dashboard - Track Service Requests and Projects
// File: src/pages/client/ClientDashboard.tsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Progress } from '../../components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs'
import { Calendar, Clock, DollarSign, User, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface ServiceRequest {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  service: {
    name: string
    category: string
  }
  admin_notes?: string
}

interface Project {
  id: string
  title: string
  description: string
  status: string
  completion_percentage: number
  start_date: string
  end_date: string
  created_at: string
  assignee?: {
    user_profiles: {
      first_name: string
      last_name: string
    }
  }
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    due_date: string
  }>
}

export default function ClientDashboard() {
  const { user, profile } = useAuth()
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('requests')

  useEffect(() => {
    fetchServiceRequests()
    fetchProjects()
  }, [])

  const fetchServiceRequests = async () => {
    try {
      const response = await fetch('/api/service-requests', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setServiceRequests(data.serviceRequests)
      }
    } catch (error) {
      console.error('Error fetching service requests:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'in_progress':
      case 'active':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'in_progress':
      case 'active':
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
      'in_progress': 'K ap travay sou li',
      'active': 'Aktif',
      'completed': 'Fini',
      'rejected': 'Rejte',
      'cancelled': 'Anile',
      'planning': 'Planifikasyon',
      'on_hold': 'Sispann',
    }
    return statusMap[status] || status
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600'
      case 'high':
        return 'text-orange-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
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
            Dashboard kliyan an
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Suiv demande ak pwojè ou yo
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <AlertCircle className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">K ap travay</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {serviceRequests.filter(r => r.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
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
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fini</p>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests">Demande sèvis yo</TabsTrigger>
            <TabsTrigger value="projects">Pwojè yo</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {serviceRequests.map(request => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <CardDescription>
                          {request.service.name} - {request.service.category}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(request.status)}
                          <span>{formatStatus(request.status)}</span>
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {request.description}
                    </p>
                    
                    {request.admin_notes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Nòt administratè a:
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {request.admin_notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Soumèt: {new Date(request.created_at).toLocaleDateString('fr-HT')}</span>
                      </span>
                      
                      {request.updated_at !== request.created_at && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Modifye: {new Date(request.updated_at).toLocaleDateString('fr-HT')}</span>
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {serviceRequests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Ou pa gen okenn demande sèvis
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Kòmanse pa mande yon sèvis sou platfòm nan
                </p>
                <Button>Gade sèvis yo</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <div className="space-y-6">
              {projects.map(project => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{project.title}</CardTitle>
                        <CardDescription>
                          {project.description}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(project.status)}
                          <span>{formatStatus(project.status)}</span>
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Progress */}
                    <div className="mb-6">
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

                    {/* Project Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {project.assignee && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {project.assignee.user_profiles.first_name} {project.assignee.user_profiles.last_name}
                          </span>
                        </div>
                      )}
                      
                      {project.start_date && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {new Date(project.start_date).toLocaleDateString('fr-HT')}
                          </span>
                        </div>
                      )}
                      
                      {project.end_date && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {new Date(project.end_date).toLocaleDateString('fr-HT')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Recent Tasks */}
                    {project.tasks && project.tasks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Travay yo k gen dènyèman:
                        </h4>
                        <div className="space-y-2">
                          {project.tasks.slice(0, 3).map(task => (
                            <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(task.status)}
                                <span className="text-sm">{task.title}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getPriorityColor(task.priority)}`}
                                >
                                  {task.priority}
                                </Badge>
                                {task.due_date && (
                                  <span className="text-xs text-gray-500">
                                    {new Date(task.due_date).toLocaleDateString('fr-HT')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {project.tasks.length > 3 && (
                            <p className="text-xs text-gray-500 text-center pt-2">
                              +{project.tasks.length - 3} travay yo ankò
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {projects.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Ou pa gen okenn pwojè
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Pwojè yo ap parèt lè yo aksepte demande ou yo
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}