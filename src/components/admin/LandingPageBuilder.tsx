import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  ChartBarIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { motion, DragDropContext, Droppable, Draggable } from 'framer-motion'
import { useSupabaseClient } from '../providers/SupabaseProvider'
import { useAuthStore } from '../stores/authStore'
import { SEOHead, structuredDataGenerators } from '../common/SEOHead'
import { NewsletterSignup } from '../marketing/NewsletterSignup'
import { SocialShare } from '../common/SocialShare'

// Block types for landing page content
type BlockType = 'hero' | 'text' | 'image' | 'video' | 'testimonial' | 'features' | 'pricing' | 'cta' | 'newsletter' | 'social'

interface ContentBlock {
  id: string
  type: BlockType
  content: Record<string, any>
  order: number
}

const landingPageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image: z.string().url().optional().or(z.literal('')),
  cta_text: z.string().default('Get Started'),
  cta_link: z.string().optional(),
  template_type: z.enum(['course', 'service', 'general', 'coming_soon']),
  target_course_id: z.string().optional(),
  target_service_id: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft')
})

type LandingPageFormData = z.infer<typeof landingPageSchema>

export function LandingPageBuilder() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [landingPageId, setLandingPageId] = useState<string | null>(null)
  const [courses, setCourses] = useState([])
  const [services, setServices] = useState([])

  const supabase = useSupabaseClient()
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<LandingPageFormData>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: {
      template_type: 'general',
      status: 'draft',
      cta_text: 'Get Started'
    }
  })

  const templateType = watch('template_type')

  useEffect(() => {
    loadCourses()
    loadServices()
  }, [])

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('status', 'published')
        .order('title')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title')
        .eq('status', 'active')
        .order('title')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  const addBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: Math.random().toString(36).substring(2, 15),
      type,
      content: getDefaultContent(type),
      order: blocks.length
    }
    setBlocks([...blocks, newBlock])
  }

  const updateBlock = (id: string, content: Record<string, any>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, content } : block
    ))
  }

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id))
  }

  const reorderBlocks = (startIndex: number, endIndex: number) => {
    const result = Array.from(blocks)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    // Update order property
    const reorderedBlocks = result.map((block, index) => ({
      ...block,
      order: index
    }))

    setBlocks(reorderedBlocks)
  }

  const onSubmit = async (data: LandingPageFormData) => {
    if (!user) return

    setIsSaving(true)
    try {
      const landingPageData = {
        ...data,
        content: blocks,
        created_by: user.id,
        published_at: data.status === 'published' ? new Date().toISOString() : null
      }

      if (landingPageId) {
        // Update existing
        const { error } = await supabase
          .from('landing_pages')
          .update(landingPageData)
          .eq('id', landingPageId)

        if (error) throw error
        toast.success('Landing page updated!')
      } else {
        // Create new
        const { data: result, error } = await supabase
          .from('landing_pages')
          .insert([landingPageData])
          .select()
          .single()

        if (error) throw error
        setLandingPageId(result.id)
        toast.success('Landing page created!')
      }
    } catch (error: any) {
      console.error('Error saving landing page:', error)
      toast.error('Failed to save landing page')
    } finally {
      setIsSaving(false)
    }
  }

  const getDefaultContent = (type: BlockType): Record<string, any> => {
    switch (type) {
      case 'hero':
        return {
          title: 'Welcome to Our Platform',
          subtitle: 'Transform your future with technology education',
          background_image: '',
          cta_text: 'Get Started',
          cta_link: '#'
        }
      case 'text':
        return {
          content: 'Enter your text content here...'
        }
      case 'image':
        return {
          src: '',
          alt: 'Image description',
          caption: ''
        }
      case 'video':
        return {
          src: '',
          title: 'Video title',
          description: ''
        }
      case 'testimonial':
        return {
          quote: 'This platform changed my life!',
          author: 'John Doe',
          title: 'Student',
          avatar: ''
        }
      case 'features':
        return {
          title: 'Features',
          items: [
            { title: 'Feature 1', description: 'Description 1', icon: 'star' },
            { title: 'Feature 2', description: 'Description 2', icon: 'check' },
            { title: 'Feature 3', description: 'Description 3', icon: 'heart' }
          ]
        }
      case 'pricing':
        return {
          title: 'Pricing Plans',
          plans: [
            { name: 'Basic', price: 19, features: ['Feature 1', 'Feature 2'] },
            { name: 'Pro', price: 49, features: ['Feature 1', 'Feature 2', 'Feature 3'] }
          ]
        }
      case 'cta':
        return {
          title: 'Ready to get started?',
          description: 'Join thousands of students already learning',
          button_text: 'Sign Up Now',
          button_link: '/auth/register'
        }
      case 'newsletter':
        return {
          title: 'Stay Updated',
          description: 'Get the latest news and updates'
        }
      case 'social':
        return {
          title: 'Share this page',
          platforms: ['facebook', 'twitter', 'linkedin']
        }
      default:
        return {}
    }
  }

  if (isPreviewMode) {
    return <LandingPagePreview blocks={blocks} onBack={() => setIsPreviewMode(false)} />
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Landing Page Builder</h1>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setIsPreviewMode(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </button>
          <button
            type="submit"
            form="landing-page-form"
            disabled={isSaving}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Builder */}
        <div className="lg:col-span-2">
          <form id="landing-page-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Settings */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <input
                    {...register('slug')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    {...register('subtitle')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type
                  </label>
                  <select
                    {...register('template_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="course">Course</option>
                    <option value="service">Service</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {templateType === 'course' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Course
                    </label>
                    <select
                      {...register('target_course_id')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a course</option>
                      {courses.map((course: any) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {templateType === 'service' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Service
                    </label>
                    <select
                      {...register('target_service_id')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a service</option>
                      {services.map((service: any) => (
                        <option key={service.id} value={service.id}>
                          {service.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    {...register('meta_title')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    {...register('meta_description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open Graph Image URL
                  </label>
                  <input
                    {...register('og_image')}
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* CTA Settings */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Call to Action</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Text
                  </label>
                  <input
                    {...register('cta_text')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Link
                  </label>
                  <input
                    {...register('cta_link')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Content Blocks */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content Blocks</h3>
            
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return
              reorderBlocks(result.source.index, result.destination.index)
            }}>
              <Droppable droppableId="blocks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {blocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <BlockEditor
                              block={block}
                              onUpdate={(content) => updateBlock(block.id, content)}
                              onRemove={() => removeBlock(block.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {/* Block Library */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow border sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Blocks</h3>
            
            <div className="space-y-2">
              {[
                { type: 'hero' as BlockType, label: 'Hero Section', icon: CursorArrowRaysIcon },
                { type: 'text' as BlockType, label: 'Text Content', icon: DocumentTextIcon },
                { type: 'image' as BlockType, label: 'Image', icon: PhotoIcon },
                { type: 'video' as BlockType, label: 'Video', icon: VideoCameraIcon },
                { type: 'features' as BlockType, label: 'Features', icon: ChartBarIcon },
                { type: 'testimonial' as BlockType, label: 'Testimonial', icon: DocumentTextIcon },
                { type: 'pricing' as BlockType, label: 'Pricing', icon: CursorArrowRaysIcon },
                { type: 'cta' as BlockType, label: 'Call to Action', icon: CursorArrowRaysIcon },
                { type: 'newsletter' as BlockType, label: 'Newsletter', icon: DocumentTextIcon },
                { type: 'social' as BlockType, label: 'Social Share', icon: DocumentTextIcon }
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Block Editor Component
function BlockEditor({ 
  block, 
  onUpdate, 
  onRemove 
}: { 
  block: ContentBlock
  onUpdate: (content: Record<string, any>) => void
  onRemove: () => void
}) {
  const updateContent = (key: string, value: any) => {
    onUpdate({ ...block.content, [key]: value })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-gray-900 capitalize">
          {block.type.replace('_', ' ')} Block
        </h4>
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Block-specific editors */}
      {block.type === 'hero' && (
        <div className="space-y-3">
          <input
            type="text"
            value={block.content.title || ''}
            onChange={(e) => updateContent('title', e.target.value)}
            placeholder="Hero title"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
          <input
            type="text"
            value={block.content.subtitle || ''}
            onChange={(e) => updateContent('subtitle', e.target.value)}
            placeholder="Hero subtitle"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
          <input
            type="url"
            value={block.content.background_image || ''}
            onChange={(e) => updateContent('background_image', e.target.value)}
            placeholder="Background image URL"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
        </div>
      )}

      {block.type === 'text' && (
        <textarea
          value={block.content.content || ''}
          onChange={(e) => updateContent('content', e.target.value)}
          placeholder="Enter your text content"
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
        />
      )}

      {block.type === 'image' && (
        <div className="space-y-3">
          <input
            type="url"
            value={block.content.src || ''}
            onChange={(e) => updateContent('src', e.target.value)}
            placeholder="Image URL"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
          <input
            type="text"
            value={block.content.alt || ''}
            onChange={(e) => updateContent('alt', e.target.value)}
            placeholder="Alt text"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
        </div>
      )}

      {/* Add more block type editors as needed */}
    </div>
  )
}

// Landing Page Preview Component
function LandingPagePreview({ 
  blocks, 
  onBack 
}: { 
  blocks: ContentBlock[]
  onBack: () => void 
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back to Editor
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {blocks
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
      </div>
    </div>
  )
}

// Block Renderer Component
function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'hero':
      return (
        <section 
          className="relative bg-blue-600 text-white py-20"
          style={{
            backgroundImage: block.content.background_image 
              ? `url(${block.content.background_image})` 
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-4">{block.content.title}</h1>
            <p className="text-xl mb-8">{block.content.subtitle}</p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              {block.content.cta_text || 'Get Started'}
            </button>
          </div>
        </section>
      )

    case 'text':
      return (
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <div dangerouslySetInnerHTML={{ __html: block.content.content || '' }} />
          </div>
        </section>
      )

    case 'image':
      return (
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            {block.content.src && (
              <img
                src={block.content.src}
                alt={block.content.alt || ''}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            )}
            {block.content.caption && (
              <p className="text-center text-gray-600 mt-4">{block.content.caption}</p>
            )}
          </div>
        </section>
      )

    case 'newsletter':
      return (
        <section className="py-12 px-6 bg-gray-100">
          <div className="max-w-2xl mx-auto">
            <NewsletterSignup
              title={block.content.title}
              description={block.content.description}
              source="landing_page"
              variant="inline"
              showName={true}
            />
          </div>
        </section>
      )

    case 'social':
      return (
        <section className="py-12 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-lg font-medium mb-6">{block.content.title}</h3>
            <SocialShare
              url={window.location.href}
              title="Check out this amazing landing page!"
              description="Learn more about our platform"
              contentType="landing_page"
              contentId="preview"
              platforms={block.content.platforms}
              showLabels={true}
              iconSize={32}
            />
          </div>
        </section>
      )

    default:
      return (
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto text-center text-gray-500">
            Block type "{block.type}" not implemented yet
          </div>
        </section>
      )
  }
}
