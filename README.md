# Tourmaline

A modern forum application built with Ruby on Rails and React, featuring JWT-based authentication and a clean, responsive UI.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication system
- 💬 **Threads** - Create and participate in discussions
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- ⚡ **Real-time Updates** - Dynamic content loading using ActionCable and Redux
- 🔒 **Role-based Access** - Public and authenticated content areas

```bash
# Run all tests
bun run test:all
```

## Tech Stack

- **Backend**: Ruby on Rails 8.0, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS
- **Authentication**: JWT with Devise
- **Build Tools**: Bun, esbuild, Tailwind CSS
- **UI Components**: shadcn/ui
- **Testing**: RSpec (backend), Vitest + React Testing Library (frontend)

## Quick Start

### Prerequisites

- Ruby 3.4.4
- Bun 1.2+
- PostgreSQL
- Bundler

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tourmaline
   ```

2. **Install dependencies**
   ```bash
   bundle install
   bun install
   ```

3. **Setup database**
   ```bash
   rails db:create
   rails db:migrate
   rails db:seed
   ```

4. **Start the development server**
   ```bash
   bin/dev
   ```

   This starts both the Rails server and asset building processes.

5. **Visit the application**
   Open http://localhost:3000 in your browser

### Demo Credentials

- **Email**: `demo@example.com`
- **Password**: `password123`

## Documentation

- **[Authentication System](AUTHENTICATION.md)** - Comprehensive guide to JWT authentication
- **API Endpoints** - OpenAPI documentation (coming soon)
- **Frontend Architecture** - React component structure description (coming soon)

## Development

### Running Tests

#### Quick Test Commands

```bash
# Run all tests (backend + frontend)
bun run test:all

# Run backend tests only
bundle exec rspec

# Run frontend tests only
bun run test:run
```

#### Backend Tests (RSpec)

```bash
# Run all backend tests
bundle exec rspec

# Run with documentation format
bundle exec rspec --format documentation

# Run specific test files
bundle exec rspec spec/models/
bundle exec rspec spec/requests/api/v1/

# Run with coverage (if configured)
COVERAGE=true bundle exec rspec
```

**Backend Test Coverage:**
- Model validations and associations
- API endpoint functionality
- Authentication and authorization
- Error handling and edge cases
- Cable subscription and broadcasting

#### Frontend Tests (Vitest + React Testing Library)

```bash
# Run all frontend tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests once (CI mode)
bun run test:run

# Run with coverage
bun run test:coverage
```

**Frontend Test Coverage:**
- React component rendering and behavior
- User interactions and form submissions
- Redux state management
- Authentication flows
- Error states and loading states

#### Test Structure

```
Backend Tests (RSpec):
spec/
├── factories/              # Test data factories
├── models/                 # Model unit tests
├── requests/api/v1/        # API integration tests
└── support/                # Test helpers

Frontend Tests (Vitest):
app/javascript/
├── components/             # Component tests
│   ├── ThreadList.test.tsx
│   └── ThreadView.test.tsx
├── store/slices/           # Redux slice tests
│   └── threadsSlice.test.ts
└── test/                   # Test utilities
    ├── setup.ts
    └── utils.tsx
```

### Asset Building

The application uses `bin/dev` which runs:
- Rails server on port 3000
- Tailwind CSS compilation (watch mode) via Bun
- esbuild for JavaScript bundling (watch mode)

For manual asset building:
```bash
# Tailwind CSS
bunx tailwindcss -i ./app/javascript/styles/application.css -o ./app/assets/builds/application.css --watch

# JavaScript bundling
bun run build
```

### API Testing

```bash
# Login
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"demo@example.com","password":"password123"}}'

# Create thread (with token)
curl -X POST http://localhost:3000/api/v1/threads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"thread":{"title":"Test Thread","content":"Hello world"}}'
```

## Project Structure

```
tourmaline/
├── app/
│   ├── controllers/
│   │   └── api/v1/          # API controllers
│   ├── javascript/
│   │   ├── components/      # React components
│   │   ├── services/        # API service layer
│   │   ├── store/          # Redux store
│   │   └── test/           # Frontend test utilities
│   ├── models/             # Rails models
│   └── views/              # Rails views
├── config/                 # Rails configuration
├── db/                     # Database files
├── spec/                   # Backend tests (RSpec)
├── package.json            # Bun dependencies
├── vitest.config.ts        # Frontend test configuration
└── public/                 # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. **Run tests** to ensure everything works:
   ```bash
   bundle exec rspec        # Backend tests
   bun run test:run        # Frontend tests
   ```
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Linting

### Ruby (Rubocop)
- Run `bundle exec rubocop` to lint Ruby files.
- Rubocop config is in `.rubocop.yml`.

### JavaScript/TypeScript (ESLint)
- Run `bun run lint` or `npm run lint` to lint JS/TS files in `app/javascript`.
- To auto-fix, use `bun run lint --fix`.
- ESLint config is in `.eslintrc.json`.
- If you see `React version not specified in eslint-plugin-react settings`, add this to your `.eslintrc.json`:
  ```json
  "settings": {
    "react": {
      "version": "detect"
    }
  }
  ```

### Rails 8 ActionCable Note
- In Rails 8, `ActionCable.server.broadcast` requires a `coder:` keyword argument. Example:
  ```ruby
  ActionCable.server.broadcast("threads", { thread: ... }, coder: ActiveSupport::JSON)
  ```
- See the codebase for examples.

### Backlog
- [ ] Ability to sign in and personalise account (upload an avatar and add a signature).
- [ ] Streamline UI to respond to the real-time behaviour more dynamically.
- [ ] Improve post editing experience - add ability to embed media and use markdown.
- [ ] Design is essentialy generic shadcn stuff, requires some personalisation.
- [ ] Code interfacing with ActionCable channels from the client could be generalised and extracted.
- [ ] API design - might be an idea to use patterns like blueprints/dry validations for a more scaleable API.