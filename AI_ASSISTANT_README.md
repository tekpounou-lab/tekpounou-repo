# AI Assistant System - Tek Pou Nou

## Overview

The AI Assistant system provides intelligent, context-aware assistance to users of the Tek Pou Nou platform. It offers multilingual support (Creole, English, French) and role-based responses tailored to students, teachers, SMEs, and administrators.

## Features

### Core Functionality
- **Context-Aware Responses**: AI understands user role and provides relevant assistance
- **Multi-language Support**: Native support for Kreyòl Ayisyen, English, and French
- **Real-time Chat Interface**: Floating chat button with modal and full-screen options
- **Quick Suggestions**: Role-based action buttons for common tasks
- **Conversation History**: Persistent chat history with user preferences
- **Feedback System**: Users can rate AI responses as helpful/unhelpful

### Role-Based Assistance

#### Students
- Course progress tracking
- Learning recommendations
- Assignment help
- Event notifications
- Study tips and resources

#### Teachers
- Student analytics and insights
- Course management guidance
- Engagement strategies
- Content creation tips
- Performance metrics

#### SMEs (Small/Medium Enterprises)
- Service discovery
- Project consultation
- Business resource recommendations
- Expert connections
- Market insights

#### Administrators
- System management guidance
- User analytics
- Platform configuration help
- Policy and compliance information

## System Architecture

### Database Tables

#### `ai_conversations`
- Stores all user-AI interactions
- Includes context, language, and feedback
- Supports conversation sessions

#### `ai_behavior_templates`
- Admin-configurable response templates
- Role and keyword-based triggers
- Multi-language template support

#### `ai_settings`
- Global AI system configuration
- Rate limiting and feature toggles
- Model provider settings

#### `ai_user_preferences`
- Individual user AI settings
- Language preferences
- Feature enable/disable options
- Privacy controls

### Backend Services

#### Supabase Edge Function: `ai-assistant`
- Processes incoming chat messages
- Fetches user context from database
- Generates contextual responses
- Logs conversations for admin review
- Handles rate limiting and error management

#### AI Service (`aiService.ts`)
- Client-side AI interaction layer
- Session management
- Quick action execution
- Preference management
- Conversation history

### Frontend Components

#### `AIAssistantButton`
- Floating action button
- Available on all pages
- Notification indicator
- Responsive design

#### `AIChatInterface`
- Main chat interface
- Message bubbles with timestamps
- Typing indicators
- Quick suggestion buttons
- Feedback buttons (thumbs up/down)

#### `AISettings`
- User preference management
- Language selection
- Feature toggles
- Privacy controls

#### `SuperAdminAI`
- Admin conversation monitoring
- Template management
- System settings configuration
- Analytics and reporting

## Setup Instructions

### 1. Database Migration
```bash
supabase db push
```

### 2. Deploy Edge Function
```bash
supabase functions deploy ai-assistant
```

### 3. Environment Variables
Set the following in your Supabase project settings:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `OPENAI_API_KEY` (optional): For enhanced AI responses
- `RESEND_API_KEY` (optional): For email notifications

### 4. Configure AI Settings
Access `/admin/ai` as a super admin to:
- Enable/disable AI globally
- Set response parameters
- Configure rate limits
- Manage behavior templates

## Usage Examples

### Basic Chat Interaction
```typescript
// Users can simply click the floating AI button and start typing
// Example conversations:

// Student asking about progress
User: "Ki pwogre m genyen nan kou matematik la?"
AI: "Ou gen 75% pwogre nan kou matematik la. Ou fini 8 nan 10 leson yo..."

// Teacher asking for analytics
User: "Show me student engagement data"
AI: "Your course has 89% completion rate with 4.2/5 average rating..."

// SME asking about services
User: "What services can help my business grow?"
AI: "We offer business consulting, digital marketing, and technical training..."
```

### Quick Actions
```typescript
// Pre-configured quick action buttons
const suggestions = [
  { text: 'Gade pwogre m yo', action: 'view_progress' },
  { text: 'Jwenn nouvo kou', action: 'find_courses' },
  { text: 'Tcheke evenman yo', action: 'check_events' }
];
```

### Admin Template Management
```typescript
// Creating behavior templates
const template = {
  name: 'Course Help',
  user_role: 'student',
  trigger_keywords: ['course', 'kou', 'lesson'],
  template_response: 'Mwen ka ede w ak kou yo...',
  language: 'ht'
};
```

## API Reference

### AI Service Methods

#### `sendMessage(message, language)`
Send a message to the AI assistant
- `message`: User's message text
- `language`: Response language ('ht', 'en', 'fr')
- Returns: AI response with context

#### `getUserPreferences()`
Get user's AI preferences
- Returns: User preference object

#### `updateUserPreferences(preferences)`
Update user's AI settings
- `preferences`: Partial preference object

#### `getQuickSuggestions(userRole, language)`
Get role-based quick suggestions
- `userRole`: User's role type
- `language`: Suggestion language
- Returns: Array of suggestion objects

### Edge Function Endpoints

#### POST `/functions/v1/ai-assistant`
Main AI interaction endpoint
```json
{
  "message": "User message text",
  "sessionId": "conversation-session-id",
  "language": "ht"
}
```

Response:
```json
{
  "response": "AI response text",
  "language": "ht",
  "context": {
    "userRole": "student",
    "hasRecentCourses": true,
    "hasUpcomingEvents": false
  }
}
```

## Customization

### Adding New Templates
1. Access `/admin/ai` as super admin
2. Click "Add Template"
3. Configure trigger keywords and responses
4. Test with different user roles

### Extending Quick Actions
```typescript
// Add new quick actions in aiService.ts
const newAction = {
  id: 'custom_action',
  text: 'Custom Action Text',
  action: 'custom_action',
  icon: '🎯',
  role: 'student'
};
```

### Language Support
The system supports three languages:
- **Kreyòl Ayisyen (ht)**: Default platform language
- **English (en)**: International users
- **Français (fr)**: French-speaking users

### Future Enhancements

#### Voice Commands (Planned)
- Speech-to-text integration
- Voice response generation
- Hands-free interaction

#### Video Responses (Planned)
- AI-generated video explanations
- Screen recording integration
- Visual learning support

#### Advanced AI Integration
- OpenAI GPT-4 integration
- Claude AI integration
- Custom model training

## Monitoring and Analytics

### Conversation Analytics
- Total conversations per day/week/month
- User engagement metrics
- Response satisfaction ratings
- Most common queries by role

### Performance Metrics
- Average response time
- Error rates
- User retention with AI
- Feature usage statistics

### Admin Monitoring
- Real-time conversation viewing
- User feedback analysis
- Template effectiveness tracking
- System health monitoring

## Privacy and Security

### Data Protection
- User conversations are encrypted
- Personal information is anonymized in logs
- GDPR compliance for European users
- Configurable data retention policies

### Access Controls
- Role-based permissions
- Admin-only conversation viewing
- User consent for data collection
- Opt-out capabilities

### Rate Limiting
- Per-user request limits
- Global system protection
- DDoS prevention
- Fair usage policies

## Troubleshooting

### Common Issues

#### AI Not Responding
1. Check user preferences (AI enabled?)
2. Verify Edge Function deployment
3. Check rate limiting status
4. Review error logs

#### Incorrect Language Responses
1. Check user language preferences
2. Verify template language settings
3. Update behavior templates
4. Clear conversation cache

#### Performance Issues
1. Monitor Edge Function logs
2. Check database query performance
3. Review rate limiting settings
4. Optimize conversation history

### Debug Mode
Enable debug logging in development:
```typescript
// Add to environment variables
VITE_AI_DEBUG=true
```

## Support

For technical support:
- Check the admin AI panel for system status
- Review conversation logs for error patterns
- Contact the development team for integration issues
- Submit feature requests through the admin interface

---

**Version**: 1.0.0  
**Last Updated**: 2024-10-04  
**Author**: MiniMax Agent