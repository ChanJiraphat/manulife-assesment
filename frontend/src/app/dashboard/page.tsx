'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { portfolioAPI, investmentAPI, transactionAPI, Investment, Transaction, PortfolioSummary } from '@/lib/api';
import AssetAllocationChart from '@/components/AssetAllocationChart';
import RealTimePrice, { RealTimePriceCard } from '@/components/RealTimePrice';
import MarketOverview from '@/components/MarketOverview';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summary, investmentsData, transactionsData] = await Promise.all([
        portfolioAPI.getSummary(),
        investmentAPI.getInvestments(),
        transactionAPI.getTransactions(0, 5) // Get last 5 transactions
      ]);
      
      setPortfolioSummary(summary);
      setInvestments(investmentsData);
      setRecentTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Investment Portfolio</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.username}!</span>
              <button
                onClick={() => router.push('/dashboard/investments')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Manage Investments
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Portfolio Summary */}
          {portfolioSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">$</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Portfolio Value
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(portfolioSummary.total_value)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">↑</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Gain/Loss
                        </dt>
                        <dd className={`text-lg font-medium ${portfolioSummary.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(portfolioSummary.total_gain_loss)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">%</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Return Percentage
                        </dt>
                        <dd className={`text-lg font-medium ${portfolioSummary.gain_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(portfolioSummary.gain_loss_percentage)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">#</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Investments
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {portfolioSummary.investments_count}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Investment Holdings with Real-Time Prices */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Current Holdings
                </h3>
                {investments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {investments.map((investment) => (
                      <div key={investment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-semibold text-sm">
                                {investment.symbol.slice(0, 2)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-semibold text-gray-900">{investment.symbol}</h4>
                              <p className="text-xs text-gray-500">{investment.asset_type.replace('_', ' ')}</p>
                              <p className="text-xs text-gray-400">{investment.quantity} shares</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(investment.current_value || 0)}
                            </p>
                            <p className={`text-xs ${investment.total_gain_loss && investment.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(investment.total_gain_loss || 0)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Real-time price component */}
                        <div className="border-t border-gray-100 pt-3">
                          <div className="text-xs text-gray-500 mb-1">Live Market Price</div>
                          <RealTimePrice 
                            symbol={investment.symbol} 
                            className="text-sm"
                            refreshInterval={60000} // Update every minute
                          />
                        </div>
                        
                        {/* Performance indicator */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Portfolio Performance</span>
                            <span>{investment.gain_loss_percentage?.toFixed(2) || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${investment.total_gain_loss && investment.total_gain_loss >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ 
                                width: `${Math.min(Math.abs(investment.gain_loss_percentage || 0) * 2, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No investments yet</h3>
                    <p className="text-gray-500 mb-4">Start building your portfolio by adding your first investment</p>
                    <button
                      onClick={() => router.push('/dashboard/investments')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Add Your First Investment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Allocation Chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Asset Allocation
                </h3>
                <AssetAllocationChart investments={investments} />
              </div>
            </div>
          </div>

          {/* Recent Transactions Section */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Transactions
              </h3>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.transaction_type === 'BUY' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-xs font-semibold ${
                            transaction.transaction_type === 'BUY' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transaction_type === 'BUY' ? 'B' : 'S'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.transaction_type.toUpperCase()} {transaction.investment_symbol}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.quantity} shares at {formatCurrency(transaction.price_per_unit)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.total_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center">
                    <button
                      onClick={() => router.push('/dashboard/transactions')}
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      View All Transactions →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Market Overview Section */}
          <MarketOverview className="mt-8" />
        </div>
      </main>
    </div>
  );
}
