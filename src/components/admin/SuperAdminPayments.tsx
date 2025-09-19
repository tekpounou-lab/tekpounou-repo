import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, DollarSign, Users, TrendingUp, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/stripe';

interface PlatformSettings {
  teacher_commission_rate: number;
  platform_commission_rate: number;
  min_payout_amount: number;
  payout_schedule: string;
  supported_currencies: string[];
  payment_providers: string[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  max_courses?: number;
  max_students_per_course?: number;
  is_active: boolean;
}

export const SuperAdminPayments: React.FC = () => {
  const { user, profile } = useAuthStore();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    activePlans: 0,
    totalTransactions: 0,
  });

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      loadAdminData();
    }
  }, [profile]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPlatformSettings(),
        loadSubscriptionPlans(),
        loadAnalytics(),
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlatformSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value');

      if (error) throw error;

      const settingsObj = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as any);

      setSettings({
        teacher_commission_rate: parseFloat(settingsObj.teacher_commission_rate || '70'),
        platform_commission_rate: parseFloat(settingsObj.platform_commission_rate || '30'),
        min_payout_amount: parseFloat(settingsObj.min_payout_amount || '50'),
        payout_schedule: settingsObj.payout_schedule || 'monthly',
        supported_currencies: settingsObj.supported_currencies || ['USD', 'EUR', 'HTG'],
        payment_providers: settingsObj.payment_providers || ['stripe', 'moncash', 'cam_transfer'],
      });
    } catch (error) {
      console.error('Error loading platform settings:', error);
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Get total revenue from transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('amount, status')
        .eq('status', 'completed');

      if (transError) throw transError;

      const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Get total commissions
      const { data: earnings, error: earningsError } = await supabase
        .from('teacher_earnings')
        .select('platform_fee');

      if (earningsError) throw earningsError;

      const totalCommissions = earnings?.reduce((sum, e) => sum + e.platform_fee, 0) || 0;

      // Get active plans count
      const { count: activePlans } = await supabase
        .from('subscription_plans')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setAnalytics({
        totalRevenue,
        totalCommissions,
        activePlans: activePlans || 0,
        totalTransactions: transactions?.length || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const updatePlatformSettings = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key,
          value,
          updated_by: user?.id,
        });

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, [key]: value } : null);
    } catch (error) {
      console.error('Error updating platform settings:', error);
    }
  };

  const savePlan = async (planData: Partial<SubscriptionPlan>) => {
    try {
      if (editingPlan) {
        // Update existing plan
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
      } else {
        // Create new plan
        const { error } = await supabase
          .from('subscription_plans')
          .insert(planData);

        if (error) throw error;
      }

      await loadSubscriptionPlans();
      setShowPlanModal(false);
      setEditingPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      await loadSubscriptionPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  if (profile?.role !== 'super_admin') {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Only super administrators can access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Payment Management
        </h1>
        <div className="flex space-x-3">
          <Button
            onClick={() => {
              setEditingPlan(null);
              setShowPlanModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(analytics.totalRevenue)}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Platform Commissions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(analytics.totalCommissions)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Plans
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.activePlans}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.totalTransactions}
                </p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Platform Settings */}
      {settings && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Platform Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teacher Commission Rate (%)
              </label>
              <Input
                type="number"
                value={settings.teacher_commission_rate}
                onChange={(e) =>
                  updatePlatformSettings('teacher_commission_rate', parseFloat(e.target.value))
                }
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform Commission Rate (%)
              </label>
              <Input
                type="number"
                value={settings.platform_commission_rate}
                onChange={(e) =>
                  updatePlatformSettings('platform_commission_rate', parseFloat(e.target.value))
                }
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Payout Amount ($)
              </label>
              <Input
                type="number"
                value={settings.min_payout_amount}
                onChange={(e) =>
                  updatePlatformSettings('min_payout_amount', parseFloat(e.target.value))
                }
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payout Schedule
              </label>
              <select
                value={settings.payout_schedule}
                onChange={(e) => updatePlatformSettings('payout_schedule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Subscription Plans */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Subscription Plans
          </h2>
        </div>
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={plan.is_active ? 'success' : 'danger'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatPrice(plan.price)} / {plan.billing_cycle}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingPlan(plan);
                    setShowPlanModal(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePlan(plan.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
