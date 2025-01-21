# Event Management API

A RESTful API for managing events, user registrations, and Google Calendar integration.

## Features

- User Management (CRUD operations)
- Event Management
- Event Registration System
- Google Calendar Integration
- Role-based Access Control (Staff/User)
- SQLite for Development, PostgreSQL for Production

## API Endpoints

### Users

- `GET /users` - Get all users
- `GET /users/:id` - Get specific user
- `POST /users` - Create new user
- `DELETE /users/:id` - Delete user (Staff only)

### Events

- `GET /events` - Get all events
- `GET /events/:id` - Get specific event
- `POST /events` - Create new event
- `DELETE /events/:id` - Delete event (Staff only)

### Event Registrations

- `GET /event-registrations` - Get all registrations
- `POST /event-registrations` - Create registration
- `DELETE /event-registrations/:id` - Delete registration (Staff only)

### Google Calendar Tokens

- `GET /tokens/:userId` - Get user's token
- `POST /tokens` - Save/update token

## Tech Stack

- Node.js
- Express.js
- SQLite (Development)
- PostgreSQL (Production)
- Jest (Testing)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository

```bash
git clone
cd <project-directory>
```

2. Install dependencies

```bash
npm install
```

3. Create .env file

```bash
PORT=3000
NODE_ENV=development
```

4. Start the server

```bash
# Development
npm run dev

# Production
npm start
```

### Testing

Run the test suite:

```bash
npm test
```

## Author

Luka Elizbarashvili
