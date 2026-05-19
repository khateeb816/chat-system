const rateLimitMap = new Map();

/**
 * Checks rate limiting and anti-spam rules for a given agentId.
 * @param {string} agentId - The client agent identifier.
 * @param {object} options - Rate limit config rules.
 * @returns {object} { allowed: boolean, reason?: string, retryAfter?: number }
 */
export function checkRateLimit(agentId, {
  maxRequests = 60,
  windowMs = 60000,
  minIntervalMs = 500 // Minimum 500ms between requests (anti-spam cooldown)
} = {}) {
  if (!agentId) return { allowed: true };

  const now = Date.now();
  const clientData = rateLimitMap.get(agentId) || { timestamps: [], lastRequestAt: 0 };

  // 1. Anti-spam Cooldown Check
  if (clientData.lastRequestAt && (now - clientData.lastRequestAt < minIntervalMs)) {
    return {
      allowed: false,
      reason: 'cooldown',
      retryAfter: Math.ceil((minIntervalMs - (now - clientData.lastRequestAt)) / 1000) || 1
    };
  }

  // 2. Rolling Window Request Count Check
  clientData.timestamps = clientData.timestamps.filter(ts => now - ts < windowMs);

  if (clientData.timestamps.length >= maxRequests) {
    const oldestTs = clientData.timestamps[0];
    const retryAfter = Math.ceil((windowMs - (now - oldestTs)) / 1000) || 1;
    return {
      allowed: false,
      reason: 'rate_limit',
      retryAfter
    };
  }

  // Record this request
  clientData.timestamps.push(now);
  clientData.lastRequestAt = now;
  rateLimitMap.set(agentId, clientData);

  return { allowed: true };
}
