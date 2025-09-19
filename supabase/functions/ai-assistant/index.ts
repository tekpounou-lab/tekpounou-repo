import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple AI response generator with context awareness
class AIAssistant {
  private templates: Map<string, string> = new Map();
  
  constructor() {
    // Initialize with basic Creole responses
    this.templates.set('greeting', 'Bonjou! Mwen se asistan AI ou an. Ki jan mwen ka ede w jodi a?');
    this.templates.set('course_help', 'Mwen ka ede w ak kou yo w yo. Ou vle wè pwogre w yo oswa jwenn yon leson espesifik?');
    this.templates.set('event_info', 'Mwen wè gen kèk evenman yo k ap vini yo. Ou vle konnen plis detay sou youn nan yo?');
    this.templates.set('default', 'Mwen konprann kesyon ou an. Kite m chèche repons lan pou ou.');
  }

  async generateResponse(message: string, context: any, language: string = 'ht'): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Check for greetings
    if (this.isGreeting(lowerMessage)) {
      return this.getPersonalizedGreeting(context, language);
    }
    
    // Check for course-related queries
    if (this.isCourseQuery(lowerMessage)) {
      return this.getCourseResponse(context, language);
    }
    
    // Check for event queries
    if (this.isEventQuery(lowerMessage)) {
      return this.getEventResponse(context, language);
    }
    
    // Check for progress queries
    if (this.isProgressQuery(lowerMessage)) {
      return this.getProgressResponse(context, language);
    }
    
    // Check for service queries (for SMEs)
    if (this.isServiceQuery(lowerMessage)) {
      return this.getServiceResponse(context, language);
    }
    
    // Default response with context
    return this.getContextualResponse(message, context, language);
  }

  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'bonjou', 'alo', 'hey', 'salut', 'bonswa'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private isCourseQuery(message: string): boolean {
    const courseKeywords = ['course', 'kou', 'lesson', 'leson', 'learn', 'aprann', 'study', 'etidye'];
    return courseKeywords.some(keyword => message.includes(keyword));
  }

  private isEventQuery(message: string): boolean {
    const eventKeywords = ['event', 'evenman', 'activity', 'aktivite', 'meeting', 'reyinyon'];
    return eventKeywords.some(keyword => message.includes(keyword));
  }

  private isProgressQuery(message: string): boolean {
    const progressKeywords = ['progress', 'pwogre', 'grade', 'not', 'score', 'pwen', 'achievement', 'akonplisman'];
    return progressKeywords.some(keyword => message.includes(keyword));
  }

  private isServiceQuery(message: string): boolean {
    const serviceKeywords = ['service', 'sèvis', 'project', 'pwojè', 'consultation', 'konsèy'];
    return serviceKeywords.some(keyword => message.includes(keyword));
  }

  private getPersonalizedGreeting(context: any, language: string): string {
    const role = context.user_role || 'student';
    const name = context.full_name ? ` ${context.full_name.split(' ')[0]}` : '';
    
    switch (language) {
      case 'en':
        switch (role) {
          case 'teacher':
            return `Hello${name}! I'm your AI assistant for Tek Pou Nou. I can help you with analytics, student engagement, and course management. What do you need?`;
          case 'sme':
            return `Hello${name}! I can help you with services, projects, and business resources. How can I assist you today?`;
          default:
            return `Hello${name}! I'm your AI assistant. I can help with courses, progress tracking, and recommendations. What would you like to know?`;
        }
      case 'fr':
        switch (role) {
          case 'teacher':
            return `Bonjour${name}! Je suis votre assistant IA pour Tek Pou Nou. Je peux vous aider avec les analyses, l'engagement des étudiants et la gestion des cours. De quoi avez-vous besoin?`;
          case 'sme':
            return `Bonjour${name}! Je peux vous aider avec les services, projets et ressources d'entreprise. Comment puis-je vous assister aujourd'hui?`;
          default:
            return `Bonjour${name}! Je suis votre assistant IA. Je peux aider avec les cours, le suivi des progrès et les recommandations. Que voulez-vous savoir?`;
        }
      default: // Creole
        switch (role) {
          case 'teacher':
            return `Bonjou${name}! Mwen se asistan AI ou an pou Tek Pou Nou. Mwen ka ede w ak analitik yo, angajman elèv yo ak jesyon kou yo. Ki sa ou bezwen?`;
          case 'sme':
            return `Bonjou${name}! Mwen ka ede w ak sèvis yo, pwojè yo ak resous biznis yo. Ki jan mwen ka asiste w jodi a?`;
          default:
            return `Bonjou${name}! Mwen se asistan AI ou an. Mwen ka ede w ak kou yo, swiv pwogre w yo ak rekòmandasyon yo. Ki sa ou vle konnen?`;
        }
    }
  }

  private getCourseResponse(context: any, language: string): string {
    const recentCourses = context.recent_courses || [];
    const role = context.user_role || 'student';
    
    if (role === 'student' && recentCourses.length > 0) {
      const activeCourse = recentCourses[0];
      switch (language) {
        case 'en':
          return `I see you're enrolled in courses! Your current progress is ${activeCourse.progress || 0}%. Would you like to continue with your lessons or need help with specific topics?`;
        case 'fr':
          return `Je vois que vous êtes inscrit à des cours! Votre progression actuelle est de ${activeCourse.progress || 0}%. Voulez-vous continuer avec vos leçons ou avez-vous besoin d'aide sur des sujets spécifiques?`;
        default:
          return `Mwen wè w enskri nan kou yo! Pwogre w kounye a se ${activeCourse.progress || 0}%. Ou vle kontinye ak leson yo oswa ou bezwen èd ak sijè espesifik yo?`;
      }
    }
    
    switch (language) {
      case 'en':
        return `I can help you find courses, track your learning progress, or answer questions about course content. What specific help do you need?`;
      case 'fr':
        return `Je peux vous aider à trouver des cours, suivre vos progrès d'apprentissage, ou répondre à des questions sur le contenu des cours. Quelle aide spécifique avez-vous besoin?`;
      default:
        return `Mwen ka ede w jwenn kou yo, swiv pwogre w yo, oswa reponn kesyon yo sou materyèl kou yo. Ki èd espesifik ou bezwen?`;
    }
  }

  private getEventResponse(context: any, language: string): string {
    const recentEvents = context.recent_events || [];
    
    if (recentEvents.length > 0) {
      const upcomingEvent = recentEvents.find((e: any) => new Date(e.event_date) > new Date());
      if (upcomingEvent) {
        switch (language) {
          case 'en':
            return `I see there's an upcoming event: "${upcomingEvent.title}". Would you like more details or help with registration?`;
          case 'fr':
            return `Je vois qu'il y a un événement à venir: "${upcomingEvent.title}". Voulez-vous plus de détails ou de l'aide pour l'inscription?`;
          default:
            return `Mwen wè gen yon evenman k ap vini an: "${upcomingEvent.title}". Ou vle konnen plis detay oswa èd ak enskripsyon an?`;
        }
      }
    }
    
    switch (language) {
      case 'en':
        return `I can help you find events, workshops, and community activities. What type of event are you looking for?`;
      case 'fr':
        return `Je peux vous aider à trouver des événements, ateliers et activités communautaires. Quel type d'événement recherchez-vous?`;
      default:
        return `Mwen ka ede w jwenn evenman yo, atelye yo ak aktivite kominote yo. Ki kalite evenman w ap chèche?`;
    }
  }

  private getProgressResponse(context: any, language: string): string {
    const recentCourses = context.recent_courses || [];
    
    if (recentCourses.length > 0) {
      const totalProgress = recentCourses.reduce((sum: number, course: any) => sum + (course.progress || 0), 0);
      const avgProgress = Math.round(totalProgress / recentCourses.length);
      
      switch (language) {
        case 'en':
          return `Your average course progress is ${avgProgress}%. You're enrolled in ${recentCourses.length} course(s). Keep up the great work!`;
        case 'fr':
          return `Votre progression moyenne dans les cours est de ${avgProgress}%. Vous êtes inscrit à ${recentCourses.length} cours. Continuez le bon travail!`;
        default:
          return `Pwogre mwayèn ou nan kou yo se ${avgProgress}%. Ou enskri nan ${recentCourses.length} kou. Kontinye bon travay la!`;
      }
    }
    
    switch (language) {
      case 'en':
        return `I can help you track your learning progress, view completed lessons, and see your achievements. What would you like to check?`;
      case 'fr':
        return `Je peux vous aider à suivre vos progrès d'apprentissage, voir les leçons terminées et vos réalisations. Que voulez-vous vérifier?`;
      default:
        return `Mwen ka ede w swiv pwogre w yo, gade leson yo ou fini ak reyalisasyon ou yo. Ki sa ou vle tcheke?`;
    }
  }

  private getServiceResponse(context: any, language: string): string {
    switch (language) {
      case 'en':
        return `I can help you discover services, submit project requests, find resources, and connect with experts. What business need can I help you with?`;
      case 'fr':
        return `Je peux vous aider à découvrir des services, soumettre des demandes de projet, trouver des ressources et vous connecter avec des experts. Quel besoin d'affaires puis-je vous aider?`;
      default:
        return `Mwen ka ede w dekouvri sèvis yo, soumèt demann pwojè yo, jwenn resous yo ak konekte ak ekspè yo. Ki bezwen biznis mwen ka ede w ak li?`;
    }
  }

  private getContextualResponse(message: string, context: any, language: string): string {
    // This is where you could integrate with external AI APIs like OpenAI
    // For now, we'll provide contextual responses based on user role and history
    
    const role = context.user_role || 'student';
    
    switch (language) {
      case 'en':
        switch (role) {
          case 'teacher':
            return `As a teacher, I can help you with student analytics, course management, or engagement strategies. Could you be more specific about what you need?`;
          case 'sme':
            return `I understand you're looking for business assistance. I can help with services, project planning, or resource discovery. What specifically are you working on?`;
          default:
            return `I'm here to help with your learning journey. Could you tell me more about what you're looking for? I can assist with courses, events, or general questions.`;
        }
      case 'fr':
        switch (role) {
          case 'teacher':
            return `En tant qu'enseignant, je peux vous aider avec les analyses d'étudiants, la gestion de cours ou les stratégies d'engagement. Pourriez-vous être plus spécifique sur ce dont vous avez besoin?`;
          case 'sme':
            return `Je comprends que vous cherchez une assistance commerciale. Je peux aider avec les services, la planification de projet ou la découverte de ressources. Sur quoi travaillez-vous spécifiquement?`;
          default:
            return `Je suis là pour aider avec votre parcours d'apprentissage. Pourriez-vous me dire plus sur ce que vous cherchez? Je peux aider avec les cours, événements ou questions générales.`;
        }
      default: // Creole
        switch (role) {
          case 'teacher':
            return `Kòm pwofesè, mwen ka ede w ak analitik elèv yo, jesyon kou yo oswa estrateji angajman. Ou ka pi espesifik sou sa ou bezwen?`;
          case 'sme':
            return `Mwen konprann w ap chèche èd biznis. Mwen ka ede w ak sèvis yo, planifikasyon pwojè oswa dekouvèt resous. Ki sa espesifikman w ap travay sou li?`;
          default:
            return `Mwen la pou ede w ak vwayaj aprann ou an. Ou ka di m pi plis sou sa w ap chèche? Mwen ka asiste w ak kou yo, evenman yo oswa kesyon jeneral yo.`;
        }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, sessionId, language = 'ht' } = await req.json()
    
    // Get the authorization header
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user from JWT
    const jwt = authorization.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get user context
    const { data: contextData, error: contextError } = await supabase
      .rpc('get_user_context_for_ai', { user_uuid: user.id })
    
    if (contextError) {
      console.error('Context error:', contextError)
    }

    const context = contextData || {}

    // Check if AI is enabled for this user
    const { data: userPrefs } = await supabase
      .from('ai_user_preferences')
      .select('ai_enabled, preferred_language')
      .eq('user_id', user.id)
      .single()

    if (userPrefs && !userPrefs.ai_enabled) {
      return new Response(
        JSON.stringify({ 
          error: 'AI assistant is disabled for this user',
          message: language === 'en' ? 'AI assistant is currently disabled' : 
                  language === 'fr' ? 'L\'assistant IA est actuellement désactivé' :
                  'Asistan AI an pa aksesib kounye a'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Use user's preferred language if available
    const responseLanguage = userPrefs?.preferred_language || language

    // Generate AI response
    const aiAssistant = new AIAssistant()
    const response = await aiAssistant.generateResponse(message, context, responseLanguage)

    // Save conversation to database
    const { error: saveError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        role: 'user',
        message: message,
        response: response,
        context: context,
        language: responseLanguage
      })

    if (saveError) {
      console.error('Error saving conversation:', saveError)
    }

    return new Response(
      JSON.stringify({ 
        response,
        language: responseLanguage,
        context: {
          userRole: context.user_role,
          hasRecentCourses: (context.recent_courses || []).length > 0,
          hasUpcomingEvents: (context.recent_events || []).some((e: any) => new Date(e.event_date) > new Date())
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('AI Assistant Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: 'Padon, gen yon pwoblèm ak asistan AI an. Tanpri eseye ankò.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* To deploy this function:
1. Make sure you have the Supabase CLI installed
2. Run: supabase functions deploy ai-assistant
3. Set environment variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - Optionally: OPENAI_API_KEY for enhanced AI responses
*/