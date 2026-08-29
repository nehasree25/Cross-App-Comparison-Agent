import axios, { AxiosInstance } from 'axios';

interface User {
  id: number;
  username: string;
}

interface Token {
  access_token: string;
  token_type: string;
}

interface UserCreate {
  username: string;
  password: string;
}

interface ProductResult {
  product_id: string;
  product_name: string;
  brand: string;
  category: string;
  final_price: number;
  merchant: string;
  rating: number;
  review_count: number;
  delivery_time_days: number;
  in_stock: boolean;
}

interface RecommendedProduct {
  product_id: string;
  product_name: string;
  brand: string;
  final_price: number;
  merchant: string;
  rating: number;
  delivery_time_days: number;
  reason: string;
}

interface AgentChatResponse {
  message: string;
  recommended_product: RecommendedProduct | null;
  products: ProductResult[];
}

interface AgentChatRequest {
  message: string;
}

interface ComparisonSession {
  id: number;
  user_id: number;
  user_query: string;
  category: string;
  product_count: number;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth endpoints
  async register(username: string, password: string): Promise<User> {
    const response = await this.client.post<User>('/auth/register', {
      username,
      password,
    });
    return response.data;
  }

  async login(username: string, password: string): Promise<Token> {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await this.client.post<Token>('/auth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Agent endpoints
  async getRecommendations(query: string): Promise<AgentChatResponse> {
    const response = await this.client.post<AgentChatResponse>('/api/recommendations', {
      message: query,
    });
    return response.data;
  }

  async getComparisonHistory(): Promise<ComparisonSession[]> {
    const response = await this.client.get<ComparisonSession[]>('/api/comparison-history');
    return response.data;
  }
}

export default new ApiService();
export type {
  User,
  Token,
  UserCreate,
  ProductResult,
  RecommendedProduct,
  AgentChatResponse,
  AgentChatRequest,
  ComparisonSession,
};
