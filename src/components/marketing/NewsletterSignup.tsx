import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { useSupabaseClient } from '../providers/SupabaseProvider'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'

const newsletterSchema = z.object({
  email: z.string().email('Email la pa valab. Email is not valid.'),
  name: z.string().min(2, 'Non an twò kout. Name is too short.').optional()
})

type NewsletterFormData = z.infer<typeof newsletterSchema>

interface NewsletterSignupProps {
  variant?: 'inline' | 'modal' | 'sidebar' | 'footer'
  source?: string
  className?: string
  showName?: boolean
  title?: string
  description?: string
  placeholder?: string
  buttonText?: string
  successMessage?: string
  size?: 'sm' | 'md' | 'lg'
}

export function NewsletterSignup({
  variant = 'inline',
  source = 'website',
  className = '',
  showName = false,
  title,
  description,
  placeholder,
  buttonText,
  successMessage,
  size = 'md'
}: NewsletterSignupProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const supabase = useSupabaseClient()
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: user?.email || '',
      name: user?.user_metadata?.display_name || ''
    }
  })

  const onSubmit = async (data: NewsletterFormData) => {
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase.functions.invoke('email-marketing', {
        body: {
          action: 'subscribe_newsletter',
          email: data.email,
          name: data.name,
          source,
          userId: user?.id,
          metadata: {
            subscribed_from: window.location.pathname,
            utm_source: new URLSearchParams(window.location.search).get('utm_source'),
            utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
            utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
            referrer: document.referrer
          }
        }
      })

      if (error) throw error

      setIsSubscribed(true)
      reset()
      toast.success(successMessage || 'Ou abonnen ak siksè! You subscribed successfully!')
      
    } catch (error: any) {
      console.error('Newsletter subscription error:', error)
      toast.error('Gen yon pwoblèm. Eseye ankò. There was a problem. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'modal':
        return 'bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto'
      case 'sidebar':
        return 'bg-gray-50 p-4 rounded-lg border'
      case 'footer':
        return 'text-white'
      default:
        return 'bg-white border border-gray-200 rounded-lg p-4'
    }
  }

  const defaultContent = {
    title: 'Abonnen nan Newsletter nou an',
    description: 'Resevwa dènye nouvo yo, kou yo ak konsèy teknoloji yo dirèkteman nan email ou.',
    placeholder: 'Antre email ou a...',
    buttonText: 'Abonnen',
    successMessage: 'Ou abonnen ak siksè! Verifye email ou a.'
  }

  if (isSubscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${getVariantStyles()} ${className}`}
      >
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className={`font-semibold text-gray-900 mb-2 ${sizeClasses[size]}`}>
            Mèsi anpil!
          </h3>
          <p className="text-gray-600 text-sm">
            {successMessage || defaultContent.successMessage}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`${getVariantStyles()} ${className}`}>
      {(title || defaultContent.title) && (
        <h3 className={`font-semibold text-gray-900 mb-2 ${sizeClasses[size]}`}>
          {title || defaultContent.title}
        </h3>
      )}
      
      {(description || defaultContent.description) && (
        <p className="text-gray-600 text-sm mb-4">
          {description || defaultContent.description}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {showName && (
          <div>
            <input
              {...register('name')}
              type="text"
              placeholder="Non ou a / Your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        )}

        <div>
          <div className="relative">
            <input
              {...register('email')}
              type="email"
              placeholder={placeholder || defaultContent.placeholder}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Ap abonnen...
            </div>
          ) : (
            buttonText || defaultContent.buttonText
          )}
        </button>
      </form>

      <p className="mt-3 text-xs text-gray-500">
        Nou p ap janm pataje email ou a ak moun lòt yo. 
        <br />
        Ou ka rete abonnen nenpòt lè.
      </p>
    </div>
  )
}

// Floating newsletter popup
export function FloatingNewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  React.useEffect(() => {
    // Check if user has already dismissed or subscribed
    const dismissed = localStorage.getItem('newsletter_popup_dismissed')
    const subscribed = localStorage.getItem('newsletter_subscribed')
    
    if (dismissed || subscribed) {
      return
    }

    // Show popup after 30 seconds or when user scrolls to 50% of page
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 30000)

    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      if (scrollPercentage > 50) {
        setIsVisible(true)
        window.removeEventListener('scroll', handleScroll)
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('newsletter_popup_dismissed', 'true')
  }

  if (!isVisible || isDismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-1">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <NewsletterSignup
            variant="modal"
            source="popup"
            className="border-0 shadow-none"
            title="Pa rate nouvo yo!"
            description="Jwenn dènye kou yo ak nouvo teknoloji yo nan email ou."
            size="sm"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Inline newsletter section for blog posts and course pages
export function InlineNewsletterCTA({
  context = 'general',
  relatedId,
  className = ''
}: {
  context?: string
  relatedId?: string
  className?: string
}) {
  const contextMessages = {
    course: {
      title: 'Vle aprann plis?',
      description: 'Abonnen pou resevwa nouvo kou yo ak resous ki ka ede ou nan devlopman ou.'
    },
    blog: {
      title: 'Renmen atik sa a?',
      description: 'Abonnen pou resevwa nouvo atik yo ak konsèy teknoloji yo.'
    },
    service: {
      title: 'Bezwen èd ak pwojè ou a?',
      description: 'Abonnen pou resevwa konsèy ak tips ki ka ede ou ak pwojè teknoloji ou yo.'
    },
    general: {
      title: 'Rete konekte ak nou',
      description: 'Resevwa dènye nouvo yo, kou yo ak konsèy teknoloji yo.'
    }
  }

  const content = contextMessages[context as keyof typeof contextMessages] || contextMessages.general

  return (
    <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{content.title}</h3>
        <p className="text-blue-100">{content.description}</p>
      </div>
      
      <NewsletterSignup
        variant="inline"
        source={`${context}_page`}
        className="bg-white/10 backdrop-blur-sm border-white/20"
        showName={false}
        title=""
        description=""
        placeholder="Email ou a..."
        buttonText="Abonnen Kounye a"
      />
    </div>
  )
}

// Newsletter unsubscribe component
export function NewsletterUnsubscribe() {
  const [email, setEmail] = useState('')
  const [isUnsubscribing, setIsUnsubscribing] = useState(false)
  const [isUnsubscribed, setIsUnsubscribed] = useState(false)
  const supabase = useSupabaseClient()

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUnsubscribing(true)

    try {
      const { error } = await supabase.functions.invoke('email-marketing', {
        body: {
          action: 'unsubscribe_newsletter',
          email
        }
      })

      if (error) throw error

      setIsUnsubscribed(true)
      toast.success('Ou pa abonnen ankò. You have been unsubscribed.')
      
    } catch (error) {
      toast.error('Gen yon pwoblèm. Eseye ankò. There was a problem.')
    } finally {
      setIsUnsubscribing(false)
    }
  }

  if (isUnsubscribed) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ou pa abonnen ankò</h2>
        <p className="text-gray-600">
          Nou regrèt wè ou ale. Ou ka abonnen ankò nenpòt lè.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Pa abonnen nan Newsletter</h2>
      <p className="text-gray-600 mb-4">
        Antre email ou a pou ou pa abonnen nan newsletter nou an.
      </p>
      
      <form onSubmit={handleUnsubscribe}>
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email ou a..."
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button
          type="submit"
          disabled={isUnsubscribing}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {isUnsubscribing ? 'Ap retire...' : 'Pa Abonnen'}
        </button>
      </form>
    </div>
  )
}

// Hook for newsletter management
export function useNewsletter() {
  const supabase = useSupabaseClient()

  const subscribe = async (email: string, name?: string, source?: string) => {
    const { data, error } = await supabase.functions.invoke('email-marketing', {
      body: {
        action: 'subscribe_newsletter',
        email,
        name,
        source: source || 'api'
      }
    })

    if (error) throw error
    return data
  }

  const unsubscribe = async (email: string) => {
    const { data, error } = await supabase.functions.invoke('email-marketing', {
      body: {
        action: 'unsubscribe_newsletter',
        email
      }
    })

    if (error) throw error
    return data
  }

  return { subscribe, unsubscribe }
}
