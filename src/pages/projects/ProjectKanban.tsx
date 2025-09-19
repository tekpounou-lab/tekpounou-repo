// Project Management - Kanban Board for Tasks
// File: src/pages/projects/ProjectKanban.tsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Label } from '../../components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/Dialog'
import { Progress } from '../../components/ui/Progress'
import { Plus, Edit, Trash2, Calendar, User, AlertCircle, Clock, CheckCircle } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string
  completed_at: string
  created_at: string
  assignee?: {
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
  }
}

export default function ProjectKanban() {
  const { user, profile } = useAuth()
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
  })

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchTasks()
      fetchUsers()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${user?.access_token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/project-tasks?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${user?.access_token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${user?.access_token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/project-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          ...taskForm,
          project_id: projectId,
          status: 'todo',
        }),
      })

      if (response.ok) {
        await fetchTasks()
        await fetchProject()
        setTaskDialogOpen(false)
        resetTaskForm()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleUpdateTask = async () => {
    if (!selectedTask) return

    try {
      const response = await fetch(`/api/project-tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(taskForm),
      })

      if (response.ok) {
        await fetchTasks()
        await fetchProject()
        setTaskDialogOpen(false)
        resetTaskForm()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Ou vle efase travay sa a?')) return

    try {
      const response = await fetch(`/api/project-tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.access_token}` },
      })

      if (response.ok) {
        await fetchTasks()
        await fetchProject()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/project-tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchTasks()
        await fetchProject()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const openEditTask = (task: Task) => {
    setSelectedTask(task)
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assigned_to: task.assignee?.id || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
    })
    setTaskDialogOpen(true)
  }

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      assigned_to: '',
      due_date: '',
    })
    setSelectedTask(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-3 w-3" />
      case 'high':
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const formatPriority = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'urgent': 'Ijan',
      'high': 'Wo',
      'medium': 'Mwayen',
      'low': 'Ba',
    }
    return priorityMap[priority] || priority
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status)
  }

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && !dueDate
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pwojè a pa jwenn
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {project.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {project.description}
              </p>
            </div>
            <Button onClick={() => { resetTaskForm(); setTaskDialogOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajoute travay
            </Button>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pwogrè</span>
                  <span className="text-sm font-medium">{project.completion_percentage}%</span>
                </div>
                <Progress value={project.completion_percentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-600">Kliyan</p>
                    <p className="text-sm font-medium">
                      {project.client.user_profiles.first_name} {project.client.user_profiles.last_name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project.assignee && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600">Asiyen</p>
                      <p className="text-sm font-medium">
                        {project.assignee.user_profiles.first_name} {project.assignee.user_profiles.last_name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {project.end_date && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600">Delè</p>
                      <p className="text-sm font-medium">
                        {new Date(project.end_date).toLocaleDateString('fr-HT')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TODO Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pou fè ({getTasksByStatus('todo').length})
              </h3>
              <Badge variant="secondary">Todo</Badge>
            </div>

            <div className="space-y-3">
              {getTasksByStatus('todo').map(task => (
                <Card 
                  key={task.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openEditTask(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </h4>
                      <div className="flex space-x-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(task.priority)}`}
                        >
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1">{formatPriority(task.priority)}</span>
                        </Badge>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {task.due_date && (
                        <div className={`flex items-center space-x-1 ${
                          isOverdue(task.due_date) ? 'text-red-600' : ''
                        }`}>
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.due_date).toLocaleDateString('fr-HT')}</span>
                        </div>
                      )}

                      {task.assignee && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>
                            {task.assignee.user_profiles.first_name.charAt(0)}
                            {task.assignee.user_profiles.last_name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end mt-2 space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(task.id, 'in_progress')
                        }}
                      >
                        Kòmanse
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                K ap travay ({getTasksByStatus('in_progress').length})
              </h3>
              <Badge variant="default">K ap travay</Badge>
            </div>

            <div className="space-y-3">
              {getTasksByStatus('in_progress').map(task => (
                <Card 
                  key={task.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-blue-500"
                  onClick={() => openEditTask(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </h4>
                      <div className="flex space-x-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(task.priority)}`}
                        >
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1">{formatPriority(task.priority)}</span>
                        </Badge>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {task.due_date && (
                        <div className={`flex items-center space-x-1 ${
                          isOverdue(task.due_date) ? 'text-red-600' : ''
                        }`}>
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.due_date).toLocaleDateString('fr-HT')}</span>
                        </div>
                      )}

                      {task.assignee && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>
                            {task.assignee.user_profiles.first_name.charAt(0)}
                            {task.assignee.user_profiles.last_name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-2 space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(task.id, 'todo')
                        }}
                      >
                        Retounen
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(task.id, 'done')
                        }}
                      >
                        Fini
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* DONE Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Fini ({getTasksByStatus('done').length})
              </h3>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Fini
              </Badge>
            </div>

            <div className="space-y-3">
              {getTasksByStatus('done').map(task => (
                <Card 
                  key={task.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-green-500 opacity-75"
                  onClick={() => openEditTask(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white line-through">
                        {task.title}
                      </h4>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>

                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {task.completed_at && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Fini: {new Date(task.completed_at).toLocaleDateString('fr-HT')}</span>
                        </div>
                      )}

                      {task.assignee && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>
                            {task.assignee.user_profiles.first_name.charAt(0)}
                            {task.assignee.user_profiles.last_name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTask(task.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? 'Modifye travay' : 'Ajoute nouvo travay'}
            </DialogTitle>
            <DialogDescription>
              {selectedTask ? 'Modifye enfòmasyon travay la' : 'Kreye yon nouvo travay pou pwojè a'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="task_title">Tit travay la</Label>
              <Input
                id="task_title"
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Tit travay la"
              />
            </div>

            <div>
              <Label htmlFor="task_description">Deskripsyon</Label>
              <Textarea
                id="task_description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsyon travay la"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priyorite</Label>
                <Select 
                  value={taskForm.priority} 
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Ba</SelectItem>
                    <SelectItem value="medium">Mwayen</SelectItem>
                    <SelectItem value="high">Wo</SelectItem>
                    <SelectItem value="urgent">Ijan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assigned_to">Asiyen bay</Label>
                <Select 
                  value={taskForm.assigned_to} 
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chwazi asiyen" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.user_profiles?.first_name} {u.user_profiles?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="due_date">Delè</Label>
              <Input
                id="due_date"
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Anile
            </Button>
            <Button 
              onClick={selectedTask ? handleUpdateTask : handleCreateTask}
              disabled={!taskForm.title}
            >
              {selectedTask ? 'Modifye' : 'Kreye'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}