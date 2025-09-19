import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced AI Assistant with personalization and advanced features
class EnhancedAIAssistant {
  private templates: Map<string, string> = new Map();
  private openaiApiKey: string;
  
  constructor() {
    this.openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Multi-language templates for different user roles and scenarios
    this.templates.set('student_greeting_ht', 'Bonjou! Mwen se asistan AI ou an ki gen ekspètiz nan edikasyon. Mwen ka ede w ak kou yo, pwogre w yo, ak rekòmandasyon pèsonèl yo. Ki sa ou vle konnen?');
    this.templates.set('student_greeting_en', 'Hello! I\'m your educational AI assistant. I can help you with courses, track your progress, and provide personalized recommendations. What would you like to know?');
    this.templates.set('student_greeting_fr', 'Bonjour! Je suis votre assistant IA éducatif. Je peux vous aider avec les cours, suivre vos progrès et fournir des recommandations personnalisées. Que voulez-vous savoir?');
    
    this.templates.set('teacher_greeting_ht', 'Bonjou Pwofesè! Mwen se asistan AI ou an ki ka ede w ak analitik elèv yo, estrateji angajman, ak jesyon kou yo. Ki sa ou bezwen konnen?');
    this.templates.set('teacher_greeting_en', 'Hello Teacher! I\'m your AI assistant specializing in student analytics, engagement strategies, and course management. What do you need help with?');
    this.templates.set('teacher_greeting_fr', 'Bonjour Professeur! Je suis votre assistant IA spécialisé dans les analyses d\'étudiants, les stratégies d\'engagement et la gestion des cours. De quoi avez-vous besoin?');
    
    this.templates.set('sme_greeting_ht', 'Bonjou! Mwen se asistan AI ou an pou biznis ak pwojè yo. Mwen ka ede w ak sèvis yo, nouvo pwojè yo, ak konsèy estratejik yo. Ki jan mwen ka asiste w?');
    this.templates.set('sme_greeting_en', 'Hello! I\'m your business AI assistant for projects and services. I can help with service discovery, new projects, and strategic advice. How can I assist you?');
    this.templates.set('sme_greeting_fr', 'Bonjour! Je suis votre assistant IA d\'affaires pour les projets et services. Je peux aider avec la découverte de services, nouveaux projets et conseils stratégiques. Comment puis-je vous aider?');
  }

  async generatePersonalizedResponse(
    message: string, 
    context: any, 
    language: string = 'ht',
    supabase: any
  ): Promise<string> {
    const lowerMessage = message.toLowerCase();
    const userRole = context.user_role || 'student';
    
    // Check for specific AI feature requests
    if (this.isPersonalizationRequest(lowerMessage)) {
      return await this.handlePersonalizationRequest(message, context, language, supabase);
    }
    
    if (this.isRecommendationRequest(lowerMessage)) {
      return await this.handleRecommendationRequest(message, context, language, supabase);
    }
    
    if (this.isAnalyticsRequest(lowerMessage)) {
      return await this.handleAnalyticsRequest(message, context, language, supabase);
    }
    
    if (this.isVoiceCommand(lowerMessage)) {
      return await this.handleVoiceCommand(message, context, language, supabase);
    }
    
    // Check for greetings
    if (this.isGreeting(lowerMessage)) {
      return this.getPersonalizedGreeting(context, language);
    }
    
    // Enhanced content-specific responses
    if (this.isCourseQuery(lowerMessage)) {
      return await this.getEnhancedCourseResponse(context, language, supabase);
    }
    
    if (this.isProgressQuery(lowerMessage)) {
      return await this.getEnhancedProgressResponse(context, language, supabase);
    }
    
    // Use OpenAI for complex queries if available
    if (this.openaiApiKey && message.length > 20) {
      try {
        return await this.generateOpenAIResponse(message, context, language);
      } catch (error) {
        console.error('OpenAI API error:', error);
        // Fallback to template-based response
      }
    }
    
    // Default contextual response
    return this.getContextualResponse(message, context, language);
  }

  private isPersonalizationRequest(message: string): boolean {
    const keywords = ['personalize', 'pèsonalize', 'personnaliser', 'customize', 'kustomize', 'learning path', 'wout aprann', 'parcours'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isRecommendationRequest(message: string): boolean {
    const keywords = ['recommend', 'rekòmande', 'recommander', 'suggest', 'sijere', 'suggérer', 'advice', 'konsèy'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isAnalyticsRequest(message: string): boolean {
    const keywords = ['analytics', 'analitik', 'analytiques', 'stats', 'statistics', 'data', 'done', 'données', 'performance', 'pèfòmans'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isVoiceCommand(message: string): boolean {
    const keywords = ['voice', 'vwa', 'voix', 'speak', 'pale', 'parler', 'listen', 'koute', 'écouter'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'bonjou', 'alo', 'hey', 'salut', 'bonswa'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private isCourseQuery(message: string): boolean {
    const courseKeywords = ['course', 'kou', 'lesson', 'leson', 'learn', 'aprann', 'study', 'etidye', 'formation'];
    return courseKeywords.some(keyword => message.includes(keyword));
  }

  private isProgressQuery(message: string): boolean {
    const progressKeywords = ['progress', 'pwogre', 'progrès', 'grade', 'not', 'score', 'pwen', 'achievement', 'akonplisman', 'réussite'];
    return progressKeywords.some(keyword => message.includes(keyword));
  }

  private async handlePersonalizationRequest(
    message: string, 
    context: any, 
    language: string, 
    supabase: any
  ): Promise<string> {
    try {
      // Generate or get learning path
      const { data: learningPath, error } = await supabase
        .rpc('generate_personalized_learning_path', { user_uuid: context.user_id });

      if (error) throw error;

      const responses = {
        ht: `Mwen kreye yon wout aprann espesyal pou ou! Wout la gen kèk kou ak aktivite ki adapte ak nivo w yo ak enterè w yo. Ou ka kòmanse ak kou ki pi enpòtan yo ak swiv pwogre w yo. Eske ou vle wè detay yo?`,
        en: `I've created a personalized learning path for you! The path includes courses and activities tailored to your skill level and interests. You can start with the most relevant courses and track your progress. Would you like to see the details?`,
        fr: `J'ai créé un parcours d'apprentissage personnalisé pour vous! Le parcours comprend des cours et activités adaptés à votre niveau et intérêts. Vous pouvez commencer par les cours les plus pertinents et suivre vos progrès. Voulez-vous voir les détails?`
      };

      return responses[language] || responses.en;
    } catch (error) {
      console.error('Error handling personalization request:', error);
      return this.getErrorResponse(language);
    }
  }

  private async handleRecommendationRequest(
    message: string, 
    context: any, 
    language: string, 
    supabase: any
  ): Promise<string> {
    try {
      // Get content recommendations
      const { data: recommendations, error } = await supabase
        .rpc('generate_content_recommendations', { 
          user_uuid: context.user_id, 
          content_type: 'course' 
        });

      if (error) throw error;

      if (recommendations && recommendations.length > 0) {
        const topRec = recommendations[0];
        const responses = {
          ht: `Men kèk rekòmandasyon ki bon pou ou: "${topRec.content_title}" ak ${Math.round(topRec.relevance_score * 100)}% konpatibilite. ${topRec.recommendation_reason}. Eske ou vle wè plis rekòmandasyon yo?`,
          en: `Here are some great recommendations for you: "${topRec.content_title}" with ${Math.round(topRec.relevance_score * 100)}% compatibility. ${topRec.recommendation_reason}. Would you like to see more recommendations?`,
          fr: `Voici d'excellentes recommandations pour vous: "${topRec.content_title}" avec ${Math.round(topRec.relevance_score * 100)}% de compatibilité. ${topRec.recommendation_reason}. Voulez-vous voir plus de recommandations?`
        };

        return responses[language] || responses.en;
      } else {
        const responses = {
          ht: `Mwen pa jwenn rekòmandasyon espesyal yo kounye a, men mwen ap kontinye aprann ak ou. Eseye di m ki sa ou enterese ak li oswa ki kou ou vle pran.`,
          en: `I don't have specific recommendations right now, but I'm learning with you. Try telling me what you're interested in or what courses you'd like to take.`,
          fr: `Je n'ai pas de recommandations spécifiques maintenant, mais j'apprends avec vous. Essayez de me dire ce qui vous intéresse ou quels cours vous aimeriez suivre.`
        };

        return responses[language] || responses.en;
      }
    } catch (error) {
      console.error('Error handling recommendation request:', error);
      return this.getErrorResponse(language);
    }
  }

  private async handleAnalyticsRequest(
    message: string, 
    context: any, 
    language: string, 
    supabase: any
  ): Promise<string> {
    try {
      const userRole = context.user_role;
      
      if (userRole === 'teacher') {
        const { data: insights, error } = await supabase
          .rpc('get_teacher_ai_insights', { teacher_uuid: context.user_id });

        if (error) throw error;

        const studentCount = insights?.student_performance?.length || 0;
        const avgProgress = insights?.student_performance?.reduce((sum: number, course: any) => 
          sum + (course.avg_progress || 0), 0) / studentCount || 0;

        const responses = {
          ht: `Men analitik yo pou kou w yo: Ou gen ${studentCount} kou ak yon pwogre mwayèn ${Math.round(avgProgress)}%. ${insights?.recommendations?.[0]?.suggestion || 'Kontinye bon travay la!'}`,
          en: `Here are analytics for your courses: You have ${studentCount} courses with an average progress of ${Math.round(avgProgress)}%. ${insights?.recommendations?.[0]?.suggestion || 'Keep up the good work!'}`,
          fr: `Voici les analyses pour vos cours: Vous avez ${studentCount} cours avec un progrès moyen de ${Math.round(avgProgress)}%. ${insights?.recommendations?.[0]?.suggestion || 'Continuez le bon travail!'}`
        };

        return responses[language] || responses.en;
      } else if (userRole === 'sme') {
        const { data: guidance, error } = await supabase
          .rpc('get_sme_ai_guidance', { sme_uuid: context.user_id });

        if (error) throw error;

        const topOpportunity = guidance?.business_opportunities?.[0];
        const responses = {
          ht: `Men analitik biznis ou yo: ${topOpportunity ? `"${topOpportunity.service_category}" gen pi gwo demand ak ${topOpportunity.demand_level} demand yo.` : 'Pa gen done biznis yo disponib kounye a.'} ${guidance?.recommendations?.[0]?.suggestion || ''}`,
          en: `Here are your business analytics: ${topOpportunity ? `"${topOpportunity.service_category}" has the highest demand with ${topOpportunity.demand_level} requests.` : 'No business data available right now.'} ${guidance?.recommendations?.[0]?.suggestion || ''}`,
          fr: `Voici vos analyses d'affaires: ${topOpportunity ? `"${topOpportunity.service_category}" a la plus forte demande avec ${topOpportunity.demand_level} demandes.` : 'Aucune donnée d\'affaires disponible actuellement.'} ${guidance?.recommendations?.[0]?.suggestion || ''}`
        };

        return responses[language] || responses.en;
      } else {
        // Student analytics
        const recentCourses = context.recent_courses || [];
        const avgProgress = recentCourses.reduce((sum: number, course: any) => 
          sum + (course.progress || 0), 0) / recentCourses.length || 0;

        const responses = {
          ht: `Men analitik aprann ou yo: Ou gen ${recentCourses.length} kou ak yon pwogre mwayèn ${Math.round(avgProgress)}%. ${avgProgress > 70 ? 'Ou ap fè byen!' : 'Ou ka amelyore pwogre w yo.'}`,
          en: `Here are your learning analytics: You have ${recentCourses.length} courses with an average progress of ${Math.round(avgProgress)}%. ${avgProgress > 70 ? 'You\'re doing great!' : 'You can improve your progress.'}`,
          fr: `Voici vos analyses d'apprentissage: Vous avez ${recentCourses.length} cours avec un progrès moyen de ${Math.round(avgProgress)}%. ${avgProgress > 70 ? 'Vous vous débrouillez bien!' : 'Vous pouvez améliorer vos progrès.'}`
        };

        return responses[language] || responses.en;
      }
    } catch (error) {
      console.error('Error handling analytics request:', error);
      return this.getErrorResponse(language);
    }
  }

  private async handleVoiceCommand(
    message: string, 
    context: any, 
    language: string, 
    supabase: any
  ): Promise<string> {
    // Voice commands handling
    const responses = {
      ht: `Mwen ka pale ak ou tou! Ou ka itilize mikwofòn lan pou pale ak mwen oswa mwen ka li repons yo ba ou. Eske ou vle m li repons sa a ba ou?`,
      en: `I can speak with you too! You can use the microphone to talk to me or I can read responses to you. Would you like me to read this response to you?`,
      fr: `Je peux parler avec vous aussi! Vous pouvez utiliser le microphone pour me parler ou je peux vous lire les réponses. Voulez-vous que je vous lise cette réponse?`
    };

    // Track voice interaction
    try {
      await supabase.from('ai_voice_interactions').insert({
        user_id: context.user_id,
        session_id: context.session_id,
        transcribed_text: message,
        response_text: responses[language] || responses.en,
        language: language
      });
    } catch (error) {
      console.error('Error saving voice interaction:', error);
    }

    return responses[language] || responses.en;
  }

  private async generateOpenAIResponse(message: string, context: any, language: string): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context, language);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || this.getContextualResponse(message, context, language);
  }

  private buildSystemPrompt(context: any, language: string): string {
    const role = context.user_role || 'student';
    const name = context.full_name ? context.full_name.split(' ')[0] : '';
    
    const languageInstruction = {
      ht: 'Reponn nan lang Kreyòl Ayisyen (Haitian Creole).',
      en: 'Respond in English.',
      fr: 'Répondre en français.'
    };

    return `You are an AI assistant for Tek Pou Nou, an educational platform in Haiti. ${languageInstruction[language] || languageInstruction.en}

User Context:
- Role: ${role}
- Name: ${name}
- Recent Courses: ${JSON.stringify(context.recent_courses || [])}
- Recent Events: ${JSON.stringify(context.recent_events || [])}
- User Groups: ${JSON.stringify(context.user_groups || [])}

Guidelines:
- Be helpful, respectful, and encouraging
- Provide practical advice relevant to their role
- Keep responses concise (under 200 words)
- Use appropriate cultural context for Haiti
- If you don't know something, admit it and suggest alternatives
- Always prioritize user safety and appropriate content

Role-specific guidance:
- Students: Help with learning, course selection, and progress tracking
- Teachers: Assist with pedagogy, student engagement, and course management
- SMEs: Provide business advice, service recommendations, and growth strategies
- Admins: Support with platform management and user support`;
  }

  private getPersonalizedGreeting(context: any, language: string): string {
    const role = context.user_role || 'student';
    const templateKey = `${role}_greeting_${language}`;
    return this.templates.get(templateKey) || this.templates.get(`${role}_greeting_en`) || 
           this.templates.get('student_greeting_en') || 'Hello! How can I help you today?';
  }

  private async getEnhancedCourseResponse(context: any, language: string, supabase: any): Promise<string> {
    const recentCourses = context.recent_courses || [];
    
    if (recentCourses.length > 0) {
      const activeCourse = recentCourses[0];
      
      // Get course recommendations
      try {
        const { data: recommendations } = await supabase
          .rpc('generate_content_recommendations', { 
            user_uuid: context.user_id, 
            content_type: 'course' 
          });

        const hasRecommendations = recommendations && recommendations.length > 0;
        
        const responses = {
          ht: `Mwen wè w enskri nan kou yo! Pwogre w kounye a se ${activeCourse.progress || 0}%. ${hasRecommendations ? `Mwen gen kèk kou yo rekòmande ki ka enterese w tou.` : ''} Ou vle kontinye ak leson yo oswa ou bezwen èd ak sijè espesifik yo?`,
          en: `I see you're enrolled in courses! Your current progress is ${activeCourse.progress || 0}%. ${hasRecommendations ? `I have some recommended courses that might interest you too.` : ''} Would you like to continue with your lessons or need help with specific topics?`,
          fr: `Je vois que vous êtes inscrit à des cours! Votre progression actuelle est de ${activeCourse.progress || 0}%. ${hasRecommendations ? `J'ai quelques cours recommandés qui pourraient vous intéresser aussi.` : ''} Voulez-vous continuer avec vos leçons ou avez-vous besoin d'aide sur des sujets spécifiques?`
        };

        return responses[language] || responses.en;
      } catch (error) {
        console.error('Error getting course recommendations:', error);
      }
    }
    
    const responses = {
      ht: `Mwen ka ede w jwenn kou yo, swiv pwogre aprann ou yo, oswa reponn kesyon yo sou materyèl kou yo. Ki èd espesifik ou bezwen?`,
      en: `I can help you find courses, track your learning progress, or answer questions about course content. What specific help do you need?`,
      fr: `Je peux vous aider à trouver des cours, suivre vos progrès d'apprentissage, ou répondre à des questions sur le contenu des cours. Quelle aide spécifique avez-vous besoin?`
    };

    return responses[language] || responses.en;
  }

  private async getEnhancedProgressResponse(context: any, language: string, supabase: any): Promise<string> {
    const recentCourses = context.recent_courses || [];
    
    if (recentCourses.length > 0) {
      const totalProgress = recentCourses.reduce((sum: number, course: any) => sum + (course.progress || 0), 0);
      const avgProgress = Math.round(totalProgress / recentCourses.length);
      const completedCourses = recentCourses.filter((course: any) => (course.completion_rate || 0) >= 100).length;
      
      // Generate personalized learning path if progress is good
      if (avgProgress > 60 && completedCourses > 0) {
        try {
          await supabase.rpc('generate_personalized_learning_path', { user_uuid: context.user_id });
        } catch (error) {
          console.error('Error generating learning path:', error);
        }
      }
      
      const responses = {
        ht: `Pwogre mwayèn ou nan kou yo se ${avgProgress}%. Ou gen ${recentCourses.length} kou ak ${completedCourses} yo ou fini. ${avgProgress > 70 ? 'Ou ap fè yon bon travay! Mwen gen kèk kou yo rekòmande pou ou kontinye aprann yo.' : 'Ou ka amelyore pwogre w yo. Mwen ka ede w ak estrateji yo ki pi bon.'} Kontinye bon travay la!`,
        en: `Your average course progress is ${avgProgress}%. You have ${recentCourses.length} courses with ${completedCourses} completed. ${avgProgress > 70 ? 'You\'re doing great! I have some recommended courses for you to continue learning.' : 'You can improve your progress. I can help you with better strategies.'} Keep up the good work!`,
        fr: `Votre progression moyenne dans les cours est de ${avgProgress}%. Vous avez ${recentCourses.length} cours avec ${completedCourses} terminés. ${avgProgress > 70 ? 'Vous vous débrouillez bien! J\'ai quelques cours recommandés pour continuer à apprendre.' : 'Vous pouvez améliorer vos progrès. Je peux vous aider avec de meilleures stratégies.'} Continuez le bon travail!`
      };

      return responses[language] || responses.en;
    }
    
    const responses = {
      ht: `Mwen ka ede w swiv pwogre aprann ou yo, gade leson yo ou fini ak reyalisasyon ou yo. Ki sa ou vle tcheke?`,
      en: `I can help you track your learning progress, view completed lessons, and see your achievements. What would you like to check?`,
      fr: `Je peux vous aider à suivre vos progrès d'apprentissage, voir les leçons terminées et vos réalisations. Que voulez-vous vérifier?`
    };

    return responses[language] || responses.en;
  }

  private getContextualResponse(message: string, context: any, language: string): string {
    const role = context.user_role || 'student';
    
    const responses = {
      ht: {
        student: `Mwen konprann ou ap chèche enfòmasyon yo. Kòm elèv, mwen ka ede w ak kou yo, pwogre w yo, ak konèk ak kominote aprann lan. Ou ka pi espesifik sou sa ou bezwen?`,
        teacher: `Kòm pwofesè, mwen ka ede w ak analitik elèv yo, jesyon kou yo oswa estrateji angajman. Ou ka di m pi plis sou sa ou ap travay sou li?`,
        sme: `Mwen konprann w ap chèche èd biznis. Mwen ka ede w ak sèvis yo, planifikasyon pwojè oswa dekouvèt resous. Ki sa espesifikman w ap travay sou li?`,
        admin: `Kòm administratè, mwen ka ede w ak jesyon platfòm lan, sipò itilizatè ak analitik sistèm lan. Ki sa ou bezwen?`
      },
      en: {
        student: `I understand you're looking for information. As a student, I can help you with courses, your progress, and connecting with the learning community. Could you be more specific about what you need?`,
        teacher: `As a teacher, I can help you with student analytics, course management, or engagement strategies. Could you tell me more about what you're working on?`,
        sme: `I understand you're looking for business assistance. I can help with services, project planning, or resource discovery. What specifically are you working on?`,
        admin: `As an administrator, I can help you with platform management, user support, and system analytics. What do you need help with?`
      },
      fr: {
        student: `Je comprends que vous cherchez des informations. En tant qu'étudiant, je peux vous aider avec les cours, vos progrès et la connexion avec la communauté d'apprentissage. Pourriez-vous être plus spécifique sur ce dont vous avez besoin?`,
        teacher: `En tant qu'enseignant, je peux vous aider avec les analyses d'étudiants, la gestion de cours ou les stratégies d'engagement. Pourriez-vous me dire plus sur ce sur quoi vous travaillez?`,
        sme: `Je comprends que vous cherchez une assistance commerciale. Je peux aider avec les services, la planification de projet ou la découverte de ressources. Sur quoi travaillez-vous spécifiquement?`,
        admin: `En tant qu'administrateur, je peux vous aider avec la gestion de plateforme, le support utilisateur et les analyses système. De quoi avez-vous besoin?`
      }
    };

    return responses[language]?.[role] || responses.en[role] || responses.en.student;
  }

  private getErrorResponse(language: string): string {
    const responses = {
      ht: 'Padon, mwen gen yon pwoblèm ak demand ou an. Tanpri eseye ankò oswa mande m yon bagay diferan.',
      en: 'Sorry, I encountered an issue with your request. Please try again or ask me something different.',
      fr: 'Désolé, j\'ai rencontré un problème avec votre demande. Veuillez réessayer ou me demander quelque chose de différent.'
    };

    return responses[language] || responses.en;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, sessionId, language = 'ht', featureType = 'chat' } = await req.json()
    
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

    // Get enhanced user context
    const { data: contextData, error: contextError } = await supabase
      .rpc('get_user_context_for_ai', { user_uuid: user.id })
    
    if (contextError) {
      console.error('Context error:', contextError)
    }

    const context = { ...contextData, user_id: user.id, session_id: sessionId } || { user_id: user.id, session_id: sessionId }

    // Check if AI is enabled for this user
    const { data: userPrefs } = await supabase
      .from('ai_user_preferences')
      .select('ai_enabled, preferred_language, voice_enabled')
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

    // Generate enhanced AI response
    const aiAssistant = new EnhancedAIAssistant()
    const response = await aiAssistant.generatePersonalizedResponse(message, context, responseLanguage, supabase)

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

    // Track AI usage
    await supabase.rpc('track_ai_usage', {
      user_uuid: user.id,
      feature_name: featureType || 'chat_assistant',
      interaction_type: 'use',
      session_uuid: sessionId,
      metadata: {
        message_length: message.length,
        response_length: response.length,
        language: responseLanguage
      }
    }).catch(error => console.error('Error tracking usage:', error))

    return new Response(
      JSON.stringify({ 
        response,
        sessionId,
        language: responseLanguage,
        context: {
          has_recommendations: context.recent_courses?.length > 0,
          user_role: context.user_role,
          can_use_voice: userPrefs?.voice_enabled || false
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('AI Assistant error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        message: 'Sorry, I encountered an error. Please try again.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})