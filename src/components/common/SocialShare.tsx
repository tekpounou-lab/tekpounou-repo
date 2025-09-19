import React, { useState } from 'react'
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton, 
  WhatsappShareButton, 
  TelegramShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  TelegramIcon,
  EmailIcon
} from 'react-share'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { LinkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { useSupabaseClient } from '../providers/SupabaseProvider'
import { useAuthStore } from '../stores/authStore'

interface SocialShareProps {
  url: string
  title: string
  description?: string
  hashtags?: string[]
  via?: string
  contentType: 'course' | 'blog_post' | 'service' | 'certificate' | 'landing_page'
  contentId: string
  className?: string
  iconSize?: number
  showLabels?: boolean
  orientation?: 'horizontal' | 'vertical'
  platforms?: ('facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'telegram' | 'email' | 'copy_link')[]
}

const defaultPlatforms: SocialShareProps['platforms'] = [
  'facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'email', 'copy_link'
]

export function SocialShare({
  url,
  title,
  description = '',
  hashtags = [],
  via = 'TekPouNou',
  contentType,
  contentId,
  className = '',
  iconSize = 32,
  showLabels = false,
  orientation = 'horizontal',
  platforms = defaultPlatforms
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const supabase = useSupabaseClient()
  const { user } = useAuthStore()

  const trackShare = async (platform: string) => {
    try {
      // Track social share
      await supabase.functions.invoke('analytics-tracker', {
        body: {
          action: 'track_social_share',
          contentType,
          contentId,
          platform,
          userId: user?.id,
          sessionId: getSessionId(),
          sharedUrl: url
        }
      })
    } catch (error) {
      console.error('Failed to track social share:', error)
    }
  }

  const handleCopyLink = () => {
    setCopied(true)
    toast.success('Lyen an kopye! Link copied!')
    trackShare('copy_link')
    
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const shareData = {
    url,
    title,
    subject: title,
    body: description,
    separator: ' - ',
    hashtag: hashtags.length > 0 ? `#${hashtags[0]}` : undefined,
    hashtags: hashtags,
    via,
    quote: description
  }

  const containerClasses = `
    flex ${orientation === 'vertical' ? 'flex-col space-y-2' : 'flex-row space-x-2'} 
    items-center ${className}
  `

  const iconProps = {
    size: iconSize,
    round: true
  }

  const buttonClasses = showLabels 
    ? `flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors`
    : ''

  const platformComponents = {
    facebook: (
      <FacebookShareButton
        key="facebook"
        url={shareData.url}
        quote={shareData.quote}
        hashtag={shareData.hashtag}
        className={buttonClasses}
        onClick={() => trackShare('facebook')}
      >
        <div className="flex items-center space-x-2">
          <FacebookIcon {...iconProps} />
          {showLabels && <span className="text-sm font-medium">Facebook</span>}
        </div>
      </FacebookShareButton>
    ),

    twitter: (
      <TwitterShareButton
        key="twitter"
        url={shareData.url}
        title={shareData.title}
        hashtags={shareData.hashtags}
        via={shareData.via}
        className={buttonClasses}
        onClick={() => trackShare('twitter')}
      >
        <div className="flex items-center space-x-2">
          <TwitterIcon {...iconProps} />
          {showLabels && <span className="text-sm font-medium">Twitter</span>}
        </div>
      </TwitterShareButton>
    ),

    linkedin: (
      <LinkedinShareButton
        key="linkedin"
        url={shareData.url}
        title={shareData.title}
        summary={shareData.body}
        className={buttonClasses}
        onClick={() => trackShare('linkedin')}
      >
        <div className="flex items-center space-x-2">
          <LinkedinIcon {...iconProps} />
          {showLabels && <span className="text-sm font-medium">LinkedIn</span>}
        </div>
      </LinkedinShareButton>
    ),

    whatsapp: (
      <WhatsappShareButton
        key="whatsapp"
        url={shareData.url}
        title={shareData.title}
        separator={shareData.separator}
        className={buttonClasses}
        onClick={() => trackShare('whatsapp')}
      >
        <div className="flex items-center space-x-2">
          <WhatsappIcon {...iconProps} />
          {showLabels && <span className="text-sm font-medium">WhatsApp</span>}
        </div>
      </WhatsappShareButton>
    ),

    telegram: (
      <TelegramShareButton
        key="telegram"
        url={shareData.url}
        title={shareData.title}
        className={buttonClasses}
        onClick={() => trackShare('telegram')}
      >
        <div className="flex items-center space-x-2">
          <TelegramIcon {...iconProps} />
          {showLabels && <span className="text-sm font-medium">Telegram</span>}
        </div>
      </TelegramShareButton>
    ),

    email: (
      <EmailShareButton
        key="email"
        url={shareData.url}
        subject={shareData.subject}
        body={shareData.body}
        separator={shareData.separator}
        className={buttonClasses}
        onClick={() => trackShare('email')}
      >
        <div className="flex items-center space-x-2">
          <EmailIcon {...iconProps} />
          {showLabels && <span className="text-sm font-medium">Email</span>}
        </div>
      </EmailShareButton>
    ),

    copy_link: (
      <CopyToClipboard
        key="copy_link"
        text={shareData.url}
        onCopy={handleCopyLink}
      >
        <button className={`${buttonClasses} cursor-pointer`}>
          <div className="flex items-center space-x-2">
            <div 
              className="flex items-center justify-center rounded-full"
              style={{ 
                width: iconSize, 
                height: iconSize, 
                backgroundColor: copied ? '#10b981' : '#6b7280' 
              }}
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-white" />
              ) : (
                <LinkIcon className="w-4 h-4 text-white" />
              )}
            </div>
            {showLabels && (
              <span className="text-sm font-medium">
                {copied ? 'Kopye!' : 'Kopye Lyen'}
              </span>
            )}
          </div>
        </button>
      </CopyToClipboard>
    )
  }

  return (
    <div className={containerClasses}>
      {platforms?.map(platform => platformComponents[platform]) || 
       Object.values(platformComponents)}
    </div>
  )
}

// Compact share button for floating or inline use
export function CompactShareButton({
  url,
  title,
  description,
  contentType,
  contentId,
  className = ''
}: Pick<SocialShareProps, 'url' | 'title' | 'description' | 'contentType' | 'contentId' | 'className'>) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <LinkIcon className="w-4 h-4" />
        <span>Pataje</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-lg shadow-lg border z-50 min-w-[280px]">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Pataje nan rezo sosyal yo
            </h4>
            <SocialShare
              url={url}
              title={title}
              description={description}
              contentType={contentType}
              contentId={contentId}
              orientation="vertical"
              showLabels={true}
              iconSize={24}
            />
          </div>
        </>
      )}
    </div>
  )
}

// Share modal for detailed sharing options
export function ShareModal({
  isOpen,
  onClose,
  url,
  title,
  description,
  contentType,
  contentId
}: {
  isOpen: boolean
  onClose: () => void
} & Pick<SocialShareProps, 'url' | 'title' | 'description' | 'contentType' | 'contentId'>) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div>
            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
              Pataje: {title}
            </h3>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Chwazi yon platfòm pou pataje kontni an:
              </p>
              
              <SocialShare
                url={url}
                title={title}
                description={description}
                contentType={contentType}
                contentId={contentId}
                orientation="vertical"
                showLabels={true}
                iconSize={32}
                className="space-y-3"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Lyen yo pataje:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={url}
                  readOnly
                  className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                />
                <CopyToClipboard text={url}>
                  <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                    Kopye
                  </button>
                </CopyToClipboard>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={onClose}
            >
              Fèmen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Utility function to get or create session ID
function getSessionId(): string {
  let sessionId = localStorage.getItem('tek_session_id')
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('tek_session_id', sessionId)
  }
  return sessionId
}

// Hook for programmatic sharing
export function useShare() {
  const supabase = useSupabaseClient()
  const { user } = useAuthStore()

  const trackShare = async (
    contentType: string,
    contentId: string,
    platform: string,
    url: string
  ) => {
    try {
      await supabase.functions.invoke('analytics-tracker', {
        body: {
          action: 'track_social_share',
          contentType,
          contentId,
          platform,
          userId: user?.id,
          sessionId: getSessionId(),
          sharedUrl: url
        }
      })
    } catch (error) {
      console.error('Failed to track social share:', error)
    }
  }

  const share = async (data: {
    url: string
    title: string
    description?: string
    contentType: string
    contentId: string
  }) => {
    // Use native sharing if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: data.url
        })
        await trackShare(data.contentType, data.contentId, 'native', data.url)
        return true
      } catch (error) {
        // User cancelled or sharing failed
        return false
      }
    }
    
    // Fallback to copying to clipboard
    try {
      await navigator.clipboard.writeText(data.url)
      toast.success('Lyen an kopye nan clipboard la!')
      await trackShare(data.contentType, data.contentId, 'copy_link', data.url)
      return true
    } catch (error) {
      toast.error('Pa t kapab kopye lyen an')
      return false
    }
  }

  return { share, trackShare }
}
