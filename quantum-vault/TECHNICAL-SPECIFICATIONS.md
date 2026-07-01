# Quantum Vault: Technical Specifications

**Version:** 1.0.0  
**Last Updated:** December 1, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [API Specifications](#api-specifications)
5. [Database Schema](#database-schema)
6. [Security Specifications](#security-specifications)
7. [Performance Specifications](#performance-specifications)
8. [Scalability](#scalability)
9. [Monitoring & Logging](#monitoring--logging)
10. [Compliance & Standards](#compliance--standards)

---

## System Overview

### Purpose

Quantum Vault is a secure, real-time messaging platform that provides:
- End-to-end encrypted messaging
- Quantum-resistant cryptography
- Real-time communication via WebSocket
- User authentication and session management
- Audit logging and security monitoring

### Key Features

**Security:**
- End-to-end encryption (ECC P-256 + AES-GCM-256)
- Post-quantum cryptography (ML-KEM-768, ML-DSA-65)
- Quantum random number generation (ANU QRNG)
- Hybrid encryption (classical + quantum-resistant)
- JWT-based authentication
- Rate limiting and DDoS protection

**Messaging:**
- Real-time bidirectional communication
- Typing indicators
- Read receipts
- Online/offline status
- Message history
- Soft delete functionality

**Performance:**
- <100ms API response times
- >90% test coverage
- Redis caching (92%+ hit rate)
- Connection pooling
- Optimized database queries

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Browser    │  │    Mobile    │  │   Desktop    │     │
│  │  (React 18)  │  │ (Coming Soon)│  │(Coming Soon) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Load Balancer │
                    │   (Optional)    │
                    └────────┬────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────┐              ┌───────────▼──────────┐
│  Application Layer │              │   WebSocket Layer    │
│                    │              │                      │
│  ┌──────────────┐ │              │  ┌────────────────┐ │
│  │   Express    │ │              │  │   Socket.io    │ │
│  │   REST API   │ │              │  │   Real-time    │ │
│  └──────┬───────┘ │              │  └────────┬───────┘ │
│         │         │              │           │         │
│  ┌──────▼───────┐ │              │  ┌────────▼───────┐ │
│  │ Auth Service │ │              │  │ Chat Handler   │ │
│  └──────┬───────┘ │              │  └────────┬───────┘ │
│         │         │              │           │         │
│  ┌──────▼───────┐ │              │  ┌────────▼───────┐ │
│  │Crypto Service│ │              │  │Message Service │ │
│  └──────────────┘ │              │  └────────────────┘ │
└───────────┬───────┘              └───────────┬─────────┘
            │                                  │
            └──────────────┬───────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼─────────┐          ┌───────────▼──────────┐
│   Data Layer      │          │    Cache Layer       │
│                   │          │                      │
│  ┌─────────────┐ │          │  ┌────────────────┐ │
│  │ PostgreSQL  │ │          │  │     Redis      │ │
│  │   Database  │ │          │  │   Cache/Queue  │ │
│  └─────────────┘ │          │  └────────────────┘ │
└───────────────────┘          └─────────────────────┘
```

### Component Architecture

**Frontend (React 18):**
```
src/
├── components/        # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── chat/         # Chat components
│   └── crypto/       # Crypto status components
├── contexts/         # React Context providers
│   ├── AuthContext   # Authentication state
│   └── ChatContext   # Chat state
├── pages/            # Page components
│   ├── Login         # Login page
│   ├── Register      # Registration page
│   ├── Dashboard     # User dashboard
│   ├── Chat          # Chat interface
│   └── Profile       # User profile
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
│   ├── crypto.js     # Cryptography utilities
│   └── qrng.js       # QRNG client
└── App.jsx           # Main application
```

**Backend (Node.js + Express):**
```
src/
├── auth/             # Authentication logic
│   └── jwt.js        # JWT service
├── middleware/       # Express middleware
│   ├── auth.js       # Auth middleware
│   ├── rateLimiter.js# Rate limiting
│   └── validator.js  # Input validation
├── routes/           # API routes
│   ├── auth.js       # Auth endpoints
│   ├── users.js      # User endpoints
│   ├── messages.js   # Message endpoints
│   └── qrng.js       # QRNG endpoints
├── models/           # Data models
│   ├── User.js       # User model
│   ├── Message.js    # Message model
│   └── Session.js    # Session model
├── socket/           # WebSocket handlers
│   └── socketHandler.js
├── database/         # Database utilities
│   ├── connection.js # DB connection
│   ├── redis.js      # Redis client
│   └── transactions.js
├── utils/            # Utility functions
│   └── metrics.js    # Metrics collection
└── app.js            # Express app
```

**Crypto Module:**
```
crypto/
├── ecc/              # ECC cryptography
│   └── eccCrypto.js  # ECC implementation
├── pqc/              # Post-quantum crypto
│   ├── kyber.js      # ML-KEM-768
│   ├── dilithium.js  # ML-DSA-65
│   └── hybrid.js     # Hybrid crypto
├── qrng/             # Quantum RNG
│   └── qrngService.js# QRNG service
├── tests/            # Crypto tests
└── benchmarks/       # Performance tests
```

---

## Technology Stack

### Backend Technologies

**Runtime & Framework:**
- **Node.js:** 20.x LTS
- **Express.js:** 4.x
- **Socket.io:** 4.x (WebSocket)

**Database:**
- **PostgreSQL:** 15.x (Primary database)
- **Redis:** 7.x (Cache & sessions)

**Authentication:**
- **JWT:** JSON Web Tokens
- **bcrypt:** Password hashing (cost factor 12)

**Cryptography:**
- **Web Crypto API:** ECC P-256, AES-GCM
- **pqc library:** ML-KEM-768, ML-DSA-65
- **ANU QRNG API:** Quantum random numbers

**Testing:**
- **Jest:** Unit & integration testing
- **Supertest:** API testing
- **Coverage:** >90%

**Security:**
- **Helmet:** Security headers
- **express-validator:** Input validation
- **express-rate-limit:** Rate limiting

**Monitoring:**
- **Prometheus:** Metrics collection
- **Grafana:** Visualization
- **Winston:** Logging

### Frontend Technologies

**Framework & Build:**
- **React:** 18.x
- **Vite:** 5.x (Build tool)
- **React Router:** 6.x (Routing)

**State Management:**
- **React Context API:** Global state
- **Custom Hooks:** Reusable logic

**HTTP & WebSocket:**
- **Axios:** HTTP client
- **Socket.io-client:** WebSocket client

**Styling:**
- **CSS3:** Modern CSS
- **CSS Modules:** Scoped styles

**Testing:**
- **Vitest:** Unit testing
- **React Testing Library:** Component testing

### DevOps & CI/CD

**Version Control:**
- **Git:** Source control
- **GitHub:** Repository hosting

**CI/CD:**
- **GitHub Actions:** Automated workflows
- **15 Jobs:** Testing, security, deployment

**Containerization:**
- **Docker:** 27.x
- **Docker Compose:** Multi-container setup

**Process Management:**
- **PM2:** Production process manager

**Reverse Proxy:**
- **Nginx:** (Optional) Load balancing

---

## API Specifications

### REST API Endpoints

**Base URL:** `https://api.quantum-vault.example.com`

**Authentication:** Bearer token in Authorization header

#### Authentication Endpoints

**POST /api/auth/register**
```json
Request:
{
  "username": "string (3-30 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, complex)"
}

Response (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "created_at": "timestamp"
    },
    "tokens": {
      "accessToken": "jwt",
      "refreshToken": "jwt"
    }
  }
}

Errors:
400 - Validation error
409 - Username/email already exists
500 - Server error
```

**POST /api/auth/login**
```json
Request:
{
  "username": "string",
  "password": "string"
}

Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "last_login": "timestamp"
    },
    "tokens": {
      "accessToken": "jwt",
      "refreshToken": "jwt"
    }
  }
}

Errors:
400 - Validation error
401 - Invalid credentials
429 - Too many attempts
500 - Server error
```

**POST /api/auth/logout**
```json
Request:
Headers: { "Authorization": "Bearer <token>" }

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}

Errors:
401 - Unauthorized
500 - Server error
```

**POST /api/auth/refresh**
```json
Request:
{
  "refreshToken": "jwt"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "jwt"
  }
}

Errors:
401 - Invalid refresh token
500 - Server error
```

**GET /api/auth/me**
```json
Request:
Headers: { "Authorization": "Bearer <token>" }

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "timestamp",
    "last_login": "timestamp",
    "is_active": boolean
  }
}

Errors:
401 - Unauthorized
500 - Server error
```

#### User Endpoints

**GET /api/users/:id**
```json
Request:
Headers: { "Authorization": "Bearer <token>" }

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "created_at": "timestamp",
    "is_active": boolean
  }
}

Errors:
401 - Unauthorized
404 - User not found
500 - Server error
```

**PUT /api/users/:id/keys**
```json
Request:
Headers: { "Authorization": "Bearer <token>" }
{
  "publicKeyECC": "base64",
  "publicKeyPQC": "base64"
}

Response (200):
{
  "success": true,
  "message": "Keys updated successfully"
}

Errors:
401 - Unauthorized
400 - Invalid keys
500 - Server error
```

#### Message Endpoints

**GET /api/messages/conversations**
```json
Request:
Headers: { "Authorization": "Bearer <token>" }

Response (200):
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "username": "string",
      "lastMessage": "string",
      "lastMessageTime": "timestamp",
      "unreadCount": number
    }
  ]
}

Errors:
401 - Unauthorized
500 - Server error
```

**GET /api/messages/conversation/:userId**
```json
Request:
Headers: { "Authorization": "Bearer <token>" }
Query: { "limit": number, "offset": number }

Response (200):
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "senderId": "uuid",
        "recipientId": "uuid",
        "encryptedContent": "base64",
        "iv": "base64",
        "createdAt": "timestamp",
        "readAt": "timestamp"
      }
    ],
    "total": number
  }
}

Errors:
401 - Unauthorized
404 - User not found
500 - Server error
```

**POST /api/messages**
```json
Request:
Headers: { "Authorization": "Bearer <token>" }
{
  "recipientId": "uuid",
  "encryptedContent": "base64",
  "iv": "base64"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "uuid",
    "senderId": "uuid",
    "recipientId": "uuid",
    "createdAt": "timestamp"
  }
}

Errors:
401 - Unauthorized
400 - Validation error
404 - Recipient not found
500 - Server error
```

**DELETE /api/messages/:messageId**
```json
Request:
Headers: { "Authorization": "Bearer <token>" }

Response (200):
{
  "success": true,
  "message": "Message deleted successfully"
}

Errors:
401 - Unauthorized
404 - Message not found
500 - Server error
```

#### QRNG Endpoints

**GET /api/qrng/health**
```json
Response (200):
{
  "success": true,
  "data": {
    "status": "online|offline",
    "cacheSize": number,
    "lastApiCall": "timestamp"
  }
}
```

**GET /api/qrng/metrics**
```json
Request:
Headers: { "Authorization": "Bearer <token>" }

Response (200):
{
  "success": true,
  "data": {
    "totalRequests": number,
    "cacheHits": number,
    "cacheMisses": number,
    "apiCalls": number,
    "apiFailures": number,
    "cacheHitRate": "percentage",
    "apiSuccessRate": "percentage"
  }
}

Errors:
401 - Unauthorized
500 - Server error
```

#### Health Check

**GET /api/health**
```json
Response (200):
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "timestamp",
    "services": {
      "database": "up|down",
      "redis": "up|down",
      "qrng": "up|down"
    },
    "uptime": number
  }
}
```

### WebSocket Events

**Connection:**
```javascript
// Client connects
socket.connect();

// Server authenticates
socket.on('connect', () => {
  socket.emit('authenticate', { token: 'jwt' });
});

// Authentication response
socket.on('authenticated', (data) => {
  // { success: true, userId: 'uuid' }
});
```

**Messaging Events:**

**Client → Server:**
```javascript
// Send message
socket.emit('message:send', {
  recipientId: 'uuid',
  encryptedContent: 'base64',
  iv: 'base64'
});

// Mark as read
socket.emit('message:read', {
  messageId: 'uuid'
});

// Start typing
socket.emit('typing:start', {
  recipientId: 'uuid'
});

// Stop typing
socket.emit('typing:stop', {
  recipientId: 'uuid'
});
```

**Server → Client:**
```javascript
// Receive message
socket.on('message:receive', (data) => {
  // {
  //   id: 'uuid',
  //   senderId: 'uuid',
  //   encryptedContent: 'base64',
  //   iv: 'base64',
  //   createdAt: 'timestamp'
  // }
});

// Read receipt
socket.on('message:read-receipt', (data) => {
  // {
  //   messageId: 'uuid',
  //   readAt: 'timestamp'
  // }
});

// Typing indicator
socket.on('typing:indicator', (data) => {
  // {
  //   userId: 'uuid',
  //   isTyping: boolean
  // }
});

// User status
socket.on('user:status', (data) => {
  // {
  //   userId: 'uuid',
  //   status: 'online|offline'
  // }
});
```

---

## Database Schema

### Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  public_key_ecc TEXT,
  public_key_pqc TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
```

**sessions**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  device_info TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

**messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  deleted_by_sender BOOLEAN DEFAULT false,
  deleted_by_recipient BOOLEAN DEFAULT false
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

**audit_logs**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

**performance_metrics**
```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_performance_created ON performance_metrics(created_at DESC);
```

**webauthn_credentials**
```sql
CREATE TABLE webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP
);

CREATE INDEX idx_webauthn_user_id ON webauthn_credentials(user_id);
```

**migrations**
```sql
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships

```
users (1) ──< (N) sessions
users (1) ──< (N) messages (as sender)
users (1) ──< (N) messages (as recipient)
users (1) ──< (N) audit_logs
users (1) ──< (N) webauthn_credentials
```

---

## Security Specifications

### Authentication

**JWT Tokens:**
- Algorithm: HS256
- Access Token Expiry: 24 hours
- Refresh Token Expiry: 7 days
- Secret: 256-bit minimum
- Payload: { userId, username, iat, exp }

**Password Hashing:**
- Algorithm: bcrypt
- Cost Factor: 12
- Salt: Auto-generated per password

**Session Management:**
- Stored in database and Redis
- Token blacklisting on logout
- Automatic cleanup of expired sessions

### Rate Limiting

**Login Endpoint:**
- 5 attempts per 15 minutes per IP
- Exponential backoff after failures

**Registration Endpoint:**
- 3 attempts per hour per IP

**API Endpoints:**
- 100 requests per 15 minutes per user

**WebSocket:**
- 1000 messages per hour per user

### Input Validation

**Username:**
- 3-30 characters
- Alphanumeric and underscore only
- Case-insensitive uniqueness

**Email:**
- Valid email format
- Normalized (lowercase)
- Unique

**Password:**
- Minimum 8 characters
- At least 1 uppercase
- At least 1 lowercase
- At least 1 number
- At least 1 special character

### Security Headers

```javascript
// Helmet configuration
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
})
```

---

## Performance Specifications

### Response Time Targets

| Endpoint | Target | Actual |
|----------|--------|--------|
| GET /api/health | <50ms | ~20ms |
| POST /api/auth/login | <500ms | ~300ms |
| GET /api/auth/me | <100ms | ~50ms |
| GET /api/messages/conversations | <200ms | ~100ms |
| POST /api/messages | <150ms | ~80ms |
| WebSocket message | <100ms | ~50ms |

### Throughput

| Operation | Target | Actual |
|-----------|--------|--------|
| Concurrent users | 1000+ | Tested: 100 |
| Messages/second | 100+ | Tested: 50 |
| API requests/second | 500+ | Tested: 200 |
| WebSocket connections | 1000+ | Tested: 100 |

### Resource Usage

| Resource | Target | Actual |
|----------|--------|--------|
| Memory per request | <1MB | ~0.5MB |
| CPU per request | <10ms | ~5ms |
| DB connections | <20 | ~10 |
| Redis connections | <10 | ~5 |

### Caching

**Redis Cache:**
- Session data: 24 hours TTL
- QRNG cache: 10KB buffer
- Rate limit counters: 15 minutes TTL
- Cache hit rate: >90%

**Database Query Cache:**
- Prepared statements
- Connection pooling
- Query result caching (selective)

---

## Scalability

### Horizontal Scaling

**Application Servers:**
- Stateless design
- Load balancer distribution
- Session affinity not required
- Auto-scaling based on CPU/memory

**Database:**
- Read replicas for scaling reads
- Connection pooling
- Query optimization
- Partitioning (future)

**Redis:**
- Redis Cluster for scaling
- Sentinel for high availability
- Separate instances for cache/sessions

### Vertical Scaling

**Current Limits:**
- 2 CPU cores, 2GB RAM (minimum)
- 4 CPU cores, 4GB RAM (recommended)
- 8 CPU cores, 8GB RAM (high load)

**Scaling Triggers:**
- CPU > 70% sustained
- Memory > 80% sustained
- Response time > targets
- Error rate > 1%

---

## Monitoring & Logging

### Metrics Collected

**Application Metrics:**
- Request count
- Response time (p50, p95, p99)
- Error rate
- Active connections
- Memory usage
- CPU usage

**Database Metrics:**
- Query count
- Query duration
- Connection pool usage
- Cache hit rate
- Slow queries

**Business Metrics:**
- Active users
- Messages sent
- Registration rate
- Login success rate

### Logging

**Log Levels:**
- ERROR: Application errors
- WARN: Warnings and anomalies
- INFO: Important events
- DEBUG: Detailed information

**Log Format:**
```json
{
  "timestamp": "2025-12-01T12:00:00Z",
  "level": "INFO",
  "message": "User logged in",
  "userId": "uuid",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Log Retention:**
- Application logs: 30 days
- Audit logs: 90 days
- Error logs: 90 days
- Access logs: 7 days

---

## Compliance & Standards

### Standards Followed

**Cryptography:**
- NIST FIPS 203 (ML-KEM)
- NIST FIPS 204 (ML-DSA)
- NIST SP 800-38D (AES-GCM)
- NIST SP 800-56A (ECDH)

**Security:**
- OWASP Top 10
- CWE Top 25
- SANS Top 25

**API:**
- REST principles
- OpenAPI 3.0 (future)
- JSON:API (partial)

**Code Quality:**
- ESLint rules
- Prettier formatting
- >90% test coverage
- Code review required

### Compliance

**Data Protection:**
- GDPR ready (EU)
- CCPA ready (California)
- Data encryption at rest and in transit
- Right to deletion
- Data portability

**Security:**
- Regular security audits
- Vulnerability scanning
- Penetration testing (planned)
- Incident response plan

---

## Version History

### v1.0.0 (December 1, 2025)
- Initial production release
- All core features implemented
- >90% test coverage
- Zero high/critical vulnerabilities
- Production-ready

---

**Last Updated:** December 1, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
