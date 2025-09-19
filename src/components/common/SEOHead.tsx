import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

export interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile' | 'book' | 'music.song' | 'video.movie'
  article?: {
    author?: string
    publishedTime?: string
    modifiedTime?: string
    section?: string
    tags?: string[]
  }
  structuredData?: Record<string, any>
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
}

interface DefaultSEOConfig {
  siteName: string
  defaultTitle: string
  defaultDescription: string
  defaultImage: string
  defaultKeywords: string[]
  siteUrl: string
  twitterHandle: string
  facebookAppId?: string
  locale: string
  alternateLocales: string[]
}

const defaultConfig: DefaultSEOConfig = {
  siteName: 'Tek Pou Nou',
  defaultTitle: 'Tek Pou Nou - Technology for Us | Haitian Educational Platform',
  defaultDescription: 'Platform edikasyonèl pou kominote Ayisyen an. Aprann teknoloji ak kou yo, blòg ak sètifika yo. Educational platform for the Haitian community with technology courses, blog and certifications.',
  defaultImage: 'https://tekpounou.com/images/og-default.jpg',
  defaultKeywords: [
    'Haiti', 'Haitian', 'Kreyòl', 'Creole', 'technology', 'education', 
    'courses', 'learning', 'development', 'programming', 'tech', 'training',
    'edikasyon', 'teknoloji', 'fòmasyon', 'pwogram'
  ],
  siteUrl: 'https://tekpounou.com',
  twitterHandle: '@TekPouNou',
  facebookAppId: undefined,
  locale: 'ht_HT',
  alternateLocales: ['en_US', 'fr_FR']
}

export function SEOHead({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  article,
  structuredData,
  canonical,
  noindex = false,
  nofollow = false
}: SEOProps) {
  const location = useLocation()
  
  const seoTitle = title 
    ? `${title} | ${defaultConfig.siteName}`
    : defaultConfig.defaultTitle

  const seoDescription = description || defaultConfig.defaultDescription
  const seoImage = image || defaultConfig.defaultImage
  const seoUrl = url || `${defaultConfig.siteUrl}${location.pathname}`
  const seoKeywords = [...defaultConfig.defaultKeywords, ...keywords].join(', ')
  const canonicalUrl = canonical || seoUrl

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ')

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:site_name" content={defaultConfig.siteName} />
      <meta property="og:locale" content={defaultConfig.locale} />
      {defaultConfig.alternateLocales.map(locale => (
        <meta key={locale} property="og:locale:alternate" content={locale} />
      ))}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={defaultConfig.twitterHandle} />
      <meta name="twitter:creator" content={defaultConfig.twitterHandle} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* Facebook App ID */}
      {defaultConfig.facebookAppId && (
        <meta property="fb:app_id" content={defaultConfig.facebookAppId} />
      )}

      {/* Article specific tags */}
      {type === 'article' && article && (
        <>
          {article.author && <meta property="article:author" content={article.author} />}
          {article.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags?.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Additional meta tags for mobile and PWA */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="theme-color" content="#1e40af" />
      <meta name="msapplication-TileColor" content="#1e40af" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={defaultConfig.siteName} />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />

      {/* Favicon and app icons */}
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Helmet>
  )
}

// Hook for dynamic SEO updates
export function useSEO() {
  const location = useLocation()

  const updateSEO = React.useCallback((seoProps: SEOProps) => {
    // This could be extended to update a global SEO store
    // For now, it just returns the props for use with SEOHead
    return seoProps
  }, [location])

  return { updateSEO }
}

// Utility functions for generating structured data
export const structuredDataGenerators = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tek Pou Nou",
    "description": "Platform edikasyonèl pou kominote Ayisyen an",
    "url": "https://tekpounou.com",
    "logo": "https://tekpounou.com/images/logo.png",
    "foundingDate": "2024",
    "sameAs": [
      "https://twitter.com/TekPouNou",
      "https://facebook.com/TekPouNou",
      "https://linkedin.com/company/tekpounou"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "contact@tekpounou.com"
    }
  },

  course: (course: {
    id: string
    title: string
    description: string
    instructor: string
    price?: number
    duration?: string
    level?: string
    image?: string
  }) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "Tek Pou Nou"
    },
    "instructor": {
      "@type": "Person",
      "name": course.instructor
    },
    "url": `https://tekpounou.com/courses/${course.id}`,
    ...(course.price && {
      "offers": {
        "@type": "Offer",
        "price": course.price,
        "priceCurrency": "USD"
      }
    }),
    ...(course.image && { "image": course.image }),
    ...(course.duration && { "timeRequired": course.duration }),
    ...(course.level && { "educationalLevel": course.level })
  }),

  blogPost: (post: {
    id: string
    title: string
    excerpt: string
    author: string
    publishedAt: string
    image?: string
    tags?: string[]
  }) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Tek Pou Nou",
      "logo": {
        "@type": "ImageObject",
        "url": "https://tekpounou.com/images/logo.png"
      }
    },
    "datePublished": post.publishedAt,
    "url": `https://tekpounou.com/blog/${post.id}`,
    ...(post.image && { "image": post.image }),
    ...(post.tags && { "keywords": post.tags.join(', ') })
  }),

  service: (service: {
    id: string
    title: string
    description: string
    price?: number
    provider: string
  }) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "description": service.description,
    "provider": {
      "@type": "Organization",
      "name": service.provider
    },
    "url": `https://tekpounou.com/services/${service.id}`,
    ...(service.price && {
      "offers": {
        "@type": "Offer",
        "price": service.price,
        "priceCurrency": "USD"
      }
    })
  }),

  faq: (faqs: { question: string; answer: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }),

  breadcrumb: (items: { name: string; url: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  })
}

// Default SEO configurations for different page types
export const defaultSEOConfigs = {
  home: {
    title: 'Tek Pou Nou - Technology for Us | Haitian Educational Platform',
    description: 'Platform edikasyonèl pou kominote Ayisyen an. Aprann teknoloji ak kou yo, blòg ak sètifika yo. Learn technology with courses, blog and certifications for the Haitian community.',
    keywords: ['haiti', 'education', 'technology', 'kreyòl', 'courses', 'training'],
    structuredData: structuredDataGenerators.organization
  },
  
  courses: {
    title: 'Kou Teknoloji yo - Technology Courses',
    description: 'Jwenn kou teknoloji yo nan Kreyòl ak Angle. Programming, web development, ak plis ankò. Find technology courses in Creole and English.',
    keywords: ['courses', 'programming', 'web development', 'technology training', 'kou']
  },
  
  blog: {
    title: 'Blòg - Tech Blog ak Nouvo yo',
    description: 'Li dènye atik yo sou teknoloji, pwogrammi ak devlopman. Read latest articles on technology, programming and development.',
    keywords: ['blog', 'tech news', 'programming articles', 'technology tips', 'atik']
  },
  
  services: {
    title: 'Sèvis yo - Services ak Konsèy',
    description: 'Jwenn sèvis ak konsèy pou pwojè teknoloji ou yo. Get services and consulting for your technology projects.',
    keywords: ['services', 'consulting', 'web development', 'tech support', 'sèvis']
  },
  
  about: {
    title: 'Konsènen Nou - About Tek Pou Nou',
    description: 'Misyon nou se pou nou bay edikasyon teknoloji bay kominote Ayisyen an. Our mission is to provide technology education to the Haitian community.',
    keywords: ['about', 'mission', 'haitian community', 'technology education', 'konsènen']
  }
}
