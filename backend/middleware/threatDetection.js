const threatScores = new Map(); // Track suspicious IPs

const updateThreatScore = (ip, increment = 1) => {
  const current = threatScores.get(ip) || 0;
  threatScores.set(ip, current + increment);

  // Reset after 1 hour
  setTimeout(() => {
    threatScores.delete(ip);
  }, 60 * 60 * 1000);
};

const detectThreats = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  // Check for suspicious patterns
  const suspiciousPatterns = [
    // SQL injection attempts
    /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b)/i,
    // Script injection
    /<script|javascript:|onerror=/i,
    // Path traversal
    /\.\.\//,
    // Large payload
    req.body && JSON.stringify(req.body).length > 10000
  ];

  const hasSuspiciousPattern = suspiciousPatterns.some((pattern) => {
    if (typeof pattern === 'boolean') return pattern;
    const queryString = req.url + JSON.stringify(req.body || {});
    return pattern.test(queryString);
  });

  if (hasSuspiciousPattern) {
    updateThreatScore(ip, 10); // High score for injection attempts
    console.warn(`Suspicious pattern detected from ${ip}`);
  }

  // Check threat level
  const threatLevel = threatScores.get(ip) || 0;

  if (threatLevel > 50) {
    // Block heavily suspicious IPs
    return res.status(403).json({
      error: 'Access denied',
      message: 'Suspicious activity detected'
    });
  }

  if (threatLevel > 20) {
    // Log for review
    console.warn(`High threat score from ${ip}: ${threatLevel}`);
  }

  next();
};

const getThreatReport = () => {
  const threats = Array.from(threatScores.entries())
    .map(([ip, score]) => ({ ip, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return {
    total_monitored_ips: threatScores.size,
    high_threat_ips: threats.filter((t) => t.score > 20),
    threats
  };
};

module.exports = { detectThreats, getThreatReport, updateThreatScore };
