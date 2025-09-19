import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { RegisterForm, LanguageCode } from '@/types';
import { isValidEmail, getLanguageDisplayName } from '@/utils';

export interface RegisterPageProps {
  onSuccess?: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp, isLoading } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      preferredLanguage: 'ht-HT',
    },
  });

  const password = watch('password');
  
  const languageOptions = [
    { value: 'ht-HT', label: getLanguageDisplayName('ht-HT') },
    { value: 'en-US', label: getLanguageDisplayName('en-US') },
    { value: 'fr-FR', label: getLanguageDisplayName('fr-FR') },
  ];

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    setSuccess('');
    
    const result = await signUp(
      data.email,
      data.password,
      data.displayName,
      data.preferredLanguage
    );
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Account created successfully! Please check your email to verify your account.');
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Kreye yon kont
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your account / Créer votre compte
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-primary-600" />
            </div>
          </CardHeader>
          <CardBody>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-danger-50 border border-danger-200 dark:bg-danger-900/20 dark:border-danger-800">
                <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 rounded-md bg-success-50 border border-success-200 dark:bg-success-900/20 dark:border-success-800">
                <p className="text-sm text-success-700 dark:text-success-400">{success}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Non afiche / Display Name (Optional)"
                type="text"
                autoComplete="name"
                error={errors.displayName?.message}
                {...register('displayName')}
              />
              
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email address is required',
                  validate: (value) => isValidEmail(value) || 'Please enter a valid email address',
                })}
              />
              
              <Select
                label="Lang prefere / Preferred Language"
                options={languageOptions}
                error={errors.preferredLanguage?.message}
                {...register('preferredLanguage', {
                  required: 'Please select a preferred language',
                })}
              />
              
              <div className="relative">
                <Input
                  label="Mo de pase / Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <div className="relative">
                <Input
                  label="Konfime mo de pase / Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Kreye kont / Create Account
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gen kont deja? / Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  Konekte / Sign in
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;