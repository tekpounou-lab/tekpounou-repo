import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Search, Download, ExternalLink, FileText, Video, Link as LinkIcon, Tool, Filter, Tag } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'tool' | 'document';
  description?: string;
  file_url?: string;
  link_url?: string;
  tags: string[];
  added_at: string;
  downloads_count: number;
  is_featured: boolean;
}

const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const resourceTypes = [
    { value: '', label: 'Tout tip', icon: null },
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'link', label: 'Lyen', icon: LinkIcon },
    { value: 'tool', label: 'Zouti', icon: Tool },
    { value: 'document', label: 'Dokiman', icon: FileText },
  ];

  useEffect(() => {
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    
    if (type) setSelectedType(type);
    if (tag) setSelectedTag(tag);
    if (search) setSearchTerm(search);
    
    fetchResources();
    fetchFeaturedResources();
    fetchTags();
  }, [searchParams]);

  const fetchResources = async () => {
    try {
      let query = supabase
        .from('resources')
        .select('*')
        .order('added_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedType) {
        query = query.eq('type', selectedType);
      }

      if (selectedTag) {
        query = query.contains('tags', [selectedTag]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_featured', true)
        .order('added_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setFeaturedResources(data || []);
    } catch (error) {
      console.error('Error fetching featured resources:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('tags');

      if (error) throw error;

      const tagSet = new Set<string>();
      data?.forEach(resource => {
        resource.tags?.forEach((tag: string) => tagSet.add(tag));
      });

      setAllTags(Array.from(tagSet).sort());
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams();
    fetchResources();
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    updateUrlParams(type, selectedTag);
  };

  const handleTagFilter = (tag: string) => {
    const newTag = tag === selectedTag ? '' : tag;
    setSelectedTag(newTag);
    updateUrlParams(selectedType, newTag);
  };

  const updateUrlParams = (type?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (type || selectedType) params.set('type', type || selectedType);
    if (tag || selectedTag) params.set('tag', tag || selectedTag);
    setSearchParams(params);
  };

  const handleResourceClick = async (resource: Resource) => {
    // Increment download/view count
    await supabase.rpc('increment_download_count', {
      resource_id: resource.id
    });

    // Open resource
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    } else if (resource.link_url) {
      window.open(resource.link_url, '_blank');
    }
  };

  const getResourceIcon = (type: string) => {
    const typeConfig = resourceTypes.find(t => t.value === type);
    const IconComponent = typeConfig?.icon || FileText;
    return <IconComponent className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ht-HT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resous Edikasyon</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Dekouvri zouti ak dokiman itil pou edikasyon ak devlopman pwofesyonèl
          </p>
        </div>

        {/* Featured Resources */}
        {featuredResources.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Resous yo rekòmande</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredResources.map(resource => (
                <div
                  key={resource.id}
                  onClick={() => handleResourceClick(resource)}
                  className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {getResourceIcon(resource.type)}
                    <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">
                      {resourceTypes.find(t => t.value === resource.type)?.label}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2 line-clamp-2">{resource.title}</h3>
                  <p className="text-sm text-white/80 line-clamp-2">{resource.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span>{resource.downloads_count} telechaje</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Chache resous..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Type Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filtre pa tip:</h3>
            <div className="flex flex-wrap gap-2">
              {resourceTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleTypeFilter(type.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedType === type.value
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filtre pa kategori:</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {resources.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pa gen resous yo jwenn</h2>
            <p className="text-gray-600">Eseye chanje rechèch ou a oswa filtre yo.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map(resource => (
              <div
                key={resource.id}
                onClick={() => handleResourceClick(resource)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getResourceIcon(resource.type)}
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {resourceTypes.find(t => t.value === resource.type)?.label}
                    </span>
                  </div>
                  {resource.is_featured && (
                    <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      Rekòmande
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {resource.title}
                </h3>

                {resource.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">{resource.description}</p>
                )}

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {resource.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{resource.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                  <span>{formatDate(resource.added_at)}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {resource.downloads_count}
                    </div>
                    <ExternalLink className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;