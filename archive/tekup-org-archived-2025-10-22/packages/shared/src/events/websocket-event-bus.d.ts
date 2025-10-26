import { AppEvent, EventBus, EventFilter } from './event.types';
export declare class WebSocketEventBus implements EventBus {
    private ws;
    private subscriptions;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private url;
    private isConnected;
    constructor(url: string);
    /**
     * Connect to WebSocket server
     */
    private connect;
    /**
     * Authenticate with the WebSocket server
     */
    private authenticate;
    /**
     * Handle reconnection attempts
     */
    private handleReconnect;
    /**
     * Publish an event to all subscribers
     */
    publish(event: AppEvent): Promise<void>;
    /**
     * Subscribe to events of a specific type
     */
    subscribe(eventType: string, handler: (event: AppEvent) => void, filter?: EventFilter): string;
    /**
     * Unsubscribe from events
     */
    unsubscribe(eventType: string, handler: (event: AppEvent) => void): void;
    /**
     * Unsubscribe by subscription ID
     */
    unsubscribeById(subscriptionId: string): void;
    /**
     * Handle incoming events from WebSocket
     */
    private handleIncomingEvent;
    /**
     * Check if an event matches a filter
     */
    private matchesFilter;
    /**
     * Generate a unique subscription ID
     */
    private generateSubscriptionId;
    /**
     * Get connection status
     */
    getConnectionStatus(): boolean;
    /**
     * Manually disconnect
     */
    disconnect(): void;
    /**
     * Manually reconnect
     */
    reconnect(): void;
}
/**
 * Factory function to create an event bus
 */
export declare const createEventBus: (url: string) => EventBus;
/**
 * Default event bus instance
 */
export declare const defaultEventBus: EventBus;
//# sourceMappingURL=websocket-event-bus.d.ts.map