import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  TrophyIcon,
  StarIcon,
  FireIcon,
  LightBulbIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CrownIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophySolidIcon,
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid';

interface BadgeData {
  id: string;
  title: string;
  description: string;
  icon_url?: string;
  badge_type: string;
  condition_type: string;
  condition_value: number;
  points: number;
  rarity: string;
  is_active: boolean;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress: number;
  completed: boolean;
  badges: BadgeData;
}

interface GamificationProfile {
  total_points: number;
  level: number;
  experience_points: number;
  streak_days: number;
  longest_streak: number;
  achievements_unlocked: number;
  preferred_badge_display?: string;
}

interface BadgesAchievementsProps {
  userId?: string;
  showOnlyEarned?: boolean;
}

export function BadgesAchievements({ userId, showOnlyEarned = false }: BadgesAchievementsProps) {
  const { t } = useTranslation();
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  useEffect(() => {
    fetchBadgesData();
  }, [userId]);

  const fetchBadgesData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = userId || user?.id;
      if (!currentUserId) return;

      // Fetch user badges
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', currentUserId);

      if (userBadgesError) throw userBadgesError;

      // Fetch all available badges
      const { data: allBadgesData, error: allBadgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: false });

      if (allBadgesError) throw allBadgesError;

      // Fetch gamification profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
      }

      setUserBadges(userBadgesData || []);
      setAllBadges(allBadgesData || []);
      setGamificationProfile(profileData);

    } catch (error) {
      console.error('Error fetching badges data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badgeType: string, rarity: string, isEarned: boolean = false) => {
    const iconClass = `h-8 w-8 ${isEarned ? 'text-yellow-500' : 'text-neutral-400'}`;
    
    switch (badgeType) {
      case 'milestone':
        return isEarned ? 
          <TrophySolidIcon className={iconClass} /> : 
          <TrophyIcon className={iconClass} />;
      case 'skill':
        return isEarned ? 
          <StarSolidIcon className={iconClass} /> : 
          <StarIcon className={iconClass} />;
      case 'engagement':
        return <HeartIcon className={iconClass} />;
      case 'special':
        return rarity === 'legendary' ? 
          <CrownIcon className={iconClass} /> : 
          <SparklesIcon className={iconClass} />;
      default:
        return <ShieldCheckIcon className={iconClass} />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
      case 'uncommon':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  const calculateProgress = (badge: BadgeData, currentUserId: string) => {
    // This would typically calculate current progress based on user stats
    // For now, return 0 if not earned, 100 if earned
    const isEarned = userBadges.some(ub => ub.badge_id === badge.id && ub.completed);
    return isEarned ? 100 : 0;
  };

  const filteredBadges = () => {
    let badges = showOnlyEarned 
      ? userBadges.filter(ub => ub.completed).map(ub => ub.badges)
      : allBadges;

    if (selectedCategory !== 'all') {
      badges = badges.filter(badge => badge.badge_type === selectedCategory);
    }

    if (selectedRarity !== 'all') {
      badges = badges.filter(badge => badge.rarity === selectedRarity);
    }

    return badges;
  };

  const getNextLevelXP = (level: number) => {
    return level * 1000;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {showOnlyEarned ? t('badges.myAchievements') : t('badges.allBadges')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">
            {showOnlyEarned 
              ? t('badges.myDescription') 
              : t('badges.allDescription')
            }
          </p>
        </div>
      </div>

      {/* Gamification Stats */}
      {gamificationProfile && !showOnlyEarned && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-100 dark:bg-accent-900 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t('badges.level')}
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {gamificationProfile.level}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                <span>{t('badges.experience')}</span>
                <span>{gamificationProfile.experience_points}/{getNextLevelXP(gamificationProfile.level)}</span>
              </div>
              <Progress 
                value={(gamificationProfile.experience_points % 1000) / 10} 
                className="h-2"
              />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <StarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t('badges.totalPoints')}
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {gamificationProfile.total_points.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <FireIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t('badges.currentStreak')}
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {gamificationProfile.streak_days} {t('badges.days')}
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              {t('badges.longest')}: {gamificationProfile.longest_streak} {t('badges.days')}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t('badges.achievements')}
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {gamificationProfile.achievements_unlocked}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      {!showOnlyEarned && (
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
              {t('badges.category')}:
            </span>
            {(['all', 'milestone', 'skill', 'engagement', 'special'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-accent-500 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-accent-200 dark:hover:bg-accent-800'
                }`}
              >
                {t(`badges.categories.${category}`)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
              {t('badges.rarity')}:
            </span>
            {(['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(rarity)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedRarity === rarity
                    ? 'bg-accent-500 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-accent-200 dark:hover:bg-accent-800'
                }`}
              >
                {t(`badges.rarities.${rarity}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredBadges().map((badge) => {
            const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
            const isEarned = userBadge?.completed || false;
            const progress = calculateProgress(badge, userId || '');

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className={`p-6 h-full flex flex-col relative transition-all duration-300 ${
                  isEarned 
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700 shadow-lg' 
                    : 'hover:shadow-md'
                }`}>
                  {/* Rarity Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRarityColor(badge.rarity)}`}>
                      {t(`badges.rarities.${badge.rarity}`)}
                    </span>
                  </div>

                  {/* Badge Icon */}
                  <div className={`mb-4 flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
                    isEarned 
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg' 
                      : 'bg-neutral-100 dark:bg-neutral-700'
                  }`}>
                    {badge.icon_url ? (
                      <img 
                        src={badge.icon_url} 
                        alt={badge.title}
                        className={`h-8 w-8 ${!isEarned ? 'grayscale opacity-50' : ''}`}
                      />
                    ) : (
                      getBadgeIcon(badge.badge_type, badge.rarity, isEarned)
                    )}
                  </div>

                  {/* Badge Title */}
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isEarned 
                      ? 'text-yellow-800 dark:text-yellow-200' 
                      : 'text-neutral-900 dark:text-white'
                  }`}>
                    {badge.title}
                  </h3>

                  {/* Badge Description */}
                  <p className={`text-sm mb-4 flex-1 ${
                    isEarned 
                      ? 'text-yellow-700 dark:text-yellow-300' 
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {badge.description}
                  </p>

                  {/* Progress or Status */}
                  {isEarned ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <ShieldCheckIcon className="h-4 w-4" />
                        <span>{t('badges.earned')}</span>
                      </div>
                      {userBadge && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          {formatDistanceToNow(new Date(userBadge.earned_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <LockClosedIcon className="h-4 w-4" />
                        <span>{t('badges.locked')}</span>
                      </div>
                      {progress > 0 && progress < 100 && (
                        <div>
                          <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <span>{t('badges.progress')}</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Points */}
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {badge.points} {t('badges.points')}
                      </span>
                      <Badge 
                        variant={badge.badge_type === 'special' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {t(`badges.types.${badge.badge_type}`)}
                      </Badge>
                    </div>
                  </div>

                  {/* Earned Badge Glow Effect */}
                  {isEarned && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/20 to-amber-500/20 pointer-events-none" />
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredBadges().length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            {showOnlyEarned ? t('badges.noEarnedBadges') : t('badges.noBadges')}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-300">
            {showOnlyEarned 
              ? t('badges.noEarnedDescription') 
              : t('badges.noDescription')
            }
          </p>
        </div>
      )}
    </div>
  );
}