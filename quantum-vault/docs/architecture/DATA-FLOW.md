# Data Flow Documentation

## Message Flow

### 1. User Registration

```
User Input → Frontend Validation → Backend API
                                      ↓
                              Password Hashing
                                      ↓
                              PostgreSQL Insert
                                      ↓
                              Generate Keys
                                      ↓
                              Return Success
```

### 2. User Login

```
Credentials → Frontend → Backend
                           ↓
                    Verify Password
                           ↓
                    Generate JWT
                           ↓
                    Store in Redis
                           ↓
                    Return Token
```

### 3. Send Message

```
Message → Encrypt (ECC+PQC) → WebSocket → Backend
                                            ↓
                                    Validate Session
                                            ↓
                                    Store in PostgreSQL
                                            ↓
                                    Forward to Recipient
                                            ↓
                                    Decrypt → Display
```

### 4. Key Exchange

```
User A                          Backend                         User B
  │                               │                               │
  ├─ Generate Keys                │                               │
  ├─ Send Public Keys ───────────>│                               │
  │                               ├─ Store Keys                   │
  │                               ├─ Notify User B ──────────────>│
  │                               │                               ├─ Generate Keys
  │                               │<──── Send Public Keys ────────┤
  │<──── Forward Keys ────────────┤                               │
  │                               │                               │
  ├─ Derive Shared Secret         │                               ├─ Derive Shared Secret
  │                               │                               │
  └─ Ready to Communicate ────────┴───────────────────────────────┘
```

## Database Transactions

### Create User Transaction

```sql
BEGIN;
  INSERT INTO users (username, email, password_hash) VALUES (...);
  INSERT INTO audit_logs (user_id, action) VALUES (...);
COMMIT;
```

### Send Message Transaction

```sql
BEGIN;
  INSERT INTO messages (sender_id, recipient_id, encrypted_content) VALUES (...);
  UPDATE users SET last_active = NOW() WHERE id = sender_id;
  INSERT INTO audit_logs (user_id, action) VALUES (...);
COMMIT;
```

## Caching Strategy

### Session Cache (Redis)

```
Key: session:{session_id}
Value: {user_id, username, expires_at}
TTL: 24 hours
```

### User Cache (Redis)

```
Key: user:{user_id}
Value: {username, public_keys, last_active}
TTL: 1 hour
```

### Rate Limit Cache (Redis)

```
Key: ratelimit:{ip}:{endpoint}
Value: request_count
TTL: 60 seconds
```
