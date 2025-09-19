import { createWriteStream } from 'fs'
import { SitemapStream, streamToPromise } from 'sitemap'
import { createClient } from '@supabase/supabase-js'

interface SitemapEntry {
  url: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  lastmod?: string
  img?: Array<{
    url: string
    caption?: string
    title?: string
  }>
  news?: {
    publication: {
      name: string
      language: string
    }
    genres?: string
    publication_date: string
    title: string
    keywords?: string
  }
}

class SitemapGenerator {
  private supabaseUrl: string
  private supabaseKey: string
  private baseUrl: string

  constructor(supabaseUrl: string, supabaseKey: string, baseUrl: string = 'https://tekpounou.com') {
    this.supabaseUrl = supabaseUrl
    this.supabaseKey = supabaseKey
    this.baseUrl = baseUrl
  }

  async generateSitemap(): Promise<string> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey)
    const sitemap = new SitemapStream({ hostname: this.baseUrl })

    try {
      // Add static pages
      this.addStaticPages(sitemap)

      // Add dynamic pages from database
      await this.addCourses(supabase, sitemap)
      await this.addBlogPosts(supabase, sitemap)
      await this.addServices(supabase, sitemap)
      await this.addLandingPages(supabase, sitemap)

      sitemap.end()
      return (await streamToPromise(sitemap)).toString()
    } catch (error) {
      console.error('Error generating sitemap:', error)
      throw error
    }
  }

  private addStaticPages(sitemap: SitemapStream) {
    const staticPages: SitemapEntry[] = [
      {
        url: '/',
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString()
      },
      {
        url: '/courses',
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString()
      },
      {
        url: '/blog',
        changefreq: 'daily',
        priority: 0.8,
        lastmod: new Date().toISOString()
      },
      {
        url: '/services',
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString()
      },
      {
        url: '/about',
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: new Date().toISOString()
      },
      {
        url: '/contact',
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: new Date().toISOString()
      },
      {
        url: '/auth/login',
        changefreq: 'monthly',
        priority: 0.5
      },
      {
        url: '/auth/register',
        changefreq: 'monthly',
        priority: 0.5
      },
      {
        url: '/pricing',
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: new Date().toISOString()
      },
      {
        url: '/newsletter/unsubscribe',
        changefreq: 'never',
        priority: 0.1
      }
    ]

    staticPages.forEach(page => sitemap.write(page))
  }

  private async addCourses(supabase: any, sitemap: SitemapStream) {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, updated_at, created_at, thumbnail_url')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })

      if (error) throw error

      courses?.forEach((course: any) => {
        const entry: SitemapEntry = {
          url: `/courses/${course.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: course.updated_at || course.created_at
        }

        if (course.thumbnail_url) {
          entry.img = [{
            url: course.thumbnail_url,
            title: course.title,
            caption: `${course.title} - Tek Pou Nou Course`
          }]
        }

        sitemap.write(entry)
      })
    } catch (error) {
      console.error('Error adding courses to sitemap:', error)
    }
  }

  private async addBlogPosts(supabase: any, sitemap: SitemapStream) {
    try {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, title, updated_at, published_at, featured_image, excerpt, author, tags')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (error) throw error

      posts?.forEach((post: any) => {
        const entry: SitemapEntry = {
          url: `/blog/${post.id}`,
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: post.updated_at || post.published_at
        }

        if (post.featured_image) {
          entry.img = [{
            url: post.featured_image,
            title: post.title,
            caption: post.excerpt?.substring(0, 100) || post.title
          }]
        }

        // Add news metadata for recent posts (within 3 days)
        const publishDate = new Date(post.published_at)
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        
        if (publishDate > threeDaysAgo) {
          entry.news = {
            publication: {
              name: 'Tek Pou Nou',
              language: 'ht'
            },
            publication_date: post.published_at,
            title: post.title,
            keywords: post.tags?.join(', ') || 'technology, haiti, education'
          }
        }

        sitemap.write(entry)
      })
    } catch (error) {
      console.error('Error adding blog posts to sitemap:', error)
    }
  }

  private async addServices(supabase: any, sitemap: SitemapStream) {
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select('id, title, updated_at, created_at, thumbnail_url')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })

      if (error) throw error

      services?.forEach((service: any) => {
        const entry: SitemapEntry = {
          url: `/services/${service.id}`,
          changefreq: 'monthly',
          priority: 0.6,
          lastmod: service.updated_at || service.created_at
        }

        if (service.thumbnail_url) {
          entry.img = [{
            url: service.thumbnail_url,
            title: service.title,
            caption: `${service.title} - Tek Pou Nou Service`
          }]
        }

        sitemap.write(entry)
      })
    } catch (error) {
      console.error('Error adding services to sitemap:', error)
    }
  }

  private async addLandingPages(supabase: any, sitemap: SitemapStream) {
    try {
      const { data: pages, error } = await supabase
        .from('landing_pages')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })

      if (error) throw error

      pages?.forEach((page: any) => {
        sitemap.write({
          url: `/landing/${page.slug}`,
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: page.updated_at || page.published_at
        })
      })
    } catch (error) {
      console.error('Error adding landing pages to sitemap:', error)
    }
  }

  async generateRobotsTxt(): Promise<string> {
    const robotsContent = `# Robots.txt for Tek Pou Nou
# Generated on ${new Date().toISOString()}

User-agent: *
Allow: /

# Allow important pages
Allow: /courses
Allow: /blog
Allow: /services
Allow: /about
Allow: /contact
Allow: /pricing

# Disallow admin and private areas
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /auth/
Disallow: /profile/
Disallow: /*?*utm_*
Disallow: /*?*ref=*

# Disallow search and filter URLs to avoid duplicate content
Disallow: /courses?*
Disallow: /blog?*
Disallow: /services?*

# Allow crawling of static assets
Allow: /images/
Allow: /assets/
Allow: /*.css
Allow: /*.js
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.gif
Allow: /*.webp
Allow: /*.svg

# Sitemap location
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay for politeness
Crawl-delay: 1
`

    return robotsContent
  }

  async generateSitemapIndex(): Promise<string> {
    const sitemapIndexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${this.baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemap-images.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemap-news.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`

    return sitemapIndexContent
  }

  async generateImageSitemap(): Promise<string> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey)
    
    try {
      // Get all images from courses, blog posts, and services
      const [courses, blogPosts, services] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, thumbnail_url, updated_at')
          .eq('status', 'published')
          .not('thumbnail_url', 'is', null),
        
        supabase
          .from('blog_posts')
          .select('id, title, featured_image, updated_at')
          .eq('status', 'published')
          .not('featured_image', 'is', null),
        
        supabase
          .from('services')
          .select('id, title, thumbnail_url, updated_at')
          .eq('status', 'active')
          .not('thumbnail_url', 'is', null)
      ])

      let imageSitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`

      // Add course images
      courses.data?.forEach(course => {
        imageSitemapContent += `  <url>
    <loc>${this.baseUrl}/courses/${course.id}</loc>
    <lastmod>${course.updated_at}</lastmod>
    <image:image>
      <image:loc>${course.thumbnail_url}</image:loc>
      <image:title>${this.escapeXml(course.title)}</image:title>
      <image:caption>${this.escapeXml(course.title)} - Kou teknoloji nan Tek Pou Nou</image:caption>
    </image:image>
  </url>
`
      })

      // Add blog post images
      blogPosts.data?.forEach(post => {
        imageSitemapContent += `  <url>
    <loc>${this.baseUrl}/blog/${post.id}</loc>
    <lastmod>${post.updated_at}</lastmod>
    <image:image>
      <image:loc>${post.featured_image}</image:loc>
      <image:title>${this.escapeXml(post.title)}</image:title>
      <image:caption>${this.escapeXml(post.title)} - Atik nan Tek Pou Nou</image:caption>
    </image:image>
  </url>
`
      })

      // Add service images
      services.data?.forEach(service => {
        imageSitemapContent += `  <url>
    <loc>${this.baseUrl}/services/${service.id}</loc>
    <lastmod>${service.updated_at}</lastmod>
    <image:image>
      <image:loc>${service.thumbnail_url}</image:loc>
      <image:title>${this.escapeXml(service.title)}</image:title>
      <image:caption>${this.escapeXml(service.title)} - Sèvis nan Tek Pou Nou</image:caption>
    </image:image>
  </url>
`
      })

      imageSitemapContent += '</urlset>'
      return imageSitemapContent

    } catch (error) {
      console.error('Error generating image sitemap:', error)
      throw error
    }
  }

  async generateNewsSitemap(): Promise<string> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey)
    
    try {
      // Get recent blog posts (within last 2 days for news sitemap)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      
      const { data: recentPosts, error } = await supabase
        .from('blog_posts')
        .select('id, title, published_at, excerpt, author, tags')
        .eq('status', 'published')
        .gte('published_at', twoDaysAgo)
        .order('published_at', { ascending: false })

      if (error) throw error

      let newsSitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`

      recentPosts?.forEach(post => {
        newsSitemapContent += `  <url>
    <loc>${this.baseUrl}/blog/${post.id}</loc>
    <news:news>
      <news:publication>
        <news:name>Tek Pou Nou</news:name>
        <news:language>ht</news:language>
      </news:publication>
      <news:publication_date>${post.published_at}</news:publication_date>
      <news:title>${this.escapeXml(post.title)}</news:title>
      <news:keywords>${post.tags?.join(', ') || 'technology, haiti, education'}</news:keywords>
    </news:news>
  </url>
`
      })

      newsSitemapContent += '</urlset>'
      return newsSitemapContent

    } catch (error) {
      console.error('Error generating news sitemap:', error)
      throw error
    }
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case '&': return '&amp;'
        case '\'': return '&apos;'
        case '"': return '&quot;'
        default: return c
      }
    })
  }
}

// Export function for Netlify build
export async function generateSitemapFiles() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration for sitemap generation')
    return
  }

  const generator = new SitemapGenerator(supabaseUrl, supabaseKey)

  try {
    // Generate main sitemap
    const sitemap = await generator.generateSitemap()
    const fs = await import('fs')
    fs.writeFileSync('./dist/sitemap.xml', sitemap)

    // Generate robots.txt
    const robots = await generator.generateRobotsTxt()
    fs.writeFileSync('./dist/robots.txt', robots)

    // Generate sitemap index
    const sitemapIndex = await generator.generateSitemapIndex()
    fs.writeFileSync('./dist/sitemap-index.xml', sitemapIndex)

    // Generate image sitemap
    const imageSitemap = await generator.generateImageSitemap()
    fs.writeFileSync('./dist/sitemap-images.xml', imageSitemap)

    // Generate news sitemap
    const newsSitemap = await generator.generateNewsSitemap()
    fs.writeFileSync('./dist/sitemap-news.xml', newsSitemap)

    console.log('✅ Sitemap files generated successfully')
  } catch (error) {
    console.error('❌ Error generating sitemap files:', error)
    throw error
  }
}

export default SitemapGenerator
