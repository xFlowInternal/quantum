const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const websocketConnectionsActive = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const messagesSentTotal = new promClient.Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages sent'
});

const messagesReceivedTotal = new promClient.Counter({
  name: 'messages_received_total',
  help: 'Total number of messages received'
});

const errorsTotal = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity']
});

const cryptoOperationDuration = new promClient.Histogram({
  name: 'crypto_operation_duration_seconds',
  help: 'Duration of crypto operations in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1]
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(websocketConnectionsActive);
register.registerMetric(messagesSentTotal);
register.registerMetric(messagesReceivedTotal);
register.registerMetric(errorsTotal);
register.registerMetric(cryptoOperationDuration);
register.registerMetric(dbQueryDuration);

// Middleware to track HTTP requests
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status: res.statusCode },
      duration
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode
    });
  });

  next();
}

// Helper functions
function trackCryptoOperation(operation, duration) {
  cryptoOperationDuration.observe({ operation }, duration);
}

function trackDbQuery(queryType, duration) {
  dbQueryDuration.observe({ query_type: queryType }, duration);
}

function trackError(type, severity) {
  errorsTotal.inc({ type, severity });
}

function incrementWebSocketConnections() {
  websocketConnectionsActive.inc();
}

function decrementWebSocketConnections() {
  websocketConnectionsActive.dec();
}

function incrementMessagesSent() {
  messagesSentTotal.inc();
}

function incrementMessagesReceived() {
  messagesReceivedTotal.inc();
}

module.exports = {
  register,
  metricsMiddleware,
  trackCryptoOperation,
  trackDbQuery,
  trackError,
  incrementWebSocketConnections,
  decrementWebSocketConnections,
  incrementMessagesSent,
  incrementMessagesReceived
};
