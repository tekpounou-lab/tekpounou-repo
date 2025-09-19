import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Search, Plus, Lock, Globe, Crown, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Group {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  tags: string[];
  is_private: boolean;
  is_featured: boolean;
  member_count: number;
  created_by: string;
  created_at: string;
  creator: {
    full_name: string;
    avatar_url: string;
  };
  is_member: boolean;
  user_role?: string;
}

const GroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [filter, setFilter] = useState('all'); // all, joined, public, private, featured
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [groups, searchTerm, selectedTag, filter]);

  const fetchGroups = async () => {
    try {
      let query = supabase
        .from('groups')
        .select(`
          *,
          creator:profiles!groups_created_by_fkey(full_name, avatar_url),
          user_membership:group_members(role)
        `);

      if (user) {
        query = query.eq('group_members.user_id', user.id);
      }

      const { data, error } = await query.order('is_featured', { ascending: false })
                                      .order('member_count', { ascending: false });

      if (error) throw error;

      const processedGroups = data?.map(group => ({
        ...group,
        is_member: group.user_membership?.length > 0,
        user_role: group.user_membership?.[0]?.role
      })) || [];

      setGroups(processedGroups);

      // Extract unique tags
      const tags = new Set<string>();
      processedGroups.forEach(group => {
        group.tags?.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));

    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  };

  const filterGroups = () => {
    let filtered = [...groups];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(group =>
        group.tags?.includes(selectedTag)
      );
    }

    // Type filter
    switch (filter) {
      case 'joined':
        filtered = filtered.filter(group => group.is_member);
        break;
      case 'public':
        filtered = filtered.filter(group => !group.is_private);
        break;
      case 'private':
        filtered = filtered.filter(group => group.is_private);
        break;
      case 'featured':
        filtered = filtered.filter(group => group.is_featured);
        break;
    }

    setFilteredGroups(filtered);
  };

  const joinGroup = async (groupId: string) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour rejoindre un groupe');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast.success('Vous avez rejoint le groupe !');
      fetchGroups(); // Refresh to update membership status
    } catch (error: any) {
      if (error.code === '23505') { // Duplicate entry
        toast.error('Vous êtes déjà membre de ce groupe');
      } else {
        toast.error('Erreur lors de l\'adhésion au groupe');
      }
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Vous avez quitté le groupe');
      fetchGroups();
    } catch (error) {
      toast.error('Erreur lors de la sortie du groupe');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            <Crown className="h-3 w-3" />
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
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Groupes Communautaires
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Rejoignez des groupes d'apprentissage, participez aux discussions et connectez-vous avec des apprenants partageant vos intérêts.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un groupe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les groupes</option>
              <option value="featured">Mis en avant</option>
              <option value="public">Publics</option>
              <option value="private">Privés</option>
              {user && <option value="joined">Mes groupes</option>}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Create Group Button */}
            {user && (
              <Link
                to="/groups/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Créer un groupe
              </Link>
            )}
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Group Cover Image */}
              {group.cover_image ? (
                <img
                  src={group.cover_image}
                  alt={group.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Users className="h-16 w-16 text-white" />
                </div>
              )}

              <div className="p-6">
                {/* Group Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    <Link 
                      to={`/groups/${group.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {group.name}
                    </Link>
                  </h3>
                  
                  <div className="flex gap-1">
                    {group.is_featured && (
                      <Star className="h-5 w-5 text-yellow-500" />
                    )}
                    {group.is_private ? (
                      <Lock className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Globe className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>

                {/* User Role Badge */}
                {group.is_member && group.user_role && (
                  <div className="mb-3">
                    {getRoleDisplay(group.user_role)}
                  </div>
                )}

                {/* Group Description */}
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {group.description}
                </p>

                {/* Group Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    {group.member_count} membre{group.member_count !== 1 ? 's' : ''}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Créé le {formatDate(group.created_at)}
                  </div>
                </div>

                {/* Tags */}
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {group.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {group.tags.length > 3 && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                        +{group.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Creator Info */}
                {group.creator && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                    {group.creator.avatar_url && (
                      <img
                        src={group.creator.avatar_url}
                        alt={group.creator.full_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span>Par {group.creator.full_name}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link
                    to={`/groups/${group.id}`}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-center transition-colors"
                  >
                    Voir le groupe
                  </Link>
                  
                  {user && (
                    <button
                      onClick={() => group.is_member ? leaveGroup(group.id) : joinGroup(group.id)}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        group.is_member
                          ? 'bg-red-100 hover:bg-red-200 text-red-800'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {group.is_member ? 'Quitter' : 'Rejoindre'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun groupe trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Aucun groupe ne correspond à vos critères de recherche.
            </p>
            {user && (
              <Link
                to="/groups/create"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Créer le premier groupe
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;