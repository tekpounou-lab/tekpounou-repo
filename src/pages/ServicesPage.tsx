import React from 'react';
import { MapPin, Phone, Mail, Clock, DollarSign, Star } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils';

const ServicesPage: React.FC = () => {
  // Placeholder services data
  const services = [
    {
      id: '1',
      title: 'Devlopman Sit Entènèt',
      description: 'Nou ap ofri sèvis devlopman sit entènèt ak aplikasyon mobil yo pou ti biznis yo ak òganizasyon yo.',
      service_type: 'development',
      provider: 'Super Administrator',
      price: 1500,
      pricing_model: 'fixed',
      location: 'Port-au-Prince, Haiti',
      contact_email: 'contact@tekpounou.com',
      contact_phone: '+509 1234-5678',
      is_featured: true,
      tags: ['web-development', 'mobile-app', 'business', 'technology'],
      requirements: ['Project requirements document', 'Design preferences', 'Content and images'],
      deliverables: ['Responsive website', 'Mobile-friendly design', 'Content management system', 'Basic SEO setup'],
      timeline_days: 30,
      rating: 4.9,
      reviews: 24,
    },
    {
      id: '2',
      title: 'Konsèy Biznis / Business Consulting',
      description: 'Expert business consulting services to help small businesses grow and succeed in the Haitian market.',
      service_type: 'consultation',
      provider: 'James Louis',
      price: 75,
      pricing_model: 'hourly',
      location: 'Cap-Haïtien, Haiti',
      contact_email: 'james@biznis.ht',
      contact_phone: '+509 9876-5432',
      is_featured: false,
      tags: ['business', 'consulting', 'strategy', 'growth'],
      requirements: ['Business overview', 'Financial statements', 'Goals and objectives'],
      deliverables: ['Business analysis report', 'Growth strategy plan', 'Action recommendations'],
      timeline_days: 14,
      rating: 4.7,
      reviews: 18,
    },
    {
      id: '3',
      title: 'Fòmasyon Pwofesyonèl',
      description: 'Professional training workshops for various skills including computer literacy, language learning, and vocational training.',
      service_type: 'training',
      provider: 'Marie Dubois',
      price: 200,
      pricing_model: 'fixed',
      location: 'Jacmel, Haiti',
      contact_email: 'marie@formation.ht',
      contact_phone: '+509 5555-1234',
      is_featured: false,
      tags: ['training', 'education', 'skills', 'professional-development'],
      requirements: ['Training objectives', 'Number of participants', 'Available dates'],
      deliverables: ['Custom training curriculum', 'Workshop materials', 'Certificate of completion'],
      timeline_days: 7,
      rating: 4.8,
      reviews: 31,
    },
  ];

  const featuredServices = services.filter(service => service.is_featured);
  const regularServices = services.filter(service => !service.is_featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Sèvis yo / Services
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Jwenn sèvis ak ekspètiz ou bezwen yo nan kominote a.
          Find the services and expertise you need in the community.
        </p>
      </div>

      {/* Service Categories */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 justify-center">
          <Button variant="outline" size="sm">
            Tout sèvis / All Services
          </Button>
          <Button variant="outline" size="sm">
            Devlopman / Development
          </Button>
          <Button variant="outline" size="sm">
            Konsèy / Consulting
          </Button>
          <Button variant="outline" size="sm">
            Fòmasyon / Training
          </Button>
          <Button variant="outline" size="sm">
            Depo / Design
          </Button>
          <Button variant="outline" size="sm">
            Maketing / Marketing
          </Button>
        </div>
      </div>

      {/* Featured Services */}
      {featuredServices.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Sèvis ki Rekomande yo / Featured Services
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredServices.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <CardBody>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200 rounded">
                        Featured
                      </span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{service.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">({service.reviews})</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {service.title}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {service.description}
                  </p>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      {service.location}
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      {service.timeline_days} days timeline
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {formatCurrency(service.price)}
                      {service.pricing_model === 'hourly' && '/hour'}
                      {service.pricing_model === 'fixed' && ' (fixed)'}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button size="sm" className="flex-1">
                      Contact Provider
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regularServices.map((service) => (
          <Card key={service.id} className="flex flex-col">
            <CardBody className="flex-1 flex flex-col">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {service.service_type}
                  </span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{service.rating}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {service.description}
                </p>
                
                <div className="space-y-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {service.location}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {service.timeline_days} days
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(service.price)}
                    {service.pricing_model === 'hourly' && '/hr'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {service.reviews} reviews
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">
                    Contact
                  </Button>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12 p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Ou gen yon sèvis pou ou ofri? / Do you have a service to offer?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Kominote a bezwen ekspètiz ou an. Kominote ak nou pou nou ka ede moun yo.
          The community needs your expertise. Join us to help others.
        </p>
        <Button>
          Ajoute Sèvis ou an / Add Your Service
        </Button>
      </div>
    </div>
  );
};

export default ServicesPage;