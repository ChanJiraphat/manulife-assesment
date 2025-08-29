'use client'

import React, { useState, useEffect } from 'react'
import { marketDataAPI } from '@/lib/marketData'

interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  open: number
  previousClose: number
  lastUpdated: string
  isDemo?: boolean
}

interface RealTimePriceProps {
  symbol: string
  className?: string
  refreshInterval?: number // in milliseconds, default 30 seconds
}

export default function RealTimePrice({ 
  symbol, 
  className = '', 
  refreshInterval = 30000 
}: RealTimePriceProps) {
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchQuote = async () => {
    try {
      setError(null)
      const data = await marketDataAPI.getQuote(symbol)
      setQuote(data)
      setLastUpdated(new Date())
    } catch (err: any) {
      console.error('Error fetching quote:', err)
      setError(err.message || 'Failed to fetch quote')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuote()

    // Set up refresh interval
    const interval = setInterval(fetchQuote, refreshInterval)

    return () => clearInterval(interval)
  }, [symbol, refreshInterval])

  if (loading && !quote) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Loading...
      </div>
    )
  }

  if (error && !quote) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        Error loading price
      </div>
    )
  }

  if (!quote) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No data available
      </div>
    )
  }

  const isPositive = quote.change >= 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          ${quote.price.toFixed(2)}
        </span>
        <span className={`text-sm ${changeColor}`}>
          {isPositive ? '+' : ''}${quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
        </span>
        {quote.isDemo && (
          <span className="text-xs text-amber-600 bg-amber-100 px-1 rounded">
            Demo
          </span>
        )}
      </div>
      {lastUpdated && (
        <div className="text-xs text-gray-400 mt-1">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// Enhanced version with card layout
export function RealTimePriceCard({ 
  symbol, 
  assetType,
  className = "" 
}: { 
  symbol: string; 
  assetType: string;
  className?: string;
}) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const quoteData = await marketDataAPI.getQuote(symbol);
        setQuote(quoteData);
      } catch (err) {
        console.error('Error fetching quote:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
    const interval = setInterval(fetchQuote, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const isPositive = quote.change >= 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-semibold text-sm">
              {symbol.slice(0, 2)}
            </span>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-semibold text-gray-900">{symbol}</h4>
            <p className="text-xs text-gray-500">{assetType.replace('_', ' ')}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            ${quote.price.toFixed(2)}
          </p>
          <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}${quote.change.toFixed(2)}
          </p>
          {quote.isDemo && (
            <span className="text-xs text-amber-600 bg-amber-100 px-1 rounded">
              Demo
            </span>
          )}
        </div>
      </div>
      
      {/* Progress bar for daily performance */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Today</span>
          <span>{quote.changePercent.toFixed(2)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ 
              width: `${Math.min(Math.abs(quote.changePercent) * 10, 100)}%` 
            }}
          ></div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>High: ${quote.high.toFixed(2)}</div>
        <div>Low: ${quote.low.toFixed(2)}</div>
      </div>
    </div>
  );
}
