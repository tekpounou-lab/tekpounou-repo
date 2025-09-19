import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, MapPin, Users, Clock, Search, Filter, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  is_virtual: boolean;
  link_url: string;
  cover_image: string;
  max_attendees: number;
  tags: string[];
  created_by: string;
  creator: {
    full_name: string;
    avatar_url: string;
  };
  registration_count: number;
  is_registered: boolean;
}

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [eventType, setEventType] = useState('all'); // all, virtual, in-person, upcoming, past
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedTag, eventType]);

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          creator:profiles!events_created_by_fkey(full_name, avatar_url),
          registration_count:event_registrations(count),
          is_registered:event_registrations!inner(user_id)
        `);

      if (user) {
        query = query.eq('event_registrations.user_id', user.id);
      }

      const { data, error } = await query.order('start_date', { ascending: true });

      if (error) throw error;

      const processedEvents = data?.map(event => ({
        ...event,
        registration_count: event.registration_count?.[0]?.count || 0,
        is_registered: event.is_registered?.length > 0
      })) || [];

      setEvents(processedEvents);

      // Extract unique tags
      const tags = new Set<string>();
      processedEvents.forEach(event => {
        event.tags?.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));

    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];
    const now = new Date();

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(event =>
        event.tags?.includes(selectedTag)
      );
    }

    // Type filter
    switch (eventType) {
      case 'virtual':
        filtered = filtered.filter(event => event.is_virtual);
        break;
      case 'in-person':
        filtered = filtered.filter(event => !event.is_virtual);
        break;
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.start_date) >= now);
        break;
      case 'past':
        filtered = filtered.filter(event => new Date(event.start_date) < now);
        break;
    }

    setFilteredEvents(filtered);
  };

  const registerForEvent = async (eventId: string) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour vous inscrire');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered'
        });

      if (error) throw error;

      toast.success('Inscription réussie !');
      fetchEvents(); // Refresh to update registration status
    } catch (error: any) {
      if (error.code === '23505') { // Duplicate entry
        toast.error('Vous êtes déjà inscrit à cet événement');
      } else {
        toast.error('Erreur lors de l\'inscription');
      }
    }
  };

  const unregisterFromEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Désinscription réussie');
      fetchEvents();
    } catch (error) {
      toast.error('Erreur lors de la désinscription');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
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
            Événements Communautaires
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez et participez aux événements, ateliers, et meetups organisés par notre communauté d'apprentissage.
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
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            {/* Event Type Filter */}
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les événements</option>
              <option value="upcoming">À venir</option>
              <option value="past">Passés</option>
              <option value="virtual">Virtuels</option>
              <option value="in-person">En présentiel</option>
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

            {/* Create Event Button */}
            {user && (
              <Link
                to="/events/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Créer un événement
              </Link>
            )}
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Event Cover Image */}
              {event.cover_image && (
                <img
                  src={event.cover_image}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-6">
                {/* Event Title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  <Link 
                    to={`/events/${event.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {event.title}
                  </Link>
                </h3>

                {/* Event Description */}
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* Event Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.start_date)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    {event.is_virtual ? 'En ligne' : event.location}
                  </div>

                  {event.max_attendees && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      {event.registration_count} / {event.max_attendees} participants
                    </div>
                  )}
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {event.tags.length > 3 && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                        +{event.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Registration Button */}
                <div className="flex gap-3">
                  <Link
                    to={`/events/${event.id}`}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-center transition-colors"
                  >
                    Voir détails
                  </Link>
                  
                  {user && isUpcoming(event.start_date) && (
                    <button
                      onClick={() => event.is_registered ? unregisterFromEvent(event.id) : registerForEvent(event.id)}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        event.is_registered
                          ? 'bg-red-100 hover:bg-red-200 text-red-800'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {event.is_registered ? 'Se désinscrire' : 'S\'inscrire'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun événement trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Aucun événement ne correspond à vos critères de recherche.
            </p>
            {user && (
              <Link
                to="/events/create"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Créer le premier événement
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;