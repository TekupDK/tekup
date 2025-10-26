"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultEventBus = exports.createEventBus = exports.WebSocketEventBus = void 0;
const logger_1 = require("../logging/logger");
const logger = (0, logger_1.createLogger)('packages-shared-src-events-web');
class WebSocketEventBus {
    ws = null;
    subscriptions = new Map();
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 1000;
    url;
    isConnected = false;
    constructor(url) {
        this.url = url;
        this.connect();
    }
    /**
     * Connect to WebSocket server
     */
    connect() {
        try {
            this.ws = new WebSocket(this.url);
            this.ws.onopen = () => {
                logger.info('🔌 WebSocket EventBus connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                // Send authentication if needed
                this.authenticate();
            };
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleIncomingEvent(data);
                }
                catch (error) {
                    logger.error('Failed to parse WebSocket message');
                }
            };
            this.ws.onclose = () => {
                logger.info('🔌 WebSocket EventBus disconnected');
                this.isConnected = false;
                this.handleReconnect();
            };
            this.ws.onerror = (error) => {
                logger.error('WebSocket EventBus error:', error);
                this.isConnected = false;
            };
        }
        catch (error) {
            logger.error('Failed to create WebSocket connection');
            this.handleReconnect();
        }
    }
    /**
     * Authenticate with the WebSocket server
     */
    authenticate() {
        if (this.ws && this.isConnected) {
            // TODO: Implement authentication logic
            // this.ws.send(JSON.stringify({ type: 'AUTH', token: 'your-auth-token' }));
        }
    }
    /**
     * Handle reconnection attempts
     */
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            logger.info(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
                this.connect();
            }, delay);
        }
        else {
            logger.error('❌ Max reconnection attempts reached');
        }
    }
    /**
     * Publish an event to all subscribers
     */
    async publish(event) {
        if (!this.isConnected || !this.ws) {
            logger.warn('WebSocket not connected, event not published:', event);
            return;
        }
        try {
            const message = {
                type: 'EVENT',
                data: event,
            };
            this.ws.send(JSON.stringify(message));
            logger.info(`📤 Event published: ${event.type} (${event.id})`);
        }
        catch (error) {
            logger.error('Failed to publish event');
            throw error;
        }
    }
    /**
     * Subscribe to events of a specific type
     */
    subscribe(eventType, handler, filter) {
        const subscriptionId = this.generateSubscriptionId();
        const subscription = {
            id: subscriptionId,
            eventType,
            handler,
            filter,
        };
        if (!this.subscriptions.has(eventType)) {
            this.subscriptions.set(eventType, []);
        }
        this.subscriptions.get(eventType).push(subscription);
        logger.info(`📥 Subscribed to ${eventType} events (ID: ${subscriptionId})`);
        return subscriptionId;
    }
    /**
     * Unsubscribe from events
     */
    unsubscribe(eventType, handler) {
        const subscriptions = this.subscriptions.get(eventType);
        if (!subscriptions)
            return;
        const index = subscriptions.findIndex(sub => sub.handler === handler);
        if (index !== -1) {
            const removed = subscriptions.splice(index, 1)[0];
            logger.info(`📤 Unsubscribed from ${eventType} events (ID: ${removed.id})`);
        }
    }
    /**
     * Unsubscribe by subscription ID
     */
    unsubscribeById(subscriptionId) {
        for (const [eventType, subscriptions] of this.subscriptions.entries()) {
            const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
            if (index !== -1) {
                const removed = subscriptions.splice(index, 1)[0];
                logger.info(`📤 Unsubscribed from ${eventType} events (ID: ${removed.id})`);
                break;
            }
        }
    }
    /**
     * Handle incoming events from WebSocket
     */
    handleIncomingEvent(data) {
        if (data.type !== 'EVENT' || !data.data) {
            return;
        }
        const event = data.data;
        const eventType = event.type;
        logger.info(`📥 Received event: ${eventType} (${event.id})`);
        // Find all subscriptions for this event type
        const subscriptions = this.subscriptions.get(eventType) || [];
        // Execute handlers for matching subscriptions
        subscriptions.forEach(subscription => {
            if (this.matchesFilter(event, subscription.filter)) {
                try {
                    subscription.handler(event);
                }
                catch (error) {
                    logger.error(`Error in event handler for ${eventType}`);
                }
            }
        });
    }
    /**
     * Check if an event matches a filter
     */
    matchesFilter(event, filter) {
        if (!filter)
            return true;
        if (filter.tenantId && event.tenantId !== filter.tenantId) {
            return false;
        }
        if (filter.source && event.source !== filter.source) {
            return false;
        }
        if (filter.fromTimestamp && event.timestamp < filter.fromTimestamp) {
            return false;
        }
        if (filter.toTimestamp && event.timestamp > filter.toTimestamp) {
            return false;
        }
        return true;
    }
    /**
     * Generate a unique subscription ID
     */
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return this.isConnected;
    }
    /**
     * Manually disconnect
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
    /**
     * Manually reconnect
     */
    reconnect() {
        this.disconnect();
        this.reconnectAttempts = 0;
        this.connect();
    }
}
exports.WebSocketEventBus = WebSocketEventBus;
/**
 * Factory function to create an event bus
 */
const createEventBus = (url) => {
    return new WebSocketEventBus(url);
};
exports.createEventBus = createEventBus;
/**
 * Default event bus instance
 */
exports.defaultEventBus = (0, exports.createEventBus)(process.env.NEXT_PUBLIC_EVENT_BUS_URL || 'ws://localhost:4000/events');
//# sourceMappingURL=websocket-event-bus.js.map