import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export enum AssetType {
  STOCK = "STOCK",
  BOND = "BOND",
  MUTUAL_FUND = "MUTUAL_FUND",
  ETF = "ETF"
}

export enum TransactionType {
  BUY = "BUY",
  SELL = "SELL"
}

export interface Investment {
  id: number;
  user_id: number;
  symbol: string;
  name: string;
  asset_type: AssetType;
  quantity: number;
  average_purchase_price: number;
  current_price: number;
  created_at: string;
  updated_at?: string;
  current_value?: number;
  total_gain_loss?: number;
  gain_loss_percentage?: number;
}

export interface InvestmentCreate {
  symbol: string;
  name: string;
  asset_type: AssetType;
  quantity: number;
  purchase_price: number;
}

export interface InvestmentUpdate {
  symbol?: string;
  name?: string;
  quantity?: number;
  current_price?: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  investment_id: number;
  transaction_type: TransactionType;
  quantity: number;
  price_per_unit: number;
  total_amount: number;
  transaction_date: string;
  notes?: string;
  investment_symbol?: string;
  investment_name?: string;
}

export interface TransactionCreate {
  investment_id: number;
  transaction_type: TransactionType;
  quantity: number;
  price_per_unit: number;
  notes?: string;
}

export interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  total_gain_loss: number;
  gain_loss_percentage: number;
  investments_count: number;
  transactions_count: number;
}

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },
};

export const investmentAPI = {
  getInvestments: async (): Promise<Investment[]> => {
    const response = await api.get<Investment[]>('/investments/');
    return response.data;
  },

  createInvestment: async (investment: InvestmentCreate): Promise<Investment> => {
    const response = await api.post<Investment>('/investments/', investment);
    return response.data;
  },

  getInvestment: async (id: number): Promise<Investment> => {
    const response = await api.get<Investment>(`/investments/${id}`);
    return response.data;
  },

  updateInvestment: async (id: number, investment: InvestmentUpdate): Promise<Investment> => {
    const response = await api.put<Investment>(`/investments/${id}`, investment);
    return response.data;
  },

  deleteInvestment: async (id: number): Promise<void> => {
    await api.delete(`/investments/${id}`);
  },
};

export const transactionAPI = {
  getTransactions: async (skip = 0, limit = 100): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>(`/transactions/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  createTransaction: async (transaction: TransactionCreate): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions/', transaction);
    return response.data;
  },

  getTransaction: async (id: number): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  deleteTransaction: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};

export const portfolioAPI = {
  getSummary: async (): Promise<PortfolioSummary> => {
    const response = await api.get<PortfolioSummary>('/portfolio/summary');
    return response.data;
  },
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('access_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('access_token');
};

export const getAuthToken = () => {
  return localStorage.getItem('access_token');
};
