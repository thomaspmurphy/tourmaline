const API_BASE_URL = '/api/v1'

export interface Thread {
  id: number
  title: string
  content: string
  user_id: number
  created_at: string
  updated_at: string
  posts_count: number
  posts?: Post[]
  user: {
    id: number
    username: string
  }
}

export interface Post {
  id: number
  content: string
  user_id: number
  thread_id: number
  created_at: string
  updated_at: string
  user: {
    id: number
    username: string
  }
}

export interface User {
  id: number
  username: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  password_confirmation: string
  username: string
}

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  }

  private setAuthToken(token: string): void {
    localStorage.setItem('authToken', token)
  }

  private removeAuthToken(): void {
    localStorage.removeItem('authToken')
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = this.getAuthToken()
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      if (response.status === 401) {
        this.removeAuthToken()
        throw new Error('Authentication required')
      }
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: credentials }),
    })

    if (!response.ok) {
      throw new Error('Invalid credentials')
    }

    const data = await response.json()
    const { token, ...user } = data
    
    if (!token) {
      throw new Error('No token received')
    }

    this.setAuthToken(token)
    
    return { user, token }
  }

  async signup(credentials: SignupCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch('/api/v1/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: credentials }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.errors?.join(', ') || 'Signup failed')
    }

    const data = await response.json()
    const { token, ...user } = data
    
    if (!token) {
      throw new Error('No token received')
    }

    this.setAuthToken(token)
    
    return { user, token }
  }

  async logout(): Promise<void> {
    const token = this.getAuthToken()
    if (token) {
      try {
        await fetch('/api/v1/users/logout', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    this.removeAuthToken()
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }

  // Thread methods
  async getThreads(): Promise<Thread[]> {
    return this.request<Thread[]>('/threads')
  }

  async getThread(id: number): Promise<Thread> {
    return this.request<Thread>(`/threads/${id}`)
  }

  async createThread(data: { title: string; content: string }): Promise<Thread> {
    return this.request<Thread>('/threads', {
      method: 'POST',
      body: JSON.stringify({ thread: data }),
    })
  }

  // Post methods
  async createPost(threadId: number, content: string): Promise<Post> {
    return this.request<Post>(`/threads/${threadId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ post: { content } }),
    })
  }

  // User methods
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/current_user')
  }
}

export const apiService = new ApiService() 