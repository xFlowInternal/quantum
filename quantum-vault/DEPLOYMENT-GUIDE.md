# Quantum Vault: Complete Deployment Guide

**Version:** 1.0.0  
**Last Updated:** December 1, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Redis Configuration](#redis-configuration)
5. [Application Configuration](#application-configuration)
6. [Deployment Platforms](#deployment-platforms)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Monitoring Setup](#monitoring-setup)
9. [Backup Strategy](#backup-strategy)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 2GB
- Storage: 20GB
- OS: Linux (Ubuntu 20.04+ recommended)

**Recommended:**
- CPU: 4 cores
- RAM: 4GB
- Storage: 50GB
- OS: Linux (Ubuntu 22.04 LTS)

### Software Requirements

```bash
# Required
Node.js >= 18.0.0
PostgreSQL >= 15.0
Redis >= 7.0
Git >= 2.30

# Optional
Docker >= 20.10
Docker Compose >= 2.0
Nginx >= 1.18 (for reverse proxy)
```

### Installation

**Ubuntu/Debian:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15

# Install Redis 7
sudo apt install -y redis-server

# Install Git
sudo apt install -y git

# Verify installations
node --version    # Should be v20.x.x
npm --version     # Should be 10.x.x
psql --version    # Should be 15.x
redis-cli --version  # Should be 7.x
```

---

## Environment Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/muhammadalihussnain/quantum-vault.git
cd quantum-vault

# Checkout production branch
git checkout main
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install crypto dependencies
cd crypto
npm install
cd ..
```

### 3. Environment Variables

Create `.env` file in the root directory:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=quantumvault
DB_PASSWORD=your_secure_password_here
DB_NAME=quantumvault_prod
DB_POOL_MIN=2
DB_POOL_MAX=20

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here
REDIS_DB=0

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Monitoring (optional)
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
```

**Security Note:** Never commit `.env` file to version control!

---

## Database Configuration

### 1. Create Database User

```bash
# Switch to postgres user
sudo -u postgres psql

# Create user and database
CREATE USER quantumvault WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE quantumvault_prod OWNER quantumvault;
GRANT ALL PRIVILEGES ON DATABASE quantumvault_prod TO quantumvault;

# Exit psql
\q
```

### 2. Configure PostgreSQL

Edit `/etc/postgresql/15/main/postgresql.conf`:

```conf
# Connection Settings
listen_addresses = 'localhost'
port = 5432
max_connections = 100

# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 4MB

# Write Ahead Log
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_min_duration_statement = 1000
```

Edit `/etc/postgresql/15/main/pg_hba.conf`:

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### 3. Run Migrations

```bash
cd backend
node database/migrate.js
```

Expected output:
```
🔄 Starting database migrations...
✓ Migrations table ready
✓ Found 0 executed migrations
✓ Found 1 migration files
📝 Running migration: 001_initial_schema.sql
✅ Migration 001_initial_schema.sql completed
✅ Successfully ran 1 migration(s)
🎉 Migration process completed
```

### 4. Verify Database

```bash
psql -U quantumvault -d quantumvault_prod -c "\dt"
```

Expected tables:
```
users
sessions
messages
audit_logs
performance_metrics
webauthn_credentials
migrations
```

---

## Redis Configuration

### 1. Configure Redis

Edit `/etc/redis/redis.conf`:

```conf
# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Security
requirepass your_redis_password_here

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

### 2. Start Redis

```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG

# Test authentication
redis-cli -a your_redis_password_here ping
# Should return: PONG
```

### 3. Redis Security

```bash
# Disable dangerous commands
redis-cli -a your_redis_password_here CONFIG SET rename-command FLUSHDB ""
redis-cli -a your_redis_password_here CONFIG SET rename-command FLUSHALL ""
redis-cli -a your_redis_password_here CONFIG SET rename-command CONFIG ""
```

---

## Application Configuration

### 1. Build Frontend

```bash
cd frontend

# Build for production
npm run build

# Output will be in frontend/dist/
```

### 2. Configure Backend

Create `backend/ecosystem.config.js` for PM2:

```javascript
module.exports = {
  apps: [{
    name: 'quantum-vault-backend',
    script: './src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 3. Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
cd backend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the instructions provided by PM2
```

### 4. Verify Application

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs quantum-vault-backend

# Monitor
pm2 monit
```

---

## Deployment Platforms

### Option 1: Render.com (Recommended)

**Pros:** Easy setup, free tier, managed services  
**Cons:** Limited customization

**Steps:**

1. **Create Account:** Sign up at render.com

2. **Create PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: quantum-vault-db
   - Plan: Free or Starter
   - Note the connection details

3. **Create Redis Instance:**
   - Click "New +" → "Redis"
   - Name: quantum-vault-redis
   - Plan: Free or Starter
   - Note the connection URL

4. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Name: quantum-vault-backend
   - Environment: Node
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node src/index.js`
   - Plan: Free or Starter

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   DB_HOST=<from-render-postgres>
   DB_PORT=5432
   DB_USER=<from-render-postgres>
   DB_PASSWORD=<from-render-postgres>
   DB_NAME=<from-render-postgres>
   REDIS_URL=<from-render-redis>
   JWT_SECRET=<generate-secure-key>
   CORS_ORIGIN=<your-frontend-url>
   ```

6. **Deploy Frontend:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Name: quantum-vault-frontend
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

### Option 2: Railway.app

**Pros:** Simple deployment, good DX  
**Cons:** Pricing can increase with usage

**Steps:**

1. **Create Account:** Sign up at railway.app

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose quantum-vault repository

3. **Add PostgreSQL:**
   - Click "New" → "Database" → "PostgreSQL"
   - Note the connection details

4. **Add Redis:**
   - Click "New" → "Database" → "Redis"
   - Note the connection URL

5. **Configure Backend Service:**
   - Root Directory: `/backend`
   - Build Command: `npm install`
   - Start Command: `node src/index.js`
   - Add environment variables

6. **Configure Frontend Service:**
   - Root Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist`

### Option 3: Fly.io

**Pros:** Global edge deployment, good performance  
**Cons:** More complex setup

**Steps:**

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Create App:**
   ```bash
   fly launch
   ```

4. **Create PostgreSQL:**
   ```bash
   fly postgres create
   ```

5. **Create Redis:**
   ```bash
   fly redis create
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

### Option 4: AWS (Advanced)

**Pros:** Full control, scalable  
**Cons:** Complex setup, higher cost

**Services Needed:**
- EC2 (Application servers)
- RDS (PostgreSQL)
- ElastiCache (Redis)
- S3 (Static assets)
- CloudFront (CDN)
- Route 53 (DNS)
- ALB (Load balancer)
- CloudWatch (Monitoring)

**Deployment Steps:**

1. **Create VPC and Subnets**
2. **Launch RDS PostgreSQL**
3. **Launch ElastiCache Redis**
4. **Launch EC2 instances**
5. **Configure Security Groups**
6. **Set up Load Balancer**
7. **Configure Auto Scaling**
8. **Set up CloudWatch**
9. **Deploy application**

### Option 5: Self-Hosted (Docker)

**Pros:** Full control, cost-effective  
**Cons:** Requires server management

**Steps:**

1. **Create docker-compose.prod.yml:**
   ```yaml
   version: '3.8'
   
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_USER: quantumvault
         POSTGRES_PASSWORD: ${DB_PASSWORD}
         POSTGRES_DB: quantumvault_prod
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped
   
     redis:
       image: redis:7-alpine
       command: redis-server --requirepass ${REDIS_PASSWORD}
       volumes:
         - redis_data:/data
       restart: unless-stopped
   
     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile
       environment:
         NODE_ENV: production
         DB_HOST: postgres
         REDIS_HOST: redis
       depends_on:
         - postgres
         - redis
       restart: unless-stopped
   
     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
       ports:
         - "80:80"
         - "443:443"
       depends_on:
         - backend
       restart: unless-stopped
   
   volumes:
     postgres_data:
     redis_data:
   ```

2. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## SSL/TLS Setup

### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Cloudflare (Free)

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable "Full (strict)" SSL/TLS mode
4. Enable "Always Use HTTPS"
5. Enable "Automatic HTTPS Rewrites"

### Option 3: Custom Certificate

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate CSR
openssl req -new -key private.key -out certificate.csr

# Submit CSR to Certificate Authority
# Install certificate when received
```

---

## Monitoring Setup

### 1. Prometheus

Create `monitoring/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'quantum-vault'
    static_configs:
      - targets: ['localhost:3000']
```

Start Prometheus:

```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 2. Grafana

Start Grafana:

```bash
docker run -d \
  --name grafana \
  -p 3001:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana
```

Configure Grafana:
1. Open http://localhost:3001
2. Login (admin/admin)
3. Add Prometheus data source
4. Import dashboard

### 3. Application Monitoring

The application exposes metrics at `/metrics`:

```bash
curl http://localhost:3000/metrics
```

Key metrics:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `db_query_duration_seconds` - Database query duration
- `redis_operation_duration_seconds` - Redis operation duration
- `websocket_connections` - Active WebSocket connections

---

## Backup Strategy

### 1. Database Backups

**Automated Daily Backups:**

Create `/usr/local/bin/backup-postgres.sh`:

```bash
#!/bin/bash

# Configuration
DB_NAME="quantumvault_prod"
DB_USER="quantumvault"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

Make executable and schedule:

```bash
chmod +x /usr/local/bin/backup-postgres.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /usr/local/bin/backup-postgres.sh
```

**Manual Backup:**

```bash
pg_dump -U quantumvault quantumvault_prod > backup.sql
```

**Restore:**

```bash
psql -U quantumvault quantumvault_prod < backup.sql
```

### 2. Redis Backups

Redis automatically creates RDB snapshots based on configuration.

**Manual Backup:**

```bash
redis-cli -a your_redis_password_here BGSAVE
cp /var/lib/redis/dump.rdb /var/backups/redis/dump_$(date +%Y%m%d).rdb
```

**Restore:**

```bash
sudo systemctl stop redis-server
sudo cp /var/backups/redis/dump_20251201.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb
sudo systemctl start redis-server
```

### 3. Application Backups

```bash
# Backup application files
tar -czf quantum-vault-backup-$(date +%Y%m%d).tar.gz \
  /path/to/quantum-vault \
  --exclude=node_modules \
  --exclude=.git

# Backup to remote server
rsync -avz /path/to/quantum-vault user@backup-server:/backups/
```

---

## Rollback Procedures

### 1. Application Rollback

**Using PM2:**

```bash
# List deployments
pm2 list

# Rollback to previous version
pm2 reload ecosystem.config.js --update-env

# Or restart with specific version
git checkout v1.0.0
npm install
pm2 restart quantum-vault-backend
```

**Using Docker:**

```bash
# List images
docker images

# Rollback to previous image
docker-compose down
docker-compose up -d quantum-vault-backend:v1.0.0
```

### 2. Database Rollback

```bash
# Restore from backup
psql -U quantumvault quantumvault_prod < /var/backups/postgresql/backup.sql

# Or use point-in-time recovery (if WAL archiving enabled)
```

### 3. Full System Rollback

```bash
# 1. Stop services
pm2 stop all
sudo systemctl stop nginx

# 2. Restore database
psql -U quantumvault quantumvault_prod < backup.sql

# 3. Restore application
git checkout <previous-commit>
npm install

# 4. Restart services
pm2 restart all
sudo systemctl start nginx
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U quantumvault -d quantumvault_prod -h localhost

# Check logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

**2. Redis Connection Failed**

```bash
# Check Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli -a your_redis_password_here ping

# Check logs
sudo tail -f /var/log/redis/redis-server.log
```

**3. Application Won't Start**

```bash
# Check PM2 logs
pm2 logs quantum-vault-backend

# Check for port conflicts
sudo lsof -i :3000

# Check environment variables
pm2 env 0
```

**4. High Memory Usage**

```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart quantum-vault-backend

# Adjust max memory in ecosystem.config.js
max_memory_restart: '500M'
```

**5. Slow Performance**

```bash
# Check database connections
psql -U quantumvault -d quantumvault_prod -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis memory
redis-cli -a your_redis_password_here INFO memory

# Check application metrics
curl http://localhost:3000/metrics
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
psql -U quantumvault -d quantumvault_prod -c "SELECT 1;"

# Redis health
redis-cli -a your_redis_password_here ping
```

### Logs

```bash
# Application logs
pm2 logs quantum-vault-backend

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Nginx logs (if using)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable firewall (ufw/iptables)
- [ ] Configure SSL/TLS
- [ ] Set up fail2ban
- [ ] Enable automatic security updates
- [ ] Configure backup encryption
- [ ] Set up monitoring alerts
- [ ] Review and harden SSH access
- [ ] Enable audit logging
- [ ] Regular security scans

---

## Performance Optimization

### Database Optimization

```sql
-- Create indexes
CREATE INDEX CONCURRENTLY idx_messages_created ON messages(created_at DESC);
CREATE INDEX CONCURRENTLY idx_users_active ON users(is_active) WHERE is_active = true;

-- Analyze tables
ANALYZE users;
ANALYZE messages;
ANALYZE sessions;

-- Vacuum
VACUUM ANALYZE;
```

### Redis Optimization

```conf
# Increase max memory
maxmemory 512mb

# Use LRU eviction
maxmemory-policy allkeys-lru

# Disable persistence for cache-only
save ""
```

### Application Optimization

```javascript
// Enable compression
app.use(compression());

// Set cache headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=31536000');
  next();
});

// Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Support

For deployment issues:
- GitHub Issues: https://github.com/muhammadalihussnain/quantum-vault/issues
- Documentation: https://github.com/muhammadalihussnain/quantum-vault/docs
- Email: support@quantum-vault.example.com

---

**Last Updated:** December 1, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
