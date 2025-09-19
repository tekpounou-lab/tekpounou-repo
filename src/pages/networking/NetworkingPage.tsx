import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search, 
  Mail,
  MessageCircle,
  Calendar,
  MapPin,
  User,
  Check,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'blocked' | 'declined';
  message: string;
  created_at: string;
  requester_name: string;
  requester_avatar: string;
  receiver_name: string;
  receiver_avatar: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  location: string;
  website: string;
  linkedin_url: string;
  github_url: string;
  created_at: string;
  connection_status?: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';
  connection_id?: string;
}

const NetworkingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'discover'>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionMessage, setConnectionMessage] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchSuggestedUsers();
    }
  }, [user]);

  useEffect(() => {
    filterUsers();
  }, [suggestedUsers, searchTerm]);

  const fetchConnections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Erreur lors du chargement des connexions');
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;

    try {
      // Get all users except current user and existing connections
      const { data: existingConnections } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const excludeIds = new Set([user.id]);
      existingConnections?.forEach(conn => {
        excludeIds.add(conn.requester_id);
        excludeIds.add(conn.receiver_id);
      });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', `(${Array.from(excludeIds).join(',')})`)
        .limit(20);

      if (error) throw error;

      // Add connection status for each user
      const usersWithStatus = await Promise.all(
        (data || []).map(async (profile) => {
          const status = await getConnectionStatus(profile.id);
          return {
            ...profile,
            connection_status: status.status,
            connection_id: status.connectionId
          };
        })
      );

      setSuggestedUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = async (userId: string) => {
    if (!user) return { status: 'none' as const, connectionId: undefined };

    try {
      const { data, error } = await supabase
        .from('connections')
        .select('id, status, requester_id, receiver_id')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user.id})`)
        .single();

      if (error || !data) return { status: 'none' as const, connectionId: undefined };

      if (data.status === 'accepted') {
        return { status: 'connected' as const, connectionId: data.id };
      } else if (data.status === 'blocked') {
        return { status: 'blocked' as const, connectionId: data.id };
      } else if (data.requester_id === user.id) {
        return { status: 'pending_sent' as const, connectionId: data.id };
      } else {
        return { status: 'pending_received' as const, connectionId: data.id };
      }
    } catch (error) {
      return { status: 'none' as const, connectionId: undefined };
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          receiver_id: receiverId,
          status: 'pending',
          message: connectionMessage[receiverId] || ''
        });

      if (error) throw error;

      toast.success('Demande de connexion envoyée !');
      setConnectionMessage(prev => ({ ...prev, [receiverId]: '' }));
      fetchSuggestedUsers();
      fetchConnections();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Une demande de connexion existe déjà');
      } else {
        toast.error('Erreur lors de l\'envoi de la demande');
      }
    }
  };

  const acceptConnectionRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Connexion acceptée !');
      fetchConnections();
      fetchSuggestedUsers();
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  const declineConnectionRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'declined' })
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Demande refusée');
      fetchConnections();
    } catch (error) {
      toast.error('Erreur lors du refus');
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast.success('Connexion supprimée');
      fetchConnections();
      fetchSuggestedUsers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(suggestedUsers);
      return;
    }

    const filtered = suggestedUsers.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.bio?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getMyConnections = () => {
    return connections.filter(conn => conn.status === 'accepted');
  };

  const getPendingRequests = () => {
    if (!user) return [];
    return connections.filter(conn => 
      conn.status === 'pending' && conn.receiver_id === user.id
    );
  };

  const getSentRequests = () => {
    if (!user) return [];
    return connections.filter(conn => 
      conn.status === 'pending' && conn.requester_id === user.id
    );
  };

  const renderConnectionButton = (profile: UserProfile) => {
    switch (profile.connection_status) {
      case 'connected':
        return (
          <button
            onClick={() => profile.connection_id && removeConnection(profile.connection_id)}
            className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm flex items-center gap-2 hover:bg-green-200 transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            Connecté
          </button>
        );
      case 'pending_sent':
        return (
          <button
            onClick={() => profile.connection_id && removeConnection(profile.connection_id)}
            className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm flex items-center gap-2 hover:bg-yellow-200 transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            En attente
          </button>
        );
      case 'pending_received':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => profile.connection_id && acceptConnectionRequest(profile.connection_id)}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              Accepter
            </button>
            <button
              onClick={() => profile.connection_id && declineConnectionRequest(profile.connection_id)}
              className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
              Refuser
            </button>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Message (optionnel)"
              value={connectionMessage[profile.id] || ''}
              onChange={(e) => setConnectionMessage(prev => ({ ...prev, [profile.id]: e.target.value }))}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => sendConnectionRequest(profile.id)}
              className="w-full bg-blue-600 text-white px-3 py-1 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Se connecter
            </button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Réseau Professionnel
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connectez-vous avec d'autres apprenants, partagez vos expériences et développez votre réseau professionnel.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('connections')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'connections'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mes Connexions ({getMyConnections().length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Demandes ({getPendingRequests().length})
              </button>
              <button
                onClick={() => setActiveTab('discover')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'discover'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Découvrir
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'connections' && (
              <div>
                {getMyConnections().length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune connexion
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Commencez à construire votre réseau en vous connectant avec d'autres apprenants.
                    </p>
                    <button
                      onClick={() => setActiveTab('discover')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Découvrir des personnes
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getMyConnections().map((connection) => {
                      const isRequester = connection.requester_id === user?.id;
                      const otherUser = isRequester 
                        ? { name: connection.receiver_name, avatar: connection.receiver_avatar }
                        : { name: connection.requester_name, avatar: connection.requester_avatar };

                      return (
                        <div key={connection.id} className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="flex items-center gap-4 mb-4">
                            {otherUser.avatar ? (
                              <img
                                src={otherUser.avatar}
                                alt={otherUser.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {otherUser.name}
                              </h3>
                              <div className="text-sm text-gray-500">
                                Connecté le {formatDate(connection.created_at)}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                              <MessageCircle className="h-4 w-4" />
                              Message
                            </button>
                            <button
                              onClick={() => removeConnection(connection.id)}
                              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                              <UserX className="h-4 w-4" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6">
                {/* Pending Requests Received */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Demandes reçues ({getPendingRequests().length})
                  </h3>
                  {getPendingRequests().length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Aucune demande en attente</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getPendingRequests().map((request) => (
                        <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {request.requester_avatar ? (
                              <img
                                src={request.requester_avatar}
                                alt={request.requester_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {request.requester_name}
                              </h4>
                              <div className="text-sm text-gray-500">
                                {formatDate(request.created_at)}
                              </div>
                            </div>
                          </div>

                          {request.message && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700">"{request.message}"</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptConnectionRequest(request.id)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                              Accepter
                            </button>
                            <button
                              onClick={() => declineConnectionRequest(request.id)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                              <X className="h-4 w-4" />
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent Requests */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Demandes envoyées ({getSentRequests().length})
                  </h3>
                  {getSentRequests().length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Aucune demande envoyée</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getSentRequests().map((request) => (
                        <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            {request.receiver_avatar ? (
                              <img
                                src={request.receiver_avatar}
                                alt={request.receiver_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {request.receiver_name}
                              </h4>
                              <div className="text-sm text-yellow-600">
                                En attente • {formatDate(request.created_at)}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => removeConnection(request.id)}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm transition-colors"
                          >
                            Annuler la demande
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'discover' && (
              <div>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher des personnes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                    />
                  </div>
                </div>

                {/* Suggested Users */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map((profile) => (
                    <div key={profile.id} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="text-center mb-4">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <User className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <h3 className="font-medium text-gray-900 mb-1">
                          {profile.full_name}
                        </h3>
                        {profile.bio && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {profile.bio}
                          </p>
                        )}
                        {profile.location && (
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-2">
                            <MapPin className="h-3 w-3" />
                            {profile.location}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Membre depuis {formatDate(profile.created_at)}
                        </div>
                      </div>

                      {renderConnectionButton(profile)}
                    </div>
                  ))}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune personne trouvée
                    </h3>
                    <p className="text-gray-600">
                      Essayez de modifier vos critères de recherche.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkingPage;