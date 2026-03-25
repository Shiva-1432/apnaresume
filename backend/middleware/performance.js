const performanceMetrics = {
  requests: [],
  errors: [],
  dbQueries: []
};

const trackPerformance = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const metric = {
      endpoint: req.path,
      method: req.method,
      status: res.statusCode,
      duration,
      timestamp: new Date()
    };

    performanceMetrics.requests.push(metric);

    // Log slow requests (>1s)
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Keep only last 1000 requests
    if (performanceMetrics.requests.length > 1000) {
      performanceMetrics.requests.shift();
    }
  });

  next();
};

const getMetrics = () => {
  const requests = performanceMetrics.requests;
  if (requests.length === 0) {
    return {
      total_requests: 0,
      avg_response_time: 0,
      error_rate: 0,
      slowest_endpoints: []
    };
  }

  const totalRequests = requests.length;
  const errorCount = requests.filter((r) => r.status >= 400).length;
  const avgDuration = requests.reduce((sum, r) => sum + r.duration, 0) / requests.length;

  // Find slowest endpoints
  const endpointStats = {};
  requests.forEach((r) => {
    if (!endpointStats[r.endpoint]) {
      endpointStats[r.endpoint] = { total: 0, count: 0, max: 0 };
    }
    endpointStats[r.endpoint].total += r.duration;
    endpointStats[r.endpoint].count += 1;
    endpointStats[r.endpoint].max = Math.max(endpointStats[r.endpoint].max, r.duration);
  });

  const slowestEndpoints = Object.entries(endpointStats)
    .map(([endpoint, stats]) => ({
      endpoint,
      avg_time: Math.round(stats.total / stats.count),
      max_time: stats.max,
      requests: stats.count
    }))
    .sort((a, b) => b.avg_time - a.avg_time)
    .slice(0, 10);

  return {
    total_requests: totalRequests,
    avg_response_time: Math.round(avgDuration),
    error_rate: `${((errorCount / totalRequests) * 100).toFixed(2)}%`,
    slowest_endpoints: slowestEndpoints
  };
};

module.exports = { trackPerformance, getMetrics, performanceMetrics };
