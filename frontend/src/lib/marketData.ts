import axios from 'axios';

// You'll need to get a free API key from https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = 'LBNC0VAU9E9EGQQO';
const BASE_URL = 'https://www.alphavantage.co/query';

// Rate limiting and caching
const API_CALL_DELAY = 15000; // 15 seconds between calls
const CACHE_DURATION = 60000; // Cache for 1 minute
const quoteCache = new Map<string, { data: StockQuote; timestamp: number }>();
let lastAPICall = 0;

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdated: string;
  isDemo?: boolean; // Flag to indicate if this is demo data
}

export interface TimeSeries {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStatus {
  market: string;
  local_open: string;
  local_close: string;
  current_status: string;
  notes: string;
}

// Helper function to generate realistic demo data
const generateDemoQuote = (symbol: string): StockQuote => {
  const basePrice = getBasePriceForSymbol(symbol);
  const changePercent = (Math.random() - 0.5) * 6; // ±3% change
  const change = basePrice * (changePercent / 100);
  const currentPrice = basePrice + change;
  
  return {
    symbol: symbol.toUpperCase(),
    price: Number(currentPrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    high: Number((currentPrice + Math.random() * 5).toFixed(2)),
    low: Number((currentPrice - Math.random() * 5).toFixed(2)),
    open: Number((currentPrice + (Math.random() - 0.5) * 2).toFixed(2)),
    previousClose: Number((currentPrice - change).toFixed(2)),
    lastUpdated: new Date().toISOString().split('T')[0],
    isDemo: true,
  };
};

// Get realistic base prices for common symbols
const getBasePriceForSymbol = (symbol: string): number => {
  const basePrices: { [key: string]: number } = {
    'AAPL': 175,
    'MSFT': 340,
    'GOOGL': 130,
    'AMZN': 145,
    'TSLA': 250,
    'NVDA': 450,
    'META': 325,
    'SPY': 445,
    'QQQ': 370,
    'DIA': 340,
    'IWM': 200,
    'VTI': 240,
    'VOO': 420,
  };
  
  return basePrices[symbol.toUpperCase()] || 100 + Math.random() * 200;
};

// Check if we can make an API call (rate limiting)
const canMakeAPICall = (): boolean => {
  const now = Date.now();
  return now - lastAPICall >= API_CALL_DELAY;
};

// Get cached quote if available and not expired
const getCachedQuote = (symbol: string): StockQuote | null => {
  const cached = quoteCache.get(symbol.toUpperCase());
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Cache a quote
const cacheQuote = (symbol: string, quote: StockQuote): void => {
  quoteCache.set(symbol.toUpperCase(), {
    data: quote,
    timestamp: Date.now(),
  });
};

export const marketDataAPI = {
  // Get real-time quote for a single stock
  getQuote: async (symbol: string): Promise<StockQuote> => {
    const symbolUpper = symbol.toUpperCase();
    
    // Check cache first
    const cachedQuote = getCachedQuote(symbolUpper);
    if (cachedQuote) {
      console.log(`Using cached data for ${symbolUpper}`);
      return cachedQuote;
    }
    
    // Check rate limiting
    if (!canMakeAPICall()) {
      console.warn(`Rate limit reached, using demo data for ${symbolUpper}`);
      const demoQuote = generateDemoQuote(symbolUpper);
      cacheQuote(symbolUpper, demoQuote);
      return demoQuote;
    }
    
    try {
      console.log(`Making API call for ${symbolUpper}`);
      lastAPICall = Date.now();
      
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbolUpper,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000, // 10 second timeout
      });

      console.log('Alpha Vantage Response:', response.data);

      const data = response.data as any;

      if (data['Error Message']) {
        throw new Error(`Invalid symbol: ${symbol}`);
      }

      if (data['Note']) {
        console.warn('API rate limit reached, using demo data');
        const demoQuote = generateDemoQuote(symbolUpper);
        cacheQuote(symbolUpper, demoQuote);
        return demoQuote;
      }

      const quote = data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        console.warn(`No data for ${symbol}, using demo data`);
        const demoQuote = generateDemoQuote(symbolUpper);
        cacheQuote(symbolUpper, demoQuote);
        return demoQuote;
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      const realQuote: StockQuote = {
        symbol: quote['01. symbol'],
        price: price,
        change: change,
        changePercent: changePercent,
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close']),
        lastUpdated: quote['07. latest trading day'],
        isDemo: false,
      };
      
      // Cache the real quote
      cacheQuote(symbolUpper, realQuote);
      return realQuote;
      
    } catch (error: any) {
      console.error('Error fetching quote for', symbol, ':', error.message);
      
      // Return demo data as fallback
      console.log(`Using demo data fallback for ${symbolUpper}`);
      const demoQuote = generateDemoQuote(symbolUpper);
      cacheQuote(symbolUpper, demoQuote);
      return demoQuote;
    }
  },

    // Get quotes for multiple symbols with enhanced rate limiting
  getMultipleQuotes: async (symbols: string[]): Promise<StockQuote[]> => {
    const quotes: StockQuote[] = [];
    
    for (const symbol of symbols) {
      const quote = await marketDataAPI.getQuote(symbol);
      quotes.push(quote);
      
      // Add delay between requests to respect rate limits
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        console.log('Waiting 3 seconds before next API call...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    return quotes;
  },

  // Get historical data for charts
  getTimeSeries: async (symbol: string, interval: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<TimeSeries[]> => {
    try {
      const functionMap = {
        daily: 'TIME_SERIES_DAILY',
        weekly: 'TIME_SERIES_WEEKLY',
        monthly: 'TIME_SERIES_MONTHLY',
      };

      const response = await axios.get(BASE_URL, {
        params: {
          function: functionMap[interval],
          symbol: symbol.toUpperCase(),
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
      });

      const data = response.data as any;

      if (data['Error Message']) {
        throw new Error(`Invalid symbol: ${symbol}`);
      }

      if (data['Note']) {
        throw new Error('API call frequency limit reached.');
      }

      const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
      
      if (!timeSeriesKey) {
        throw new Error('No time series data found');
      }

      const timeSeries = data[timeSeriesKey];

      return Object.entries(timeSeries)
        .slice(0, 100) // Limit to 100 data points
        .map(([date, data]: [string, any]) => ({
          date,
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume']),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error fetching time series:', error);
      throw error;
    }
  },

  // Get market status
  getMarketStatus: async (): Promise<MarketStatus[]> => {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'MARKET_STATUS',
          apikey: ALPHA_VANTAGE_API_KEY,
        },
      });

      const data = response.data as any;
      return data.markets || [];
    } catch (error) {
      console.error('Error fetching market status:', error);
      return [];
    }
  },

  // Search for symbols
  searchSymbols: async (keywords: string): Promise<any[]> => {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
      });

      const data = response.data as any;
      return data.bestMatches || [];
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  },
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper function to format percentage
export const formatPercentage = (percentage: number): string => {
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
};
