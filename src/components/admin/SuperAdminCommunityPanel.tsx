import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { 
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Activity,
  BarChart,
  Settings
} from 'lucide-react';
import SuperAdminEvents from './SuperAdminEvents';
import SuperAdminGroups from './SuperAdminGroups';

interface CommunityStats {
  totalEvents: number;
  totalGroups: number;
  totalConnections: number;
  activeUsers: number;
  eventRegistrations: number;
  groupPosts: number;
  upcomingEvents: number;
  featuredGroups: number;
}

const SuperAdminCommunityPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'groups' | 'networking'>('overview');
  const [stats, setStats] = useState<CommunityStats>({
    totalEvents: 0,
    totalGroups: 0,
    totalConnections: 0,
    activeUsers: 0,
    eventRegistrations: 0,
    groupPosts: 0,
    upcomingEvents: 0,
    featuredGroups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all community statistics
      const [
        eventsResult,
        groupsResult,
        connectionsResult,
        registrationsResult,
        postsResult,
        usersResult
      ] = await Promise.all([
        supabase.from('events').select('id, start_date, is_featured', { count: 'exact' }),
        supabase.from('groups').select('id, is_featured', { count: 'exact' }),
        supabase.from('connections').select('id, status', { count: 'exact' }),
        supabase.from('event_registrations').select('id', { count: 'exact' }),
        supabase.from('group_posts').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id, created_at', { count: 'exact' })
      ]);

      const now = new Date();
      const upcomingEvents = eventsResult.data?.filter(event => 
        new Date(event.start_date) >= now
      ).length || 0;

      const featuredGroups = groupsResult.data?.filter(group => 
        group.is_featured
      ).length || 0;

      const acceptedConnections = connectionsResult.data?.filter(conn => 
        conn.status === 'accepted'
      ).length || 0;

      // Active users (registered in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = usersResult.data?.filter(user => 
        new Date(user.created_at) >= thirtyDaysAgo
      ).length || 0;

      setStats({
        totalEvents: eventsResult.count || 0,
        totalGroups: groupsResult.count || 0,
        totalConnections: acceptedConnections,
        activeUsers,
        eventRegistrations: registrationsResult.count || 0,
        groupPosts: postsResult.count || 0,
        upcomingEvents,
        featuredGroups
      });
    } catch (error) {
      console.error('Error fetching community stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Événements Totaux',
      value: stats.totalEvents,
      subtitle: `${stats.upcomingEvents} à venir`,
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Groupes Actifs',
      value: stats.totalGroups,
      subtitle: `${stats.featuredGroups} mis en avant`,
      icon: Users,
      color: 'green'
    },
    {
      title: 'Connexions',
      value: stats.totalConnections,
      subtitle: 'Connexions acceptées',
      icon: UserPlus,
      color: 'purple'
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.activeUsers,
      subtitle: '30 derniers jours',
      icon: TrendingUp,
      color: 'orange'
    },
    {
      title: 'Inscriptions Événements',
      value: stats.eventRegistrations,
      subtitle: 'Total des inscriptions',
      icon: Activity,
      color: 'indigo'
    },
    {
      title: 'Publications Groupes',
      value: stats.groupPosts,
      subtitle: 'Total des publications',
      icon: MessageSquare,
      color: 'pink'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      pink: 'bg-pink-50 text-pink-600 border-pink-200'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion Communautaire</h1>
        <p className="text-gray-600">
          Gérez les événements, groupes et interactions de votre communauté d'apprentissage
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Vue d'ensemble
              </div>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Événements
              </div>
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'groups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Groupes
              </div>
            </button>
            <button
              onClick={() => setActiveTab('networking')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'networking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Réseau
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                  <div key={index} className={`border rounded-lg p-6 ${getColorClasses(stat.color)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-80">{stat.title}</p>
                        <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                        <p className="text-xs opacity-70 mt-1">{stat.subtitle}</p>
                      </div>
                      <stat.icon className="h-8 w-8 opacity-80" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('events')}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                  >
                    <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                    <div className="font-medium text-gray-900">Créer un Événement</div>
                    <div className="text-sm text-gray-600">Organisez un nouvel événement communautaire</div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('groups')}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                  >
                    <Users className="h-6 w-6 text-green-600 mb-2" />
                    <div className="font-medium text-gray-900">Gérer les Groupes</div>
                    <div className="text-sm text-gray-600">Modérez et organisez les groupes</div>
                  </button>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                    <Settings className="h-6 w-6 text-purple-600 mb-2" />
                    <div className="font-medium text-gray-900">Paramètres Communauté</div>
                    <div className="text-sm text-gray-600">Configurez les règles et paramètres</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Summary */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Activité Récente</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {stats.upcomingEvents} événements programmés dans les prochaines semaines
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {stats.totalGroups} groupes actifs avec {stats.groupPosts} publications
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {stats.totalConnections} connexions établies entre utilisateurs
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {stats.activeUsers} nouveaux utilisateurs ce mois
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && <SuperAdminEvents />}
          {activeTab === 'groups' && <SuperAdminGroups />}
          
          {activeTab === 'networking' && (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Gestion du Réseau
              </h3>
              <p className="text-gray-600 mb-4">
                Les outils de modération du réseau seront disponibles prochainement.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <h4 className="font-medium text-blue-900 mb-2">Fonctionnalités prévues :</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Modération des connexions</li>
                  <li>• Blocage d'utilisateurs</li>
                  <li>• Rapports de comportement</li>
                  <li>• Statistiques de réseau</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminCommunityPanel;