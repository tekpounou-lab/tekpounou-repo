import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, Receipt, Download, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePayments, UserSubscription, Transaction } from '@/hooks/usePayments';
import { formatPrice } from '@/lib/stripe';

export const PaymentHistory: React.FC = () => {
  const { getUserSubscriptions, getUserTransactions, loading } = usePayments();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'transactions'>('subscriptions');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      const [subscriptionsData, transactionsData] = await Promise.all([
        getUserSubscriptions(),
        getUserTransactions(),
      ]);
      
      setSubscriptions(subscriptionsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'course':
        return <Receipt className="w-5 h-5 text-green-500" />;
      case 'refund':
        return <RefreshCw className="w-5 h-5 text-orange-500" />;
      default:
        return <Receipt className="w-5 h-5 text-gray-500" />;
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Payment & Subscriptions
        </h2>
        <Button variant="outline" size="sm" onClick={loadPaymentData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Receipt className="w-4 h-4 inline mr-2" />
            Transaction History
          </button>
        </nav>
      </div>

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {subscriptions.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Active Subscriptions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don't have any active subscriptions yet.
              </p>
              <Button onClick={() => window.location.href = '/pricing'}>
                Browse Plans
              </Button>
            </Card>
          ) : (
            subscriptions.map((subscription) => (
              <motion.div
                key={subscription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                        <CreditCard className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {subscription.plan.name} Plan
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {subscription.plan.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Started: {new Date(subscription.start_date).toLocaleDateString()}
                          </span>
                          {subscription.end_date && (
                            <span className="text-sm text-gray-500">
                              Ends: {new Date(subscription.end_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(subscription.plan.price)}
                      </div>
                      <div className="text-sm text-gray-500">
                        per {subscription.plan.billing_cycle}
                      </div>
                      {subscription.renewal_date && (
                        <div className="text-xs text-gray-400 mt-1">
                          Next billing: {new Date(subscription.renewal_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Plan Features:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subscription.plan.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <Card className="p-8 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Transactions Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your payment history will appear here once you make a purchase.
              </p>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {transaction.transaction_type === 'course' && 'Course Purchase'}
                          {transaction.transaction_type === 'subscription' && 'Subscription Payment'}
                          {transaction.transaction_type === 'refund' && 'Refund'}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </span>
                          <Badge variant={getStatusColor(transaction.status)} size="sm">
                            {transaction.status}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {transaction.payment_provider}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {transaction.transaction_type === 'refund' ? '-' : ''}
                          {formatPrice(transaction.amount, transaction.currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.payment_intent_id?.slice(-8)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
