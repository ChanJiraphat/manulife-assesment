'use client';

import { useEffect, useState } from 'react';
import { marketDataAPI, StockQuote } from '@/lib/marketData';

const MAJOR_INDICES = [
  { symbol: 'SPY', name: 'S&P 500 ETF' },
  { symbol: 'QQQ', name: 'NASDAQ 100 ETF' },
  { symbol: 'DIA', name: 'Dow Jones ETF' },
  { symbol: 'IWM', name: 'Russell 2000 ETF' },
];

const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
];

interface MarketOverviewProps {
  className?: string;
}

export default function MarketOverview({ className = "" }: MarketOverviewProps) {
  const [indices, setIndices] = useState<StockQuote[]>([]);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        
        // Fetch major indices first
        const indicesData: StockQuote[] = [];
        for (const index of MAJOR_INDICES.slice(0, 2)) { // Limit to avoid API rate limits
          try {
            const quote = await marketDataAPI.getQuote(index.symbol);
            indicesData.push(quote);
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to fetch ${index.symbol}:`, error);
          }
        }
        
        setIndices(indicesData);
        
        // Fetch popular stocks
        const stocksData: StockQuote[] = [];
        for (const stock of POPULAR_STOCKS.slice(0, 3)) { // Limit to avoid API rate limits
          try {
            const quote = await marketDataAPI.getQuote(stock.symbol);
            stocksData.push(quote);
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to fetch ${stock.symbol}:`, error);
          }
        }
        
        setStocks(stocksData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // Update every 5 minutes
    const interval = setInterval(fetchMarketData, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const QuoteCard = ({ quote }: { quote: StockQuote }) => {
    const isPositive = quote.change >= 0;
    
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <div className="font-semibold text-gray-900">{quote.symbol}</div>
          <div className="text-sm text-gray-500">
            {MAJOR_INDICES.find(i => i.symbol === quote.symbol)?.name || 
             POPULAR_STOCKS.find(s => s.symbol === quote.symbol)?.name}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            ${quote.price.toFixed(2)}
          </div>
          <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}${quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
    );
  };

  const LoadingCard = () => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
      <div>
        <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="text-right">
        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-14"></div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Market Overview
          </h3>
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Major Indices */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Major Indices</h4>
            <div className="space-y-2">
              {loading ? (
                <>
                  <LoadingCard />
                  <LoadingCard />
                </>
              ) : (
                indices.map((quote) => (
                  <QuoteCard key={quote.symbol} quote={quote} />
                ))
              )}
            </div>
          </div>
          
          {/* Popular Stocks */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Popular Stocks</h4>
            <div className="space-y-2">
              {loading ? (
                <>
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </>
              ) : (
                stocks.map((quote) => (
                  <QuoteCard key={quote.symbol} quote={quote} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Market Status Indicator */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Market Status</span>
            </div>
            <span className="text-sm font-medium text-green-600">
              {new Date().getHours() >= 9 && new Date().getHours() < 16 ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
