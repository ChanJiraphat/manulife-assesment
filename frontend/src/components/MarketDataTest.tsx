'use client';

import { useState } from 'react';
import { marketDataAPI } from '@/lib/marketData';

export default function MarketDataTest() {
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testAPI = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const quote = await marketDataAPI.getQuote(symbol);
      setResult(quote);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Test Market Data API</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="e.g., AAPL, MSFT, GOOGL"
          />
        </div>
        
        <button
          onClick={testAPI}
          disabled={loading || !symbol}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
        >
          {loading ? 'Loading...' : 'Get Quote'}
        </button>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800">{result.symbol}</h4>
            <p className="text-green-700">Price: ${result.price.toFixed(2)}</p>
            <p className="text-green-700">
              Change: {result.change >= 0 ? '+' : ''}${result.change.toFixed(2)} 
              ({result.changePercent.toFixed(2)}%)
            </p>
            <p className="text-green-700">Volume: {result.volume.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
