# Tek Pou Nou - Educational Platform

🇺🇸 **English** | 🇭🇹 **Kreyòl Ayisyen** | 🇫🇷 **Français**

A comprehensive educational platform designed for the Haitian community, supporting trilingual content and role-based learning management.

## 🎆 Project Overview

**Tek Pou Nou** ("Technology for Us" in Haitian Creole) is a fullstack educational platform that bridges language barriers and provides accessible learning opportunities for the Haitian diaspora and local communities.

### 🌐 Multilingual Support
- **Haitian Creole (Kreyòl Ayisyen)** - Primary language
- **English** - International accessibility
- **French** - Regional connectivity

### 👥 User Roles
- **Super Admin** - Full platform management
- **Admin** - Content and user moderation
- **Teacher** - Course creation and instruction
- **Student** - Learning and course enrollment
- **Guest** - Public content access

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for responsive design
- **Zustand** for state management
- **React Hook Form** for form handling
- **React Router** for navigation

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row-Level Security (RLS)** for data protection
- **Netlify Functions** for serverless API

### Development
- **TypeScript** strict mode
- **ESLint + Prettier** for code quality
- **Absolute imports** with `@/` prefix
- **Dark/Light theme** support

## 🛠️ Features Implemented

### ✅ Authentication System
- Email/password authentication
- Role-based access control
- User registration and profile management
- Secure JWT handling

### ✅ Admin Dashboard
- Platform statistics and analytics
- User management interface
- Role-based navigation
- Audit logging system

### ✅ Content Management
- Course catalog with enrollment
- Blog system for community updates
- Service marketplace for SME projects
- Multilingual content support

### ✅ User Experience
- Responsive design for all devices
- Theme switching (dark/light)
- Language preference system
- Accessibility features

## 📊 Database Schema

### Core Tables
- `users` - User accounts and roles
- `profiles` - Extended user information
- `courses` - Educational content
- `blog_posts` - Community articles
- `services` - SME project listings
- `audit_logs` - System activity tracking

### Security Features
- Row-Level Security (RLS) policies
- Role-based data access
- Audit trail for admin actions
- Secure file upload handling

## 📁 Project Structure

```
tek-pou-nou/
├── src/
│   ├── components/
│   │   ├── admin/         # Admin panel components
│   │   ├── auth/          # Authentication UI
│   │   ├── common/        # Shared components
│   │   └── ui/            # Base UI components
│   ├── pages/             # Route components
│   ├── stores/            # Zustand state stores
│   ├── lib/               # Configurations
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript definitions
├── supabase/
│   └── migrations/        # Database migrations
├── netlify/
│   └── functions/         # Serverless API
└── public/               # Static assets
```

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Fill in your Supabase credentials
```

### 3. Database Migration
Run the SQL files in your Supabase dashboard:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed_data.sql`

### 4. Start Development
```bash
npm run dev
```

### 5. Access Admin Panel
- URL: `http://localhost:3000/admin`
- Email: `admin@tekpounou.com`
- Password: `SecurePassword123!`

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## 🎓 Educational Philosophy

### Cultural Sensitivity
- Respect for Haitian culture and values
- Integration of local knowledge systems
- Community-driven content development

### Accessibility First
- Multi-language support
- Offline-capable design
- Low-bandwidth optimization
- Mobile-first approach

### Community Empowerment
- Local teacher recruitment
- SME project platform
- Peer-to-peer learning
- Skills certification

## 🔄 Development Roadmap

### Phase 1: Foundation ✅
- Authentication system
- Admin panel
- Basic content management
- Multilingual support

### Phase 2: Learning Platform 🚧
- Video content delivery
- Interactive assignments
- Progress tracking
- Quiz and assessment system

### Phase 3: Community Features 📋
- Discussion forums
- Mentorship matching
- Project collaboration
- Community events

### Phase 4: Advanced Features 📋
- AI-powered recommendations
- Mobile application
- Offline synchronization
- Payment processing

## 🤝 Contributing

We welcome contributions from developers, educators, and community members!

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Follow the coding standards
4. Submit a pull request

### Contribution Areas
- **Frontend Development** - React/TypeScript
- **Backend Development** - Supabase/PostgreSQL
- **Content Creation** - Educational materials
- **Translation** - Multilingual support
- **Design** - UI/UX improvements
- **Testing** - Quality assurance

### Code Standards
- TypeScript strict mode
- ESLint + Prettier configuration
- Component documentation
- Unit test coverage
- Accessibility compliance

## 📜 Documentation

- [Setup Guide](./SETUP.md) - Installation and configuration
- [API Documentation](./docs/api.md) - Backend endpoints (coming soon)
- [Component Library](./docs/components.md) - UI components (coming soon)
- [Contributing Guide](./docs/contributing.md) - Development guidelines (coming soon)

## 🔒 Security

### Data Protection
- Row-Level Security (RLS)
- JWT token validation
- Input sanitization
- File upload restrictions

### Privacy
- GDPR compliance considerations
- User data encryption
- Audit logging
- Secure authentication flows

## 📞 Support

### Community
- **Discord** - Development discussions (coming soon)
- **GitHub Issues** - Bug reports and feature requests
- **Email** - support@tekpounou.com

### Documentation
- **Technical Docs** - Developer resources
- **User Guides** - Platform tutorials
- **API Reference** - Integration documentation

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Haitian developer community
- Open source contributors
- Educational content creators
- Community advisors and testers

---

**Ensanm nou ka fè diferans nan edikasyon an Ayiti!**  
**Together we can make a difference in Haitian education!**  
**Ensemble, nous pouvons faire la différence dans l'éducation haïtienne!**

<div align="center">
  <strong>Made with ❤️ for the Haitian community</strong>
</div>