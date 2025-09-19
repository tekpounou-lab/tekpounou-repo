import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, CreditCard, Download, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTeacherEarnings } from '@/hooks/usePayments';
import { formatPrice } from '@/lib/stripe';
import { AnalyticsChart } from '@/components/charts/AnalyticsChart';

interface EarningsSummary {
  total: number;
  pending: number;
  available: number;
  paid: number;
  hold: number;
}

export const TeacherEarnings: React.FC = () => {
  const { getTeacherEarnings, getEarningsSummary, requestPayout, loading, error } = useTeacherEarnings();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const [earningsData, summaryData] = await Promise.all([
        getTeacherEarnings(),
        getEarningsSummary(),
      ]);
      
      setEarnings(earningsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const handleRequestPayout = async () => {
    if (!summary) return;

    try {
      await requestPayout(summary.available);
      await loadEarnings(); // Refresh data
      setShowPayoutModal(false);
    } catch (error) {
      console.error('Error requesting payout:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'available':
        return 'success';
      case 'paid':
        return 'info';
      case 'hold':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'available':
        return <DollarSign className="w-4 h-4" />;
      case 'paid':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Generate chart data for earnings over time
  const getChartData = () => {
    const now = new Date();
    const periods = [];
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      
      const monthEarnings = earnings.filter(earning => 
        earning.created_at.startsWith(monthKey)
      ).reduce((sum, earning) => sum + earning.net_amount, 0);
      
      periods.push({
        period: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: monthEarnings,
      });
    }
    
    return periods;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(summary?.total || 0)}
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
                  Available
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(summary?.available || 0)}
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
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(summary?.pending || 0)}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
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
                  Paid Out
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(summary?.paid || 0)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Earnings Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Earnings Over Time
          </h3>
          <div className="flex space-x-2">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm rounded-md capitalize ${
                  selectedPeriod === period
                    ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <AnalyticsChart
          data={getChartData()}
          type="line"
          height={300}
        />
      </Card>

      {/* Recent Earnings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Earnings
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPayoutModal(true)}
              disabled={!summary?.available || summary.available < 50}
            >
              Request Payout
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No earnings yet. Start selling courses to see your earnings here!
            </div>
          ) : (
            earnings.slice(0, 10).map((earning) => (
              <div
                key={earning.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    {getStatusIcon(earning.status)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {earning.course?.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>
                        {new Date(earning.created_at).toLocaleDateString()}
                      </span>
                      <Badge variant={getStatusColor(earning.status)} size="sm">
                        {earning.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(earning.net_amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {earning.commission_rate}% commission
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Request Payout
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You are about to request a payout of{' '}
              <span className="font-semibold">{formatPrice(summary?.available || 0)}</span>.
              This amount will be transferred to your connected account within 2-3 business days.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={handleRequestPayout}
                isLoading={loading}
                className="flex-1"
              >
                Confirm Payout
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPayoutModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
