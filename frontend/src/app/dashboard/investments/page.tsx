'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { investmentAPI, transactionAPI, Investment, AssetType, TransactionType, InvestmentCreate, TransactionCreate } from '@/lib/api';

export default function InvestmentsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [error, setError] = useState('');

  // Add debugging for state changes
  useEffect(() => {
    console.log('showTransactionForm changed:', showTransactionForm);
    console.log('selectedInvestment changed:', selectedInvestment);
  }, [showTransactionForm, selectedInvestment]);

  // Form states
  const [newInvestment, setNewInvestment] = useState<InvestmentCreate>({
    symbol: '',
    name: '',
    asset_type: AssetType.STOCK,
    quantity: 0,
    purchase_price: 0,
  });

  const [newTransaction, setNewTransaction] = useState<TransactionCreate>({
    investment_id: 0,
    transaction_type: TransactionType.BUY,
    quantity: 0,
    price_per_unit: 0,
    notes: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInvestments();
    }
  }, [isAuthenticated]);

  // Helper function to safely handle number inputs
  const handleNumberInput = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const data = await investmentAPI.getInvestments();
      setInvestments(data);
    } catch (error) {
      console.error('Error loading investments:', error);
      setError('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.response?.data?.detail) {
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map((err: any) => err.msg || err).join(', ');
      }
      return error.response.data.detail;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'An unknown error occurred';
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await investmentAPI.createInvestment(newInvestment);
      setNewInvestment({
        symbol: '',
        name: '',
        asset_type: AssetType.STOCK,
        quantity: 0,
        purchase_price: 0,
      });
      setShowAddForm(false);
      loadInvestments();
    } catch (error: any) {
      setError(getErrorMessage(error));
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== TRANSACTION FORM SUBMITTED ===');
    console.log('Form data:', newTransaction);
    
    // Validate required fields
    if (!newTransaction.investment_id || newTransaction.investment_id === 0) {
      console.log('Validation error: No investment selected');
      setError('Please select an investment');
      return;
    }
    
    if (!newTransaction.quantity || newTransaction.quantity <= 0) {
      console.log('Validation error: Invalid quantity');
      setError('Please enter a valid quantity greater than 0');
      return;
    }
    
    if (!newTransaction.price_per_unit || newTransaction.price_per_unit <= 0) {
      console.log('Validation error: Invalid price');
      setError('Please enter a valid price greater than 0');
      return;
    }
    
    console.log('All validations passed, proceeding with API call');
    
    try {
      const transactionData = {
        investment_id: newTransaction.investment_id,
        transaction_type: newTransaction.transaction_type,
        quantity: newTransaction.quantity,
        price_per_unit: newTransaction.price_per_unit,
        notes: newTransaction.notes || ''
      };
      
      console.log('Sending transaction data to API:', transactionData);
      const result = await transactionAPI.createTransaction(transactionData);
      console.log('Transaction created successfully:', result);
      
      setNewTransaction({
        investment_id: 0,
        transaction_type: TransactionType.BUY,
        quantity: 0,
        price_per_unit: 0,
        notes: '',
      });
      setShowTransactionForm(false);
      setSelectedInvestment(null);
      loadInvestments();
      setError(''); // Clear any previous errors
      console.log('Transaction form reset and modal closed');
    } catch (error: any) {
      console.error('=== TRANSACTION ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      setError(getErrorMessage(error));
    }
  };

  const handleDeleteInvestment = async (id: number) => {
    if (confirm('Are you sure you want to delete this investment?')) {
      try {
        await investmentAPI.deleteInvestment(id);
        loadInvestments();
      } catch (error: any) {
        setError(getErrorMessage(error));
      }
    }
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Manage Investments</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Investment
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {getErrorMessage(error)}
              <button onClick={() => setError('')} className="float-right font-bold">×</button>
            </div>
          )}

          {/* Investments List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Investments
              </h3>
              {investments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Investment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Market Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          P&L
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {investments.map((investment) => (
                        <tr key={investment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {investment.symbol}
                              </div>
                              <div className="text-sm text-gray-500">
                                {investment.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {investment.asset_type.replace('_', ' ')}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {investment.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(investment.average_purchase_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(investment.current_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(investment.current_value || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className={investment.total_gain_loss && investment.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
                              <div>{formatCurrency(investment.total_gain_loss || 0)}</div>
                              <div className="text-xs">
                                ({formatPercentage(investment.gain_loss_percentage || 0)})
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                console.log('Trade button clicked for investment:', investment);
                                setSelectedInvestment(investment);
                                setNewTransaction({
                                  ...newTransaction,
                                  investment_id: investment.id,
                                });
                                setShowTransactionForm(true);
                                console.log('Transaction form should now be visible');
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Trade
                            </button>
                            <button
                              onClick={() => handleDeleteInvestment(investment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No investments yet</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Add Your First Investment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Investment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-black mb-4">Add New Investment</h3>
            <form onSubmit={handleAddInvestment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black">Symbol</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newInvestment.symbol}
                  onChange={(e) => setNewInvestment({...newInvestment, symbol: e.target.value.toUpperCase()})}
                  placeholder="e.g. AAPL"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black">Company Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({...newInvestment, name: e.target.value})}
                  placeholder="e.g. Apple Inc."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black">Asset Type</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newInvestment.asset_type}
                  onChange={(e) => setNewInvestment({...newInvestment, asset_type: e.target.value as AssetType})}
                >
                  <option value={AssetType.STOCK}>Stock</option>
                  <option value={AssetType.BOND}>Bond</option>
                  <option value={AssetType.MUTUAL_FUND}>Mutual Fund</option>
                  <option value={AssetType.ETF}>ETF</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black">Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newInvestment.quantity === 0 ? '' : newInvestment.quantity}
                  onChange={(e) => setNewInvestment({...newInvestment, quantity: handleNumberInput(e.target.value)})}
                  placeholder="Number of shares/units"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black">Purchase Price</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newInvestment.purchase_price === 0 ? '' : newInvestment.purchase_price}
                  onChange={(e) => setNewInvestment({...newInvestment, purchase_price: handleNumberInput(e.target.value)})}
                  placeholder="Price per share/unit"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showTransactionForm && selectedInvestment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-black mb-4">
              Trade {selectedInvestment.symbol}
            </h3>
            <form onSubmit={handleAddTransaction}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black">Transaction Type</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newTransaction.transaction_type}
                  onChange={(e) => setNewTransaction({...newTransaction, transaction_type: e.target.value as TransactionType})}
                >
                  <option value={TransactionType.BUY}>Buy</option>
                  <option value={TransactionType.SELL}>Sell</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black">Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newTransaction.quantity === 0 ? '' : newTransaction.quantity}
                  onChange={(e) => setNewTransaction({...newTransaction, quantity: handleNumberInput(e.target.value)})}
                  placeholder="Number of shares/units"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black">Price per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newTransaction.price_per_unit === 0 ? '' : newTransaction.price_per_unit}
                  onChange={(e) => setNewTransaction({...newTransaction, price_per_unit: handleNumberInput(e.target.value)})}
                  placeholder="Current market price"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-black">Notes (Optional)</label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                  placeholder="Add any notes about this transaction"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionForm(false);
                    setSelectedInvestment(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Execute Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
