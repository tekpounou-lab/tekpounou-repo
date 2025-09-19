import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar,
  Users,
  UserPlus,
  MessageSquare,
  TrendingUp,
  Clock,
  MapPin,
  Star,
  ExternalLink,
  Eye,
  Plus,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  start_date: string;
  location: string;
  is_virtual: boolean;
  link_url: string;
  cover_image: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  member_count: number;
  user_role: string;
  recent_posts: number;
}

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  requester_name: string;
  receiver_name: string;
  requester_avatar: string;
  receiver_avatar: string;
  status: string;
  created_at: string;
}

interface CommunityStats {
  registered_events: number;
  joined_groups: number;
  connections_count: number;
  pending_requests: number;
}

const CommunityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [recentConnections, setRecentConnections] = useState<Connection[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    registered_events: 0,
    joined_groups: 0,
    connections_count: 0,
    pending_requests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCommunityData();
    }
  }, [user]);

  const fetchCommunityData = async () => {
    if (!user) return;

    try {
      await Promise.all([
        fetchUpcomingEvents(),
        fetchMyGroups(),
        fetchConnections(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching community data:', error);
      toast.error('Erreur lors du chargement des données communautaires');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('events')
      .select(`
        id, title, start_date, location, is_virtual, link_url, cover_image,
        event_registrations!inner(user_id)
      `)
      .eq('event_registrations.user_id', user.id)
      .eq('event_registrations.status', 'registered')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(3);

    if (error) throw error;
    setUpcomingEvents(data || []);
  };

  const fetchMyGroups = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('groups')
      .select(`
        id, name, description, cover_image, member_count,
        group_members!inner(role, user_id)
      `)
      .eq('group_members.user_id', user.id)
      .order('group_members.joined_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    // Get recent posts count for each group
    const groupsWithPosts = await Promise.all(
      (data || []).map(async (group) => {
        const { data: postsData } = await supabase
          .from('group_posts')
          .select('id')
          .eq('group_id', group.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        return {
          ...group,
          user_role: group.group_members[0]?.role || 'member',
          recent_posts: postsData?.length || 0
        };
      })
    );

    setMyGroups(groupsWithPosts);
  };

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    setRecentConnections(data || []);
  };

  const fetchStats = async () => {
    if (!user) return;

    const [eventsResult, groupsResult, connectionsResult, requestsResult] = await Promise.all([
      supabase
        .from('event_registrations')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'registered'),
      supabase
        .from('group_members')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id),
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted'),
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
    ]);

    setStats({
      registered_events: eventsResult.count || 0,
      joined_groups: groupsResult.count || 0,
      connections_count: connectionsResult.count || 0,
      pending_requests: requestsResult.count || 0
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            <Star className="h-3 w-3" />
            Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            <Star className="h-3 w-3" />
            Modérateur
          </span>
        );
      default:
        return (
          <span className="text-xs text-gray-500">Membre</span>
        );
    }
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tableau de Bord Communautaire</h2>
        <p className="text-gray-600">Gérez vos événements, groupes et connexions professionnelles</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Événements</p>
              <p className="text-3xl font-bold text-gray-900">{stats.registered_events}</p>
              <p className="text-xs text-gray-500">Inscrits</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Groupes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.joined_groups}</p>
              <p className="text-xs text-gray-500">Rejoint</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Connexions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.connections_count}</p>
              <p className="text-xs text-gray-500">Établies</p>
            </div>
            <UserPlus className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Demandes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending_requests}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
            <MessageSquare className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Événements à Venir
              </h3>
              <Link 
                to="/events"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                Voir tous <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      {event.cover_image && (
                        <img
                          src={event.cover_image}
                          alt={event.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          <Link 
                            to={`/events/${event.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {event.title}
                          </Link>
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock className="h-4 w-4" />
                          {formatDate(event.start_date)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {event.is_virtual ? (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Événement virtuel
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Aucun événement prévu</p>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Découvrir les événements
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* My Groups */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Mes Groupes
              </h3>
              <Link 
                to="/groups"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                Voir tous <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {myGroups.length > 0 ? (
              <div className="space-y-4">
                {myGroups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      {group.cover_image ? (
                        <img
                          src={group.cover_image}
                          alt={group.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Users className="h-8 w-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">
                            <Link 
                              to={`/groups/${group.id}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {group.name}
                            </Link>
                          </h4>
                          {getRoleDisplay(group.user_role)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {group.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{group.member_count} membres</span>
                          <span>{group.recent_posts} nouvelles publications</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Aucun groupe rejoint</p>
                <Link
                  to="/groups"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Rejoindre des groupes
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Connections */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              Connexions Récentes
            </h3>
            <Link 
              to="/networking"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              Gérer mon réseau <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {recentConnections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentConnections.map((connection) => {
                const isRequester = connection.requester_id === user?.id;
                const otherUser = isRequester 
                  ? { name: connection.receiver_name, avatar: connection.receiver_avatar }
                  : { name: connection.requester_name, avatar: connection.requester_avatar };

                return (
                  <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      {otherUser.avatar ? (
                        <img
                          src={otherUser.avatar}
                          alt={otherUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {otherUser.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Connecté le {formatDate(connection.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Aucune connexion établie</p>
              <Link
                to="/networking"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Développer mon réseau
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/events"
            className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
          >
            <Calendar className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Découvrir des Événements</h4>
            <p className="text-sm text-gray-600">Participez aux ateliers et meetups</p>
          </Link>
          
          <Link
            to="/groups"
            className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
          >
            <Users className="h-6 w-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Rejoindre des Groupes</h4>
            <p className="text-sm text-gray-600">Connectez-vous avec vos pairs</p>
          </Link>
          
          <Link
            to="/networking"
            className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200"
          >
            <UserPlus className="h-6 w-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Développer son Réseau</h4>
            <p className="text-sm text-gray-600">Établissez des connexions professionnelles</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboard;