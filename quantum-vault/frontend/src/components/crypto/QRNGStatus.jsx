/**
 * QRNG Status Component
 * Displays quantum random number generation service status
 */

import React, { useState, useEffect } from 'react';
import qrng from '../../utils/qrng';

export function QRNGStatus() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const healthData = await qrng.healthCheck();
      setHealth(healthData);
      setMetrics(qrng.getMetrics());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !health) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Quantum RNG Status
        </h3>
        <button
          onClick={checkHealth}
          className="text-sm text-blue-600 hover:text-blue-700"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}

      {health && (
        <div className="space-y-3">
          {/* Health Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Service Status</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              health.healthy 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {health.healthy ? (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Online
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Offline
                </>
              )}
            </span>
          </div>

          {/* Latency */}
          {health.latency && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Latency</span>
              <span className="text-sm font-medium text-gray-900">
                {health.latency}
              </span>
            </div>
          )}

          {/* Cache Size */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cache Size</span>
            <span className="text-sm font-medium text-gray-900">
              {health.cacheSize} bytes
            </span>
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Performance Metrics
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Total Requests</span>
              <span className="text-xs font-medium text-gray-900">
                {metrics.totalRequests}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Cache Hit Rate</span>
              <span className="text-xs font-medium text-gray-900">
                {metrics.cacheHitRate}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">API Success Rate</span>
              <span className="text-xs font-medium text-gray-900">
                {metrics.apiSuccessRate}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Fallback Used</span>
              <span className="text-xs font-medium text-gray-900">
                {metrics.fallbackUsed}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start">
          <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-gray-600">
            Using quantum random numbers from ANU QRNG for enhanced security.
            {!health?.healthy && ' Fallback to Web Crypto API when unavailable.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default QRNGStatus;
