# Tourmaline Forum Authentication System

## Overview

Tourmaline Forum uses a **JWT (JSON Web Token) based authentication system** for API endpoints. This provides stateless authentication that's perfect for modern web applications with separate frontend and backend components.

## Architecture

### Components

1. **JWT Token Generation**: Login/signup endpoints generate JWT tokens
2. **Token Validation**: Base controller validates tokens on protected endpoints
3. **Frontend Token Management**: JavaScript service handles token storage and inclusion in requests
4. **User Session Management**: Tokens contain user identification for request context

### Flow Diagram

```
┌─────────────┐    POST /api/v1/users/login     ┌─────────────┐
│   Frontend  │ ──────────────────────────────► │   Backend   │
│             │                                 │             │
│             │ ◄────────── JWT Token ────────── │             │
└─────────────┘                                 └─────────────┘
       │                                               │
       │ Store token in localStorage                   │
       │                                               │
       │    Authenticated API Request                  │
       │ ──────────────────────────────────────────► │
       │    Authorization: Bearer <token>              │
       │                                               │
       │ ◄────────── API Response ─────────────────── │
```

## Backend Implementation

### Base Controller (`app/controllers/api/v1/base_controller.rb`)

The base controller handles JWT authentication for all API endpoints:

```ruby
class Api::V1::BaseController < ActionController::API
  before_action :authenticate_user!

  private

  def authenticate_user!
    token = request.headers['Authorization']&.split(' ')&.last
    return render json: { error: 'No token provided' }, status: :unauthorized unless token

    begin
      secret = Rails.application.credentials.devise_jwt_secret_key || Rails.application.secret_key_base
      decoded_token = JWT.decode(token, secret, true, { algorithm: 'HS256' }).first
      @current_user = User.find(decoded_token['sub'])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render json: { error: 'Invalid token' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end
end
```

**Key Features:**
- Automatically validates JWT tokens on all API requests
- Sets `@current_user` for use in controllers
- Returns 401 Unauthorized for invalid/missing tokens
- Uses Rails secret key for token verification

### Authentication Endpoints

#### Login (`app/controllers/api/v1/sessions_controller.rb`)

```ruby
class Api::V1::SessionsController < Api::V1::BaseController
  skip_before_action :authenticate_user!

  def create
    user = User.find_by(email: params[:user][:email])
    
    if user&.valid_password?(params[:user][:password])
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
      render json: {
        id: user.id,
        email: user.email,
        username: user.username,
        token: token
      }, status: :ok
    else
      render json: { error: 'Invalid email or password' }, status: :unauthorized
    end
  end
end
```

**Endpoint:** `POST /api/v1/users/login`

**Request Body:**
```json
{
  "user": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**Response (Success):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

#### Signup (`app/controllers/api/v1/registrations_controller.rb`)

```ruby
class Api::V1::RegistrationsController < Api::V1::BaseController
  skip_before_action :authenticate_user!

  def create
    user = User.new(user_params)
    
    if user.save
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
      render json: {
        id: user.id,
        email: user.email,
        username: user.username,
        token: token
      }, status: :created
    else
      render json: {
        errors: user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
end
```

**Endpoint:** `POST /api/v1/users/signup`

**Request Body:**
```json
{
  "user": {
    "email": "newuser@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "username": "newuser"
  }
}
```

### Protected Endpoints

All other API controllers inherit from `Api::V1::BaseController` and automatically require authentication:

```ruby
class Api::V1::ThreadsController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [:index, :show] # Public endpoints
  
  def create
    @thread = current_user.forum_threads.build(thread_params) # Uses authenticated user
    # ...
  end
end
```

## Frontend Implementation

### API Service (`app/javascript/services/api.ts`)

The frontend API service handles token management:

```typescript
class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  }

  private setAuthToken(token: string): void {
    localStorage.setItem('authToken', token)
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken()
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`/api/v1${endpoint}`, config)
    
    if (!response.ok) {
      if (response.status === 401) {
        this.removeAuthToken() // Auto-logout on auth failure
        throw new Error('Authentication required')
      }
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: credentials }),
    })

    if (!response.ok) {
      throw new Error('Invalid credentials')
    }

    const data = await response.json()
    const { token, ...user } = data
    
    this.setAuthToken(token) // Store token for future requests
    return { user, token }
  }
}
```

### Token Storage

- **Storage Method**: `localStorage` (persists across browser sessions)
- **Key**: `authToken`
- **Format**: Raw JWT token string
- **Auto-cleanup**: Removed on 401 responses or explicit logout

## Security Features

### JWT Token Structure

```json
{
  "sub": "2",           // User ID
  "scp": "user",        // Scope
  "aud": null,          // Audience
  "iat": 1748377285,    // Issued at
  "exp": 1748463685,    // Expires at (24 hours)
  "jti": "unique-id"    // JWT ID (prevents replay)
}
```

### Security Measures

1. **Token Expiration**: Tokens expire after 24 hours
2. **Secure Secret**: Uses Rails credentials or secret key base
3. **HTTPS Only**: Should be used with HTTPS in production
4. **No Sensitive Data**: Tokens only contain user ID, no passwords
5. **Stateless**: No server-side session storage required

### Error Handling

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| No token provided | 401 | `{"error": "No token provided"}` |
| Invalid token | 401 | `{"error": "Invalid token"}` |
| Expired token | 401 | `{"error": "Invalid token"}` |
| User not found | 401 | `{"error": "Invalid token"}` |
| Invalid credentials | 401 | `{"error": "Invalid email or password"}` |

## Usage Examples

### Login Flow

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"demo@example.com","password":"password123"}}'

# Response:
# {"id":2,"email":"demo@example.com","username":"demo","token":"eyJ..."}

# 2. Use token for authenticated request
curl -X POST http://localhost:3000/api/v1/threads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ..." \
  -d '{"thread":{"title":"My Thread","content":"Hello world"}}'
```

### Frontend Usage

```typescript
// Login
const { user, token } = await apiService.login({
  email: 'user@example.com',
  password: 'password123'
})

// Token is automatically stored and used for subsequent requests
const threads = await apiService.getThreads() // Includes auth header
const newThread = await apiService.createThread({
  title: 'My Thread',
  content: 'Hello world'
})
```

## Configuration

### Environment Setup

1. **JWT Secret**: Set in Rails credentials or use default secret key base
2. **Token Expiration**: Configured in Devise JWT settings (default: 24 hours)
3. **CORS**: Configured to allow Authorization headers

### Devise JWT Configuration (`config/initializers/devise.rb`)

```ruby
config.jwt do |jwt|
  jwt.secret = Rails.application.credentials.devise_jwt_secret_key || Rails.application.secret_key_base
  jwt.dispatch_requests = [
    ['POST', %r{^/api/v1/users/login$}],
    ['POST', %r{^/api/v1/users/signup$}]
  ]
  jwt.revocation_requests = [
    ['DELETE', %r{^/api/v1/users/logout$}]
  ]
  jwt.expiration_time = 1.day.to_i
end
```

## Troubleshooting

### Common Issues

1. **"No token provided"**: Ensure `Authorization: Bearer <token>` header is included
2. **"Invalid token"**: Check token hasn't expired or been corrupted
3. **CORS errors**: Verify CORS configuration allows Authorization headers
4. **Token not persisting**: Check localStorage is working in browser

### Debugging

```ruby
# In Rails console - test token generation/validation
user = User.first
token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
decoded = JWT.decode(token, Rails.application.secret_key_base, true, { algorithm: 'HS256' })
```

## Best Practices

1. **Use HTTPS**: Always use HTTPS in production to protect tokens
2. **Token Rotation**: Consider implementing refresh tokens for long-lived sessions
3. **Logout Cleanup**: Clear tokens from localStorage on logout
4. **Error Handling**: Gracefully handle auth failures in frontend
5. **Token Validation**: Always validate tokens server-side
6. **Secure Storage**: Consider more secure storage than localStorage for sensitive apps

## Migration from Session-Based Auth

If migrating from session-based authentication:

1. Keep existing Devise configuration for web routes
2. Add JWT endpoints for API routes
3. Update frontend to use token-based auth
4. Test both systems work independently
5. Gradually migrate features to API endpoints

This JWT authentication system provides a robust, scalable foundation for the Tourmaline Forum application while maintaining security best practices. 