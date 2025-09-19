import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { 
  Users,
  Eye,
  Edit,
  Trash2,
  Plus,
  Star,
  Lock,
  Globe,
  AlertTriangle,
  MessageSquare,
  Crown,
  Ban,
  CheckCircle
} from 'lucide-react';
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
  post_count: number;
  recent_activity: string;
}

interface GroupFormData {
  name: string;
  description: string;
  cover_image: string;
  tags: string[];
  is_private: boolean;
  is_featured: boolean;
}

interface Member {
  user_id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  joined_at: string;
}

const SuperAdminGroups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    cover_image: '',
    tags: [],
    is_private: false,
    is_featured: false
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          creator:profiles!groups_created_by_fkey(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Get post counts and recent activity for each group
      const groupsWithStats = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: postsData } = await supabase
            .from('group_posts')
            .select('id, created_at')
            .eq('group_id', group.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...group,
            post_count: postsData?.length || 0,
            recent_activity: postsData?.[0]?.created_at || group.created_at
          };
        })
      );

      setGroups(groupsWithStats);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_members_view')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Erreur lors du chargement des membres');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('groups')
          .update(formData)
          .eq('id', editingGroup.id);
        
        if (error) throw error;
        toast.success('Groupe mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('groups')
          .insert({
            ...formData,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });
        
        if (error) throw error;
        toast.success('Groupe créé avec succès');
      }
      
      setShowModal(false);
      setEditingGroup(null);
      resetForm();
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ? Toutes les publications et membres seront supprimés.')) return;

    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      toast.success('Groupe supprimé');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleFeatured = async (groupId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ is_featured: !currentStatus })
        .eq('id', groupId);

      if (error) throw error;
      toast.success(`Groupe ${!currentStatus ? 'mis en avant' : 'retiré de la mise en avant'}`);
      fetchGroups();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const updateMemberRole = async (groupId: string, userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Rôle mis à jour');
      fetchGroupMembers(groupId);
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const removeMember = async (groupId: string, userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre du groupe ?')) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Membre supprimé du groupe');
      fetchGroupMembers(groupId);
      fetchGroups(); // Refresh to update member count
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      cover_image: group.cover_image,
      tags: group.tags || [],
      is_private: group.is_private,
      is_featured: group.is_featured
    });
    setShowModal(true);
  };

  const openMembersModal = (group: Group) => {
    setSelectedGroup(group);
    fetchGroupMembers(group.id);
    setShowMembersModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cover_image: '',
      tags: [],
      is_private: false,
      is_featured: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRoleDisplay = (role: string) => {
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Groupes</h2>
          <p className="text-gray-600">Gérez tous les groupes de la plateforme</p>
        </div>
        <button
          onClick={() => {
            setEditingGroup(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau Groupe
        </button>
      </div>

      {/* Groups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groupe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {group.cover_image ? (
                        <img
                          src={group.cover_image}
                          alt={group.name}
                          className="w-12 h-12 rounded-lg object-cover mr-4"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">
                            {group.name}
                          </div>
                          {group.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500" />
                          )}
                          {group.is_private ? (
                            <Lock className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Globe className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {group.description}
                        </div>
                        <div className="text-xs text-gray-400">
                          Par {group.creator?.full_name} • {formatDate(group.created_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openMembersModal(group)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {group.member_count}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {group.post_count} publications
                    </div>
                    <div className="text-xs text-gray-500">
                      Dernière activité: {formatDate(group.recent_activity)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {group.is_private ? (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          <Lock className="h-3 w-3" />
                          Privé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          <Globe className="h-3 w-3" />
                          Public
                        </span>
                      )}
                      
                      {group.tags && group.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {group.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 text-xs px-1 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {group.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{group.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFeatured(group.id, group.is_featured)}
                        className={`p-1 rounded transition-colors ${
                          group.is_featured
                            ? 'text-yellow-600 hover:text-yellow-800'
                            : 'text-gray-400 hover:text-yellow-600'
                        }`}
                        title={group.is_featured ? 'Retirer de la mise en avant' : 'Mettre en avant'}
                      >
                        <Star className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => window.open(`/groups/${group.id}`, '_blank')}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Voir le groupe"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => openEditModal(group)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(group.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun groupe
            </h3>
            <p className="text-gray-600">
              Commencez par créer votre premier groupe.
            </p>
          </div>
        )}
      </div>

      {/* Group Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingGroup ? 'Modifier le groupe' : 'Nouveau groupe'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du groupe *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image de couverture (URL)
                  </label>
                  <input
                    type="url"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    })}
                    placeholder="ai, technology, learning"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_private}
                      onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                      className="mr-2"
                    />
                    Groupe privé
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="mr-2"
                    />
                    Mettre en avant
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingGroup ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Membres de {selectedGroup.name} ({members.length})
                </h3>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Rejoint le {formatDate(member.joined_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getRoleDisplay(member.role)}
                      
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(selectedGroup.id, member.user_id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="member">Membre</option>
                        <option value="moderator">Modérateur</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        onClick={() => removeMember(selectedGroup.id, member.user_id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Supprimer du groupe"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {members.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Aucun membre dans ce groupe</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminGroups;