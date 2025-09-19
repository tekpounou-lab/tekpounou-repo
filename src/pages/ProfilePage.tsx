import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Save, MessageSquare, Award, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { ProfileForm, LanguageCode } from '@/types';
import { getLanguageDisplayName } from '@/utils';
import { StudentProfile } from '@/components/profile/StudentProfile';
import { PrivateMessage } from '@/components/messages/PrivateMessage';
import { CertificateView } from '@/components/profile/CertificateView';
import { BadgeList } from '@/components/profile/BadgeList';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'messages' | 'achievements'>('profile');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      preferred_language: profile?.preferred_language || 'ht-HT',
    },
  });
  
  const languageOptions = [
    { value: 'ht-HT', label: getLanguageDisplayName('ht-HT') },
    { value: 'en-US', label: getLanguageDisplayName('en-US') },
    { value: 'fr-FR', label: getLanguageDisplayName('fr-FR') },
  ];

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    
    try {
      const result = await updateProfile({
        display_name: data.display_name || null,
        bio: data.bio || null,
        preferred_language: data.preferred_language,
      });
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Pwofil ou / Your Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Mete ajou enfòmasyon pwofil ou an / Update your profile information
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'profile'
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Profile Settings
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'messages'
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Messages
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === 'achievements'
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Achievements
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Foto Pwofil / Profile Picture
              </h2>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col items-center">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-4xl text-gray-500 dark:text-gray-400">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Klike sou foto a pou chanje li / Click to change profile picture
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Enfòmasyon Pwofil / Profile Information
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Adrès Imèl / Email Address"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  helpText="Email cannot be changed here. Contact support if needed."
                />
                
                <Input
                  label="Non Afichaj / Display Name"
                  type="text"
                  error={errors.display_name?.message}
                  {...register('display_name', {
                    maxLength: {
                      value: 50,
                      message: 'Display name must be less than 50 characters',
                    },
                  })}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deskripsyon / Bio
                  </label>
                  <textarea
                    rows={4}
                    className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Rakonte nou kèk bagay sou ou... / Tell us about yourself..."
                    {...register('bio', {
                      maxLength: {
                        value: 500,
                        message: 'Bio must be less than 500 characters',
                      },
                    })}
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
                      {errors.bio.message}
                    </p>
                  )}
                </div>
                
                <Select
                  label="Lang Prefere / Preferred Language"
                  options={languageOptions}
                  error={errors.preferred_language?.message}
                  {...register('preferred_language', {
                    required: 'Please select a preferred language',
                  })}
                />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Sove Chanjman / Save Changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          <PrivateMessage />
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Certificates / Sètifika</h2>
              <CertificateView />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">Badges / Meday</h2>
              <BadgeList />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;