# Quantum Vault - System Architecture

## Overview

Quantum Vault is a hybrid quantum-classical secure chat application that combines traditional cryptography (ECC) with post-quantum cryptography (PQC) and quantum random number generation (QRNG).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   Chat   │  │  Crypto  │  │   UI     │   │
│  │  Module  │  │  Module  │  │  Module  │  │Components│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                          │                                    │
│                    WebSocket/HTTP                             │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    Backend API                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   Chat   │  │  Crypto  │  │Middleware│   │
│  │  Routes  │  │  Routes  │  │  Routes  │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                          │                                    │
└──────────────────────────┼──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                   │
┌───────▼────────┐  ┌─────▼──────┐  ┌────────▼────────┐
│   PostgreSQL   │  │   Redis    │  │  Crypto Module  │
│   (Primary DB) │  │  (Cache/   │  │  ┌───────────┐  │
│                │  │  Sessions) │  │  │    ECC    │  │
└────────────────┘  └────────────┘  │  ├───────────┤  │
                                     │  │    PQC    │  │
                                     │  ├───────────┤  │
                                     │  │   QRNG    │  │
                                     │  └───────────┘  │
                                     └─────────────────┘
```

## Technology Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **State Management:** React Context + Hooks
- **WebSocket:** Socket.io-client
- **Crypto:** Web Crypto API + Custom PQC

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **WebSocket:** Socket.io
- **Authentication:** JWT + WebAuthn
- **ORM:** Custom (pg driver)

### Database
- **Primary:** PostgreSQL 15
- **Cache:** Redis 7
- **Session Store:** Redis

### Cryptography
- **Classical:** ECC (P-256) via Web Crypto API
- **Post-Quantum:** Kyber-768 (KEM), Dilithium-3 (Signatures)
- **Random:** ANU QRNG API

### DevOps
- **Containerization:** Docker
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Security Scanning:** CodeQL, Snyk, OWASP ZAP

## Component Details

### 1. Authentication System

**Features:**
- Username/password authentication
- WebAuthn (passwordless)
- JWT-based sessions
- Refresh token rotation
- Rate limiting

**Flow:**
```
User → Frontend → Backend API → PostgreSQL
                      ↓
                   Redis (Session)
```

### 2. Chat System

**Features:**
- Real-time messaging via WebSocket
- End-to-end encryption
- Message persistence
- Typing indicators
- Read receipts

**Flow:**
```
User A → Encrypt → WebSocket → Backend → WebSocket → Decrypt → User B
                                  ↓
                            PostgreSQL (Store)
```

### 3. Cryptography Module

**Hybrid Encryption:**
1. Generate QRNG-based keys
2. Establish ECC key exchange
3. Establish PQC key exchange
4. Combine keys for hybrid security
5. Encrypt messages with combined key

**Key Exchange:**
```
User A                          User B
  │                               │
  ├─ Generate ECC keypair         │
  ├─ Generate PQC keypair         │
  │                               │
  ├──── Send Public Keys ────────>│
  │<──── Send Public Keys ────────┤
  │                               │
  ├─ Derive ECC shared secret     │
  ├─ Derive PQC shared secret     │
  ├─ Combine secrets              │
  │                               │
  └─ Encrypt/Decrypt messages ────┘
```

## Data Models

### Users
```sql
- id (UUID)
- username (unique)
- email
- password_hash
- public_key_ecc
- public_key_pqc
- created_at
- updated_at
- last_login
- is_active
- is_verified
```

### Messages
```sql
- id (UUID)
- sender_id (FK)
- recipient_id (FK)
- encrypted_content
- iv (initialization vector)
- created_at
- read_at
```

### Sessions
```sql
- id (UUID)
- user_id (FK)
- token_hash
- refresh_token_hash
- expires_at
- device_info
- ip_address
- created_at
```

## Security Architecture

### Defense in Depth

1. **Transport Layer:** TLS 1.3
2. **Application Layer:** JWT authentication
3. **Data Layer:** End-to-end encryption
4. **Quantum-Resistant:** PQC algorithms

### Security Measures

- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention (Content Security Policy)
- CSRF protection
- Rate limiting
- Audit logging
- Regular security scans

## Performance Considerations

### Optimization Strategies

1. **Database:**
   - Connection pooling
   - Indexed queries
   - Query optimization

2. **Caching:**
   - Redis for sessions
   - Redis for frequently accessed data
   - Client-side caching

3. **WebSocket:**
   - Connection pooling
   - Message batching
   - Compression

4. **Crypto:**
   - Web Workers for heavy operations
   - Key caching
   - Optimized algorithms

## Scalability

### Horizontal Scaling

- Stateless backend servers
- Redis for shared sessions
- Load balancer (future)
- Database replication (future)

### Vertical Scaling

- Optimized queries
- Efficient algorithms
- Resource monitoring

## Monitoring & Observability

### Metrics Collected

- Request latency
- Error rates
- Database query performance
- WebSocket connections
- Crypto operation timing
- Memory usage
- CPU usage

### Logging

- Application logs
- Access logs
- Error logs
- Audit logs
- Security events

## Deployment Architecture

### Development
```
Laptop → Docker Compose → PostgreSQL + Redis + Backend + Frontend
```

### Production (Week 11+)
```
GitHub → CI/CD → Docker Registry → Cloud Platform
                                      ↓
                              Load Balancer
                                      ↓
                          ┌───────────┴───────────┐
                    Backend 1              Backend 2
                          │                       │
                    ┌─────┴─────┐           ┌────┴─────┐
              PostgreSQL      Redis    PostgreSQL    Redis
```

## API Design

### RESTful Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/messages
POST   /api/messages
GET    /api/messages/:id
DELETE /api/messages/:id

POST   /api/crypto/exchange-keys
GET    /api/crypto/public-key
```

### WebSocket Events

```
connect
disconnect
authenticate
message:send
message:receive
typing:start
typing:stop
read:receipt
```

## Error Handling

### Error Categories

1. **Client Errors (4xx):**
   - 400 Bad Request
   - 401 Unauthorized
   - 403 Forbidden
   - 404 Not Found
   - 429 Too Many Requests

2. **Server Errors (5xx):**
   - 500 Internal Server Error
   - 503 Service Unavailable

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {},
    "timestamp": "2025-12-01T12:00:00Z"
  }
}
```

## Future Enhancements

- Group chat support
- File sharing with encryption
- Voice/video calls
- Mobile applications
- Federation support
- Blockchain audit trail
