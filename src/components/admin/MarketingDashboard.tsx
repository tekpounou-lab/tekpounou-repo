import React, { useState, useEffect } from 'react'
import { 
  EnvelopeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShareIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { useSupabaseClient } from '../providers/SupabaseProvider'
import { toast } from 'react-hot-toast'

interface MarketingStats {
  newsletterStats: {
    totalSubscribers: number
    activeSubscribers: number
    unsubscribed: number
    unsubscribeRate: number
    sourceBreakdown: Record<string, number>
  }
  referralStats: {
    totalReferrals: number
    convertedReferrals: number
    conversionRate: number
    totalRewardValue: number
  }
  socialShareStats: {
    totalShares: number
    platformBreakdown: Record<string, number>
    contentTypeBreakdown: Record<string, number>
  }
  topSources: {
    sources: [string, number][]
    mediums: [string, number][]
    campaigns: [string, number][]
  }
  growthMetrics: Array<{
    metric_type: string
    total_count: number
    total_value: number
    daily_average: number
    growth_rate: number
  }>
}

export function MarketingDashboard() {
  const [stats, setStats] = useState<MarketingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [selectedMetric, setSelectedMetric] = useState('page_view')
  const [timeSeriesData, setTimeSeriesData] = useState([])
  
  const supabase = useSupabaseClient()

  useEffect(() => {
    loadMarketingStats()
    loadTimeSeriesData()
  }, [dateRange])

  const loadMarketingStats = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('analytics-tracker', {
        body: {
          action: 'get_growth_metrics',
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      })

      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error('Error loading marketing stats:', error)
      toast.error('Pa t kapab chaje done yo. Could not load data.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTimeSeriesData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics-tracker', {
        body: {
          action: 'get_analytics_data',
          startDate: dateRange.start,
          endDate: dateRange.end,
          metricTypes: [selectedMetric],
          groupBy: 'day'
        }
      })

      if (error) throw error

      // Transform data for charts
      const transformed = Object.entries(data.data || {}).map(([date, metrics]: [string, any]) => ({
        date,
        value: metrics[selectedMetric]?.count || 0,
        total: metrics[selectedMetric]?.value || 0
      })).sort((a, b) => a.date.localeCompare(b.date))

      setTimeSeriesData(transformed as any)
    } catch (error) {
      console.error('Error loading time series data:', error)
    }
  }

  const exportCSV = (dataType: string) => {
    if (!stats) return

    let csvContent = ''
    let filename = ''

    switch (dataType) {
      case 'newsletter':
        csvContent = 'Source,Subscribers\n'
        Object.entries(stats.newsletterStats.sourceBreakdown).forEach(([source, count]) => {
          csvContent += `${source},${count}\n`
        })
        filename = 'newsletter_subscribers.csv'
        break

      case 'referrals':
        csvContent = 'Total Referrals,Converted,Conversion Rate,Total Rewards\n'
        csvContent += `${stats.referralStats.totalReferrals},${stats.referralStats.convertedReferrals},${stats.referralStats.conversionRate}%,$${stats.referralStats.totalRewardValue}\n`
        filename = 'referral_stats.csv'
        break

      case 'social':
        csvContent = 'Platform,Shares\n'
        Object.entries(stats.socialShareStats.platformBreakdown).forEach(([platform, count]) => {
          csvContent += `${platform},${count}\n`
        })
        filename = 'social_shares.csv'
        break

      case 'traffic':
        csvContent = 'Source,Visitors\n'
        stats.topSources.sources.forEach(([source, count]) => {
          csvContent += `${source},${count}\n`
        })
        filename = 'traffic_sources.csv'
        break

      default:
        return
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Done yo ekspotetèl! Data exported!')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Data Available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Pa gen done yo disponib pou peryòd sa a.
        </p>
      </div>
    )
  }

  const COLORS = ['#1e40af', '#7c3aed', '#dc2626', '#059669', '#d97706', '#db2777']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Newsletter Subscribers"
          value={stats.newsletterStats.activeSubscribers}
          change={stats.newsletterStats.totalSubscribers - stats.newsletterStats.unsubscribed}
          icon={EnvelopeIcon}
          color="blue"
          onExport={() => exportCSV('newsletter')}
        />
        
        <MetricCard
          title="Referral Conversions"
          value={stats.referralStats.convertedReferrals}
          change={stats.referralStats.conversionRate}
          changeLabel="conversion rate"
          icon={UserGroupIcon}
          color="purple"
          onExport={() => exportCSV('referrals')}
        />
        
        <MetricCard
          title="Social Shares"
          value={stats.socialShareStats.totalShares}
          change={Object.values(stats.socialShareStats.platformBreakdown).reduce((a, b) => a + b, 0)}
          icon={ShareIcon}
          color="green"
          onExport={() => exportCSV('social')}
        />
        
        <MetricCard
          title="Top Growth Metric"
          value={stats.growthMetrics[0]?.total_count || 0}
          change={stats.growthMetrics[0]?.growth_rate || 0}
          changeLabel="growth rate"
          icon={ArrowTrendingUpIcon}
          color="orange"
        />
      </div>

      {/* Time Series Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow border"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Growth Trends</h3>
          <select
            value={selectedMetric}
            onChange={(e) => {
              setSelectedMetric(e.target.value)
              loadTimeSeriesData()
            }}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            <option value="page_view">Page Views</option>
            <option value="newsletter_signup">Newsletter Signups</option>
            <option value="course_enrollment">Course Enrollments</option>
            <option value="social_share">Social Shares</option>
            <option value="referral_click">Referral Clicks</option>
          </select>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#1e40af" fill="#1e40af" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Newsletter Sources */}
        <ChartCard
          title="Newsletter Sources"
          onExport={() => exportCSV('newsletter')}
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={Object.entries(stats.newsletterStats.sourceBreakdown).map(([name, value]) => ({ name, value }))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {Object.entries(stats.newsletterStats.sourceBreakdown).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Social Shares by Platform */}
        <ChartCard
          title="Social Shares by Platform"
          onExport={() => exportCSV('social')}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.entries(stats.socialShareStats.platformBreakdown).map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Traffic Sources */}
        <ChartCard
          title="Top Traffic Sources"
          onExport={() => exportCSV('traffic')}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.topSources.sources.slice(0, 8).map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Growth Metrics */}
        <ChartCard title="Growth Metrics Overview">
          <div className="space-y-3">
            {stats.growthMetrics.slice(0, 6).map((metric, index) => (
              <div key={metric.metric_type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {metric.metric_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Daily avg: {metric.daily_average}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {metric.total_count}
                  </p>
                  {metric.growth_rate !== null && (
                    <p className={`text-xs flex items-center ${
                      metric.growth_rate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.growth_rate > 0 ? (
                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(metric.growth_rate)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Referral Program Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow border"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Referral Program Performance</h3>
          <button
            onClick={() => exportCSV('referrals')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Export CSV
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.referralStats.totalReferrals}</p>
            <p className="text-sm text-gray-600">Total Referrals</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.referralStats.conversionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Conversion Rate</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">${stats.referralStats.totalRewardValue}</p>
            <p className="text-sm text-gray-600">Total Rewards</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel = 'change',
  icon: Icon, 
  color,
  onExport 
}: {
  title: string
  value: number
  change: number
  changeLabel?: string
  icon: React.ElementType
  color: string
  onExport?: () => void
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    purple: 'text-purple-600 bg-purple-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow border"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
          <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '↗' : '↘'} {Math.abs(change)} {changeLabel}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {onExport && (
        <button
          onClick={onExport}
          className="mt-4 text-xs text-blue-600 hover:text-blue-800"
        >
          Export Data
        </button>
      )}
    </motion.div>
  )
}

function ChartCard({ 
  title, 
  children, 
  onExport 
}: { 
  title: string
  children: React.ReactNode
  onExport?: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow border"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Export CSV
          </button>
        )}
      </div>
      {children}
    </motion.div>
  )
}
