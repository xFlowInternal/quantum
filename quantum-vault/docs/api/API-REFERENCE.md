# API Reference

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.quantumvault.example/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}

Response: 201 Created
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "timestamp"
  },
  "token": "jwt_token"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "username": "string"
  },
  "token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "string"
}

Response: 200 OK
{
  "token": "new_jwt_token",
  "refresh_token": "new_refresh_token"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "created_at": "timestamp",
  "last_login": "timestamp"
}
```

### Users

#### Get User
```http
GET /api/users/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "username": "string",
  "public_key_ecc": "string",
  "public_key_pqc": "string",
  "created_at": "timestamp"
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "string",
  "public_key_ecc": "string",
  "public_key_pqc": "string"
}

Response: 200 OK
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "updated_at": "timestamp"
}
```

### Messages

#### Get Messages
```http
GET /api/messages?recipient_id=uuid&limit=50&offset=0
Authorization: Bearer <token>

Response: 200 OK
{
  "messages": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "recipient_id": "uuid",
      "encrypted_content": "string",
      "iv": "string",
      "created_at": "timestamp",
      "read_at": "timestamp"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

#### Send Message
```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_id": "uuid",
  "encrypted_content": "string",
  "iv": "string"
}

Response: 201 Created
{
  "id": "uuid",
  "sender_id": "uuid",
  "recipient_id": "uuid",
  "created_at": "timestamp"
}
```

#### Delete Message
```http
DELETE /api/messages/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Message deleted successfully"
}
```

### Cryptography

#### Exchange Keys
```http
POST /api/crypto/exchange-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_id": "uuid",
  "public_key_ecc": "string",
  "public_key_pqc": "string"
}

Response: 200 OK
{
  "recipient_public_key_ecc": "string",
  "recipient_public_key_pqc": "string"
}
```

#### Get Public Key
```http
GET /api/crypto/public-key/:user_id
Authorization: Bearer <token>

Response: 200 OK
{
  "user_id": "uuid",
  "public_key_ecc": "string",
  "public_key_pqc": "string"
}
```

### Health & Metrics

#### Health Check
```http
GET /api/health

Response: 200 OK
{
  "status": "healthy",
  "timestamp": "timestamp",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

#### Metrics
```http
GET /metrics

Response: 200 OK
# Prometheus format metrics
```

## WebSocket Events

### Connection
```javascript
socket.on('connect', () => {
  console.log('Connected');
});
```

### Authentication
```javascript
socket.emit('authenticate', { token: 'jwt_token' });

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});

socket.on('unauthorized', (error) => {
  console.error('Unauthorized:', error);
});
```

### Messages
```javascript
// Send message
socket.emit('message:send', {
  recipient_id: 'uuid',
  encrypted_content: 'string',
  iv: 'string'
});

// Receive message
socket.on('message:receive', (message) => {
  console.log('New message:', message);
});

// Message sent confirmation
socket.on('message:sent', (data) => {
  console.log('Message sent:', data);
});
```

### Typing Indicators
```javascript
// Start typing
socket.emit('typing:start', { recipient_id: 'uuid' });

// Stop typing
socket.emit('typing:stop', { recipient_id: 'uuid' });

// Receive typing indicator
socket.on('typing:indicator', (data) => {
  console.log('User typing:', data.user_id);
});
```

### Read Receipts
```javascript
// Mark as read
socket.emit('read:receipt', { message_id: 'uuid' });

// Receive read receipt
socket.on('read:confirmation', (data) => {
  console.log('Message read:', data.message_id);
});
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2025-12-01T12:00:00Z"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_INPUT | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- API endpoints: 100 requests per minute
- WebSocket messages: 50 messages per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

## Pagination

List endpoints support pagination:
```
?limit=50&offset=0
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "total": 1000,
  "limit": 50,
  "offset": 0
}
```

## Versioning

API version is included in the URL:
```
/api/v1/...
```

Current version: v1
