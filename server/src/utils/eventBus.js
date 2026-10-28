// In-memory Server-Sent Events (SSE) Client Broadcaster for Real-Time Order & Logistics Tracking
const sseClients = new Set();

/**
 * Register an active SSE client connection
 */
export function addSSEClient(client) {
  sseClients.add(client);
}

/**
 * Unregister an SSE client connection on disconnect
 */
export function removeSSEClient(client) {
  sseClients.delete(client);
}

/**
 * Returns total count of active real-time listeners
 */
export function getActiveListenerCount() {
  return sseClients.size;
}

/**
 * Broadcast an order fulfillment transition event to all connected listeners
 * (Logistics supervisors, Admin control panels, and Customer tracking screens)
 */
export function broadcastFulfillmentEvent(data) {
  const payload = `data: ${JSON.stringify({
    ...data,
    server_time: new Date().toISOString()
  })}\n\n`;

  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch (err) {
      console.warn('SSE client disconnected during write, removing:', err.message);
      sseClients.delete(client);
    }
  }
}
