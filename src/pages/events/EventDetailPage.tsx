import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ExternalLink, 
  Share2, 
  Edit,
  ArrowLeft,
  User
} from 'lucide-react';
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
  status: string;
  creator: {
    full_name: string;
    avatar_url: string;
    bio: string;
  };
}

interface Attendee {
  user_id: string;
  full_name: string;
  avatar_url: string;
  status: string;
  registered_at: string;
}

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchAttendees();
      checkRegistrationStatus();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator:profiles!events_created_by_fkey(full_name, avatar_url, bio)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Erreur lors du chargement de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', id)
        .eq('status', 'registered')
        .order('registered_at', { ascending: true });

      if (error) throw error;
      setAttendees(data || []);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .eq('status', 'registered')
        .single();

      setIsRegistered(!!data);
    } catch (error) {
      // User not registered
      setIsRegistered(false);
    }
  };

  const registerForEvent = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour vous inscrire');
      return;
    }

    setRegistrationLoading(true);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: id,
          user_id: user.id,
          status: 'registered'
        });

      if (error) throw error;

      setIsRegistered(true);
      toast.success('Inscription réussie !');
      fetchAttendees(); // Refresh attendees list
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Vous êtes déjà inscrit à cet événement');
      } else {
        toast.error('Erreur lors de l\'inscription');
      }
    } finally {
      setRegistrationLoading(false);
    }
  };

  const unregisterFromEvent = async () => {
    if (!user) return;

    setRegistrationLoading(true);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setIsRegistered(false);
      toast.success('Désinscription réussie');
      fetchAttendees();
    } catch (error) {
      toast.error('Erreur lors de la désinscription');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const shareEvent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing or API not supported
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers');
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

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const getEventDuration = () => {
    if (!event?.start_date || !event?.end_date) return null;
    
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Événement non trouvé
            </h2>
            <Link 
              to="/events"
              className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux événements
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          to="/events"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux événements
        </Link>

        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {event.cover_image && (
            <img
              src={event.cover_image}
              alt={event.title}
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {event.title}
                </h1>

                {/* Event Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <div>
                      <div className="font-medium">
                        {formatDate(event.start_date)}
                      </div>
                      {event.end_date && (
                        <div className="text-sm">
                          Jusqu'au {formatDateShort(event.end_date)}
                          {getEventDuration() && ` (${getEventDuration()})`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="h-5 w-5" />
                    <div>
                      {event.is_virtual ? (
                        <div>
                          <div className="font-medium">Événement en ligne</div>
                          {event.link_url && (
                            <a
                              href={event.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                              Rejoindre <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="font-medium">{event.location}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="h-5 w-5" />
                    <div>
                      {attendees.length} participant{attendees.length !== 1 ? 's' : ''}
                      {event.max_attendees && ` / ${event.max_attendees} max`}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:ml-6">
                {user && event.created_by === user.id && (
                  <Link
                    to={`/events/${event.id}/edit`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Link>
                )}

                <button
                  onClick={shareEvent}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Partager
                </button>

                {user && isUpcoming(event.start_date) && (
                  <button
                    onClick={isRegistered ? unregisterFromEvent : registerForEvent}
                    disabled={registrationLoading}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      isRegistered
                        ? 'bg-red-100 hover:bg-red-200 text-red-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {registrationLoading 
                      ? 'Chargement...' 
                      : isRegistered 
                        ? 'Se désinscrire' 
                        : 'S\'inscrire'
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="prose max-w-none mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Description
              </h2>
              <div className="text-gray-600 whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Organizer Info */}
            {event.creator && (
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Organisateur
                </h3>
                <div className="flex items-center gap-4">
                  {event.creator.avatar_url ? (
                    <img
                      src={event.creator.avatar_url}
                      alt={event.creator.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {event.creator.full_name}
                    </div>
                    {event.creator.bio && (
                      <div className="text-sm text-gray-600">
                        {event.creator.bio}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attendees */}
            {attendees.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Participants ({attendees.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {attendees.slice(0, 12).map((attendee) => (
                    <div key={attendee.user_id} className="flex items-center gap-2">
                      {attendee.avatar_url ? (
                        <img
                          src={attendee.avatar_url}
                          alt={attendee.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm text-gray-700 truncate">
                        {attendee.full_name}
                      </span>
                    </div>
                  ))}
                  {attendees.length > 12 && (
                    <div className="text-sm text-gray-500">
                      +{attendees.length - 12} autres
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;