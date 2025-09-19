import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  GiftIcon, 
  ClipboardDocumentIcon, 
  EnvelopeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShareIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useSupabaseClient } from '../providers/SupabaseProvider'
import { useAuthStore } from '../stores/authStore'
import { SocialShare } from '../common/SocialShare'

const referralSchema = z.object({
  email: z.string().email('Email la pa valab. Email is not valid.')
})

type ReferralFormData = z.infer<typeof referralSchema>

interface Referral {
  id: string
  referral_code: string
  referee_email: string
  status: 'pending' | 'registered' | 'converted' | 'expired'
  reward_type: string
  reward_value: number
  reward_description: string
  created_at: string
  converted_at?: string
}

export function ReferralDashboard() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    totalEarned: 0,
    pendingRewards: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useSupabaseClient()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      loadReferrals()
    }
  }, [user])

  const loadReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setReferrals(data || [])
      
      // Calculate stats
      const totalReferrals = data?.length || 0
      const successfulReferrals = data?.filter(r => r.status === 'converted').length || 0
      const totalEarned = data?.filter(r => r.status === 'converted')
        .reduce((sum, r) => sum + (r.reward_value || 0), 0) || 0
      const pendingRewards = data?.filter(r => r.status === 'registered' || r.status === 'pending')
        .reduce((sum, r) => sum + (r.reward_value || 0), 0) || 0

      setStats({
        totalReferrals,
        successfulReferrals,
        totalEarned,
        pendingRewards
      })
    } catch (error) {
      console.error('Error loading referrals:', error)
      toast.error('Pa t kapab chaje done yo. Could not load data.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateReferralLink = () => {
    if (!user) return ''
    return `${window.location.origin}?ref=${user.id}`
  }

  const copyReferralLink = () => {
    toast.success('Lyen refe a kopye! Referral link copied!')
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow border"
        >
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Referrals</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReferrals}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow border"
        >
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Siksè / Successful</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.successfulReferrals}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow border"
        >
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Earned</h3>
              <p className="text-2xl font-semibold text-gray-900">${stats.totalEarned}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow border"
        >
          <div className="flex items-center">
            <GiftIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Rewards</h3>
              <p className="text-2xl font-semibold text-gray-900">${stats.pendingRewards}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Referral Link Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white"
      >
        <h3 className="text-lg font-semibold mb-4">Lyen Referral Ou a / Your Referral Link</h3>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={generateReferralLink()}
              readOnly
              className="flex-1 bg-white/20 border border-white/30 rounded px-3 py-2 text-white placeholder-white/70"
            />
            <CopyToClipboard text={generateReferralLink()} onCopy={copyReferralLink}>
              <button className="bg-white/20 hover:bg-white/30 p-2 rounded transition-colors">
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
            </CopyToClipboard>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-white/80 mb-3">Pataje nan rezo sosyal yo:</p>
            <SocialShare
              url={generateReferralLink()}
              title="Vin jwenn mwen nan Tek Pou Nou!"
              description="Platform edikasyonèl pou kominote Ayisyen an. Aprann teknoloji ak kou yo!"
              contentType="landing_page"
              contentId="referral"
              platforms={['facebook', 'twitter', 'whatsapp', 'email', 'copy_link']}
              iconSize={28}
            />
          </div>
        </div>
      </motion.div>

      {/* Send Referral Section */}
      <SendReferralForm onReferralSent={loadReferrals} />

      {/* Referrals List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg shadow border"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Referrals Ou yo / Your Referrals</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reward
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Ou pa gen referral ankò. Kòmanse pataje lyen ou a!
                    <br />
                    You don't have any referrals yet. Start sharing your link!
                  </td>
                </tr>
              ) : (
                referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {referral.referee_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={referral.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {referral.reward_description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

function SendReferralForm({ onReferralSent }: { onReferralSent: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = useSupabaseClient()
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema)
  })

  const onSubmit = async (data: ReferralFormData) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.functions.invoke('email-marketing', {
        body: {
          action: 'create_referral',
          referrerId: user.id,
          refereeEmail: data.email,
          rewardType: 'discount',
          rewardValue: 10
        }
      })

      if (error) throw error

      toast.success('Referral yo voye! Referral sent successfully!')
      reset()
      onReferralSent()
    } catch (error: any) {
      console.error('Error sending referral:', error)
      toast.error('Pa t kapab voye referral la. Could not send referral.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-lg shadow border p-6"
    >
      <div className="flex items-center mb-4">
        <EnvelopeIcon className="h-6 w-6 text-blue-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">
          Voye Referral / Send Referral
        </h3>
      </div>
      
      <p className="text-gray-600 mb-4">
        Voye yon enbitasyon bay zanmi ou yo ak jwenn rekonpans yo.
        <br />
        Send an invitation to your friends and earn rewards.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-3">
        <div className="flex-1">
          <input
            {...register('email')}
            type="email"
            placeholder="Email zanmi ou a / Friend's email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Ap voye...' : 'Voye'}
        </button>
      </form>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { color: 'yellow', text: 'Pending' },
    registered: { color: 'blue', text: 'Registered' },
    converted: { color: 'green', text: 'Converted' },
    expired: { color: 'red', text: 'Expired' }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
      {config.text}
    </span>
  )
}

// Referral banner for course/service pages
export function ReferralBanner({ 
  className = '',
  contentType,
  contentId 
}: { 
  className?: string
  contentType?: string
  contentId?: string
}) {
  const { user } = useAuthStore()
  
  if (!user) return null

  return (
    <div className={`bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Jwenn $10 pou chak referral! 🎁
          </h3>
          <p className="text-purple-100">
            Pataje ak zanmi yo ak jwenn rekonpans yo lè yo enskri.
          </p>
        </div>
        <div className="ml-6">
          <SocialShare
            url={`${window.location.origin}?ref=${user.id}`}
            title="Vin jwenn mwen nan Tek Pou Nou!"
            description="Platform edikasyonèl pou kominote Ayisyen an"
            contentType="landing_page"
            contentId="referral_banner"
            platforms={['facebook', 'twitter', 'whatsapp']}
            iconSize={24}
          />
        </div>
      </div>
    </div>
  )
}

// Hook for referral functionality
export function useReferral() {
  const supabase = useSupabaseClient()
  const { user } = useAuthStore()

  const createReferral = async (refereeEmail: string) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.functions.invoke('email-marketing', {
      body: {
        action: 'create_referral',
        referrerId: user.id,
        refereeEmail,
        rewardType: 'discount',
        rewardValue: 10
      }
    })

    if (error) throw error
    return data
  }

  const trackReferralClick = async (referralCode: string) => {
    const { data, error } = await supabase.functions.invoke('email-marketing', {
      body: {
        action: 'track_referral_click',
        referralCode
      }
    })

    if (error) throw error
    return data
  }

  const getReferrals = async () => {
    if (!user) return []

    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  return {
    createReferral,
    trackReferralClick,
    getReferrals
  }
}

// Check for referral code on page load
export function useReferralTracking() {
  const supabase = useSupabaseClient()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const referralCode = urlParams.get('ref')
    
    if (referralCode) {
      // Store referral code in localStorage for later use
      localStorage.setItem('referral_code', referralCode)
      
      // Track the referral click
      supabase.functions.invoke('email-marketing', {
        body: {
          action: 'track_referral_click',
          referralCode
        }
      }).catch(console.error)
    }
  }, [supabase])
}
