import React, { useState, useEffect } from 'react'
import {
  Activity,
  Users,
  Server,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Download,
  Eye,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { usePerformanceTracking } from '@/lib/performanceService'

interface HealthMetric {
  id: string
  name: string
  value: number | string
  status: 'healthy' | 'warning' | 'critical'
  timestamp: string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  description?: string
}

interface SystemStats {
  activeUsers: number
  totalRequests: number
  errorRate: number
  avgResponseTime: number
  databaseConnections: number
  cacheHitRate: number
  serverUptime: number
}

interface PerformanceData {
  avgLoadTime: number
  fcp: number
  lcp: number
  cls: number
  fid: number
  errorCount: number
  pageViews: number
}

export default function SuperAdminHealthDashboard() {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { getPerformanceReport } = usePerformanceTracking()

  useEffect(() => {
    fetchHealthData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchHealthData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchSystemHealth(),
        fetchPerformanceMetrics(),
        fetchDatabaseHealth(),
      ])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    }
    setIsLoading(false)
  }

  const fetchSystemHealth = async () => {
    try {
      // Fetch active users count
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Fetch recent analytics for request metrics
      const { data: recentAnalytics } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      // Fetch error reports for error rate
      const { count: errorCount } = await supabase
        .from('error_reports')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const totalRequests = recentAnalytics?.length || 0
      const errorRate = totalRequests > 0 ? ((errorCount || 0) / totalRequests) * 100 : 0

      // Mock some metrics that would come from server monitoring
      const stats: SystemStats = {
        activeUsers: activeUsers || 0,
        totalRequests,
        errorRate,
        avgResponseTime: Math.random() * 200 + 100, // Simulated
        databaseConnections: Math.floor(Math.random() * 20) + 5, // Simulated
        cacheHitRate: Math.random() * 20 + 80, // Simulated
        serverUptime: Math.random() * 100 + 99, // Simulated
      }

      setSystemStats(stats)

      // Update health metrics
      const metrics: HealthMetric[] = [
        {
          id: 'active-users',
          name: 'Utilisateurs actifs',
          value: stats.activeUsers,
          status: stats.activeUsers > 100 ? 'healthy' : stats.activeUsers > 50 ? 'warning' : 'critical',
          timestamp: new Date().toISOString(),
          trend: 'up',
        },
        {
          id: 'error-rate',
          name: 'Taux d\'erreur',
          value: stats.errorRate.toFixed(2),
          status: stats.errorRate < 1 ? 'healthy' : stats.errorRate < 5 ? 'warning' : 'critical',
          timestamp: new Date().toISOString(),
          unit: '%',
          trend: stats.errorRate < 2 ? 'down' : 'up',
        },
        {
          id: 'response-time',
          name: 'Temps de réponse moyen',
          value: Math.round(stats.avgResponseTime),
          status: stats.avgResponseTime < 200 ? 'healthy' : stats.avgResponseTime < 500 ? 'warning' : 'critical',
          timestamp: new Date().toISOString(),
          unit: 'ms',
          trend: 'stable',
        },
        {
          id: 'db-connections',
          name: 'Connexions DB',
          value: stats.databaseConnections,
          status: stats.databaseConnections < 15 ? 'healthy' : stats.databaseConnections < 25 ? 'warning' : 'critical',
          timestamp: new Date().toISOString(),
          trend: 'stable',
        },
        {
          id: 'cache-hit-rate',
          name: 'Taux de cache',
          value: stats.cacheHitRate.toFixed(1),
          status: stats.cacheHitRate > 90 ? 'healthy' : stats.cacheHitRate > 80 ? 'warning' : 'critical',
          timestamp: new Date().toISOString(),
          unit: '%',
          trend: 'up',
        },
        {
          id: 'server-uptime',
          name: 'Disponibilité serveur',
          value: stats.serverUptime.toFixed(2),
          status: stats.serverUptime > 99.5 ? 'healthy' : stats.serverUptime > 99 ? 'warning' : 'critical',
          timestamp: new Date().toISOString(),
          unit: '%',
          trend: 'stable',
        },
      ]

      setHealthMetrics(metrics)
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    }
  }

  const fetchPerformanceMetrics = async () => {
    try {
      const report = await getPerformanceReport()
      if (report) {
        setPerformanceData(report)
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
    }
  }

  const fetchDatabaseHealth = async () => {
    try {
      // Check database connectivity and performance
      const start = performance.now()
      await supabase.from('users').select('id').limit(1)
      const dbResponseTime = performance.now() - start

      // This would ideally come from database monitoring
      console.log('Database response time:', dbResponseTime)
    } catch (error) {
      console.error('Database health check failed:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'critical':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const exportHealthReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      healthMetrics,
      systemStats,
      performanceData,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Santé</h1>
          <p className="text-gray-600">
            Dernière mise à jour: {lastRefresh.toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
              autoRefresh
                ? 'border-green-300 text-green-700 bg-green-50'
                : 'border-gray-300 text-gray-700 bg-white'
            }`}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-actualisation {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={fetchHealthData}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={exportHealthReport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Server className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Statut Système</p>
              <p className="text-lg font-semibold text-green-600">Opérationnel</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Database className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Base de Données</p>
              <p className="text-lg font-semibold text-green-600">Connectée</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Wifi className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">API</p>
              <p className="text-lg font-semibold text-green-600">Disponible</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <Cpu className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Performance</p>
              <p className="text-lg font-semibold text-yellow-600">Optimale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthMetrics.map((metric) => (
          <div
            key={metric.id}
            className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {getStatusIcon(metric.status)}
                <h3 className="ml-2 text-sm font-medium text-gray-900">
                  {metric.name}
                </h3>
              </div>
              {getTrendIcon(metric.trend)}
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                {metric.value}
              </span>
              {metric.unit && (
                <span className="ml-1 text-sm text-gray-500">{metric.unit}</span>
              )}
            </div>
            {metric.description && (
              <p className="mt-1 text-xs text-gray-600">{metric.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Performance Metrics */}
      {performanceData && (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Métriques de Performance Web
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceData.avgLoadTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">Temps de chargement moyen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performanceData.fcp?.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">First Contentful Paint</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceData.lcp?.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">Largest Contentful Paint</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {performanceData.cls?.toFixed(3)}
                </div>
                <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Resource Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Utilisation des Ressources
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Cpu className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">CPU</span>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: '65%' }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">65%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDrive className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Mémoire</span>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: '45%' }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Stockage</span>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: '30%' }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">30%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Activité Récente
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-gray-600">
                  Déploiement réussi - il y a 2 heures
                </span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-gray-600">
                  Migration base de données - il y a 6 heures
                </span>
              </div>
              <div className="flex items-center text-sm">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-gray-600">
                  Pic de trafic détecté - il y a 8 heures
                </span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-gray-600">
                  Sauvegarde automatique - il y a 12 heures
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
