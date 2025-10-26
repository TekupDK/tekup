# WebSocket Integration Guide

This document provides comprehensive guidance for integrating with the Flow API's WebSocket system for real-time communication and voice command processing.

## Overview

The Flow API provides a robust WebSocket gateway that enables real-time communication between clients and the TekUp ecosystem. It supports tenant-aware connections, voice command execution, and event broadcasting.

## Connection Setup

### Basic Connection

```typescript
import { io, Socket } from 'socket.io-client';

const socket = io('http://localhost:4000/events', {
  extraHeaders: {
    'x-tenant-key': 'your-tenant-api-key'
  },
  transports: ['websocket'],
  timeout: 10000,
});
```

### Connection Events

```typescript
socket.on('connect', () => {
  console.log('Connected to Flow API WebSocket');
});

socket.on('connected', (data) => {
  console.log('Welcome message:', data);
  // { message: 'Connected to TekUp Events Gateway', tenantId: '...', timestamp: '...' }
});

socket.on('disconnect', () => {
  console.log('Disconnected from Flow API WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

## Authentication

### Tenant API Key Authentication

All WebSocket connections require a valid tenant API key in the connection headers:

```typescript
const socket = io('http://localhost:4000/events', {
  extraHeaders: {
    'x-tenant-key': 'demo-tenant-key-1'
  }
});
```

### Tenant Room Assignment

Upon successful authentication, clients are automatically joined to their tenant-specific room:

- Room name format: `tenant:{tenantId}`
- Events are broadcast only to clients in the same tenant room
- Ensures complete tenant isolation

## Voice Command Execution

### Executing Voice Commands

```typescript
// Send voice command
const executeVoiceCommand = (command: string, parameters?: any) => {
  const request = {
    command,
    parameters,
    tenantId: 'your-tenant-id'
  };
  
  socket.emit('execute_voice_command', request);
};

// Handle response
socket.on('voice_command_response', (response) => {
  console.log('Command result:', response);
  // { success: true, data: {...}, tenant: '...', timestamp: '...' }
});
```

### Supported Voice Commands

| Command | Description | Parameters |
|---------|-------------|------------|
| `get_leads` | Retrieve leads with filtering | `{ status?, limit?, source? }` |
| `create_lead` | Create new lead | `{ name, email, company?, phone?, notes? }` |
| `search_leads` | Search leads by query | `{ query, status?, date_range? }` |
| `get_metrics` | Get system metrics | `{ metric_type?, period? }` |
| `start_backup` | Initiate backup process | `{ backup_type?, priority? }` |
| `compliance_check` | Run compliance validation | `{ check_type?, severity? }` |

### Voice Command Examples

```typescript
// Get all new leads
executeVoiceCommand('get_leads', { status: 'NEW', limit: 10 });

// Create a new lead
executeVoiceCommand('create_lead', {
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Acme Corp',
  phone: '+45 12 34 56 78',
  notes: 'Interested in our services'
});

// Search for leads
executeVoiceCommand('search_leads', {
  query: 'john',
  status: 'NEW'
});

// Get system metrics
executeVoiceCommand('get_metrics', {
  metric_type: 'leads',
  period: 'month'
});
```

## Event Subscriptions

### Lead Events

```typescript
socket.on('lead_event', (event) => {
  console.log('Lead event:', event);
  
  switch (event.type) {
    case 'LEAD_CREATED':
      handleLeadCreated(event);
      break;
    case 'LEAD_UPDATED':
      handleLeadUpdated(event);
      break;
    case 'LEAD_STATUS_CHANGED':
      handleLeadStatusChanged(event);
      break;
  }
});

const handleLeadCreated = (event) => {
  // Update UI with new lead
  console.log('New lead created:', event.data);
};
```

### Voice Events

```typescript
socket.on('voice_event', (event) => {
  console.log('Voice event:', event);
  
  switch (event.type) {
    case 'VOICE_COMMAND_EXECUTED':
      handleVoiceCommandExecuted(event);
      break;
    case 'VOICE_PROCESSING_STARTED':
      handleVoiceProcessingStarted(event);
      break;
    case 'VOICE_PROCESSING_COMPLETED':
      handleVoiceProcessingCompleted(event);
      break;
  }
});
```

### Integration Events

```typescript
socket.on('integration_event', (event) => {
  console.log('Integration event:', event);
  
  switch (event.type) {
    case 'SYNC_STARTED':
      handleSyncStarted(event);
      break;
    case 'SYNC_COMPLETED':
      handleSyncCompleted(event);
      break;
    case 'EXTERNAL_SERVICE_ERROR':
      handleExternalServiceError(event);
      break;
  }
});
```

## Error Handling

### Connection Error Handling

```typescript
socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
  
  // Handle specific error types
  if (error.message.includes('authentication')) {
    // Invalid API key
    showAuthenticationError();
  } else if (error.message.includes('timeout')) {
    // Connection timeout
    attemptReconnection();
  }
});
```

### Command Error Handling

```typescript
socket.on('voice_command_response', (response) => {
  if (!response.success) {
    console.error('Voice command failed:', response.error);
    
    // Handle specific error types
    switch (response.error) {
      case 'Access denied':
        handleAccessDeniedError();
        break;
      case 'Unknown command':
        handleUnknownCommandError();
        break;
      case 'Invalid parameters':
        handleInvalidParametersError();
        break;
      default:
        handleGenericError(response.error);
    }
  }
});
```

## Reconnection Strategy

### Automatic Reconnection

```typescript
class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  connect() {
    this.socket = io('http://localhost:4000/events', {
      extraHeaders: {
        'x-tenant-key': this.apiKey
      }
    });
    
    this.socket.on('disconnect', () => {
      this.handleReconnection();
    });
  }
  
  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.handleConnectionFailure();
    }
  }
}
```

## Performance Optimization

### Connection Pooling

```typescript
class WebSocketPool {
  private connections: Map<string, Socket> = new Map();
  
  getConnection(tenantId: string, apiKey: string): Socket {
    const connectionKey = `${tenantId}:${apiKey}`;
    
    if (!this.connections.has(connectionKey)) {
      const socket = io('http://localhost:4000/events', {
        extraHeaders: { 'x-tenant-key': apiKey }
      });
      
      this.connections.set(connectionKey, socket);
    }
    
    return this.connections.get(connectionKey)!;
  }
  
  closeConnection(tenantId: string, apiKey: string) {
    const connectionKey = `${tenantId}:${apiKey}`;
    const socket = this.connections.get(connectionKey);
    
    if (socket) {
      socket.disconnect();
      this.connections.delete(connectionKey);
    }
  }
}
```

### Event Throttling

```typescript
class EventThrottler {
  private eventQueue: Map<string, any[]> = new Map();
  private throttleDelay = 100; // ms
  
  throttleEvent(eventType: string, event: any, handler: (events: any[]) => void) {
    if (!this.eventQueue.has(eventType)) {
      this.eventQueue.set(eventType, []);
    }
    
    this.eventQueue.get(eventType)!.push(event);
    
    // Debounce event processing
    clearTimeout(this.timeouts?.get(eventType));
    this.timeouts?.set(eventType, setTimeout(() => {
      const events = this.eventQueue.get(eventType) || [];
      if (events.length > 0) {
        handler(events);
        this.eventQueue.set(eventType, []);
      }
    }, this.throttleDelay));
  }
}
```

## Security Considerations

### API Key Management

```typescript
class SecureWebSocketClient {
  private apiKey: string;
  private tenantId: string;
  
  constructor(apiKey: string, tenantId: string) {
    this.apiKey = this.validateApiKey(apiKey);
    this.tenantId = this.validateTenantId(tenantId);
  }
  
  private validateApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 32) {
      throw new Error('Invalid API key format');
    }
    return apiKey;
  }
  
  private validateTenantId(tenantId: string): string {
    if (!tenantId || !/^[a-zA-Z0-9-_]+$/.test(tenantId)) {
      throw new Error('Invalid tenant ID format');
    }
    return tenantId;
  }
}
```

### Input Validation

```typescript
const validateVoiceCommand = (command: string, parameters: any) => {
  // Validate command name
  const allowedCommands = [
    'get_leads', 'create_lead', 'search_leads',
    'get_metrics', 'start_backup', 'compliance_check'
  ];
  
  if (!allowedCommands.includes(command)) {
    throw new Error(`Invalid command: ${command}`);
  }
  
  // Validate parameters based on command
  switch (command) {
    case 'create_lead':
      if (!parameters.name || !parameters.email) {
        throw new Error('Name and email are required for create_lead');
      }
      break;
    case 'search_leads':
      if (!parameters.query) {
        throw new Error('Query is required for search_leads');
      }
      break;
  }
};
```

## Testing WebSocket Integration

### Unit Testing

```typescript
describe('WebSocket Integration', () => {
  let mockSocket: any;
  let webSocketManager: WebSocketManager;
  
  beforeEach(() => {
    mockSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
    };
    
    webSocketManager = new WebSocketManager(mockSocket);
  });
  
  it('should execute voice command correctly', async () => {
    const command = 'get_leads';
    const parameters = { status: 'NEW' };
    
    webSocketManager.executeVoiceCommand(command, parameters);
    
    expect(mockSocket.emit).toHaveBeenCalledWith('execute_voice_command', {
      command,
      parameters,
      tenantId: expect.any(String),
    });
  });
  
  it('should handle voice command response', () => {
    const responseHandler = jest.fn();
    webSocketManager.onVoiceCommandResponse(responseHandler);
    
    const mockResponse = {
      success: true,
      data: { leads: [] },
      tenant: 'test-tenant',
      timestamp: new Date().toISOString(),
    };
    
    // Simulate response
    const onHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'voice_command_response'
    )[1];
    onHandler(mockResponse);
    
    expect(responseHandler).toHaveBeenCalledWith(mockResponse);
  });
});
```

### Integration Testing

```typescript
describe('WebSocket Integration E2E', () => {
  let socket: Socket;
  
  beforeAll(async () => {
    socket = io('http://localhost:4000/events', {
      extraHeaders: {
        'x-tenant-key': 'demo-tenant-key-1'
      }
    });
    
    await new Promise(resolve => {
      socket.on('connect', resolve);
    });
  });
  
  afterAll(() => {
    socket.disconnect();
  });
  
  it('should execute get_leads command', (done) => {
    socket.emit('execute_voice_command', {
      command: 'get_leads',
      parameters: { limit: 5 }
    });
    
    socket.on('voice_command_response', (response) => {
      expect(response.success).toBe(true);
      expect(response.data.leads).toBeDefined();
      done();
    });
  });
});
```

## Monitoring and Debugging

### Connection Monitoring

```typescript
class WebSocketMonitor {
  private connectionStats = {
    connectTime: null as Date | null,
    disconnectCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: [] as string[],
  };
  
  monitorConnection(socket: Socket) {
    socket.on('connect', () => {
      this.connectionStats.connectTime = new Date();
      console.log('WebSocket connected at:', this.connectionStats.connectTime);
    });
    
    socket.on('disconnect', () => {
      this.connectionStats.disconnectCount++;
      console.log('WebSocket disconnected. Total disconnects:', this.connectionStats.disconnectCount);
    });
    
    // Monitor outgoing messages
    const originalEmit = socket.emit.bind(socket);
    socket.emit = (...args) => {
      this.connectionStats.messagesSent++;
      console.log('Sending message:', args[0]);
      return originalEmit(...args);
    };
    
    // Monitor incoming messages
    const originalOn = socket.on.bind(socket);
    socket.on = (event, handler) => {
      return originalOn(event, (...args) => {
        this.connectionStats.messagesReceived++;
        console.log('Received message:', event);
        return handler(...args);
      });
    };
  }
  
  getStats() {
    return { ...this.connectionStats };
  }
}
```

### Debug Logging

```typescript
const enableWebSocketDebug = () => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.debug = 'socket.io-client:*';
  }
};
```

## Best Practices

### 1. Connection Management
- Always handle connection and disconnection events
- Implement exponential backoff for reconnection attempts
- Use connection pooling for multiple tenants

### 2. Error Handling
- Implement comprehensive error handling for all event types
- Provide user-friendly error messages
- Log errors for debugging and monitoring

### 3. Performance
- Throttle high-frequency events to prevent UI blocking
- Use event batching for bulk operations
- Implement proper cleanup on component unmount

### 4. Security
- Validate all incoming data
- Use secure API key storage
- Implement proper tenant isolation

### 5. Testing
- Write comprehensive unit tests for WebSocket logic
- Include integration tests with real WebSocket connections
- Test error scenarios and edge cases

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if Flow API is running on the correct port
   - Verify WebSocket endpoint URL
   - Ensure firewall allows WebSocket connections

2. **Authentication Errors**
   - Verify API key is correct and active
   - Check tenant ID matches the API key
   - Ensure API key has necessary permissions

3. **Command Execution Failures**
   - Validate command parameters
   - Check tenant permissions for the command
   - Verify Flow API has necessary external service connections

4. **Event Not Received**
   - Check if client is properly subscribed to events
   - Verify tenant room assignment
   - Check for network connectivity issues

### Debug Commands

```bash
# Test WebSocket connection
curl -H "Upgrade: websocket" \
     -H "Connection: Upgrade" \
     -H "x-tenant-key: demo-tenant-key-1" \
     http://localhost:4000/events

# Check Flow API health
curl http://localhost:4000/health

# Verify tenant API key
curl -H "x-tenant-key: demo-tenant-key-1" \
     http://localhost:4000/leads
```

This comprehensive guide should help developers integrate with the Flow API's WebSocket system effectively and handle real-time communication requirements.