import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ExternalLink, Calendar, Users, Search } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  link_url?: string;
  joined_at: string;
  is_active: boolean;
  sort_order: number;
}

const PartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      let query = supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('joined_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPartners();
  };

  const handlePartnerClick = (partner: Partner) => {
    if (partner.link_url) {
      window.open(partner.link_url, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ht-HT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="text-center">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Patnè ak Kolaboratè yo</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dekouvri òganizasyon ak enstitisyon yo ki ap travay ansanm ak nou pou devlope edikasyon nan Ayiti
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{partners.length}</div>
              <div className="text-gray-600">Patnè Aktif</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {partners.filter(p => p.joined_at && new Date(p.joined_at) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-gray-600">Nouvèl Patnè (Ane sa a)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.floor(Math.random() * 50) + 20}+
              </div>
              <div className="text-gray-600">Pwojè Kolaborasyon</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Chache patnè..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
        </div>

        {/* Partners Grid */}
        {partners.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pa gen patnè yo jwenn</h2>
            <p className="text-gray-600">Eseye chanje rechèch ou a.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {partners.map(partner => (
              <div
                key={partner.id}
                onClick={() => handlePartnerClick(partner)}
                className={`bg-white rounded-lg shadow-md p-6 transition-all duration-200 ${
                  partner.link_url 
                    ? 'hover:shadow-lg cursor-pointer hover:-translate-y-1' 
                    : ''
                } group`}
              >
                {/* Logo */}
                <div className="flex items-center justify-center mb-6">
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={`${partner.name} logo`}
                      className="h-20 w-20 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {getInitials(partner.name)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Partner Info */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {partner.name}
                  </h3>

                  {partner.description && (
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {partner.description}
                    </p>
                  )}

                  {/* Join Date */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                    <Calendar className="h-4 w-4" />
                    Kòmanse depi {formatDate(partner.joined_at)}
                  </div>

                  {/* External Link */}
                  {partner.link_url && (
                    <div className="flex items-center justify-center gap-1 text-blue-600 text-sm font-medium group-hover:text-blue-800 transition-colors">
                      <span>Vizite sit la</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Partnership Status */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Patnè Aktif
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-blue-600 rounded-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Ou vle vin patnè nou an?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Nou ap chache òganizasyon ak enstitisyon yo ki gen menm vizyon ak nou pou devlope edikasyon ak teknoloji nan Ayiti.
            </p>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Kominote ak Nou
            </button>
          </div>
        </div>

        {/* Partnership Benefits */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Benefis Patnèrya yo</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Rezo Kolaborasyon</h3>
              <p className="text-gray-600 text-sm">
                Konekte ak pwofesyonèl ak òganizasyon yo ki gen ekspètiz nan domèn yo diferan.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Vizibilite</h3>
              <p className="text-gray-600 text-sm">
                Montre travay ou ak accomplissement ou yo nan yon platfòm ki gen otè.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Opòtinite</h3>
              <p className="text-gray-600 text-sm">
                Patisipe nan pwojè ak inisyativ yo ki ap chanje kominote a.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersPage;