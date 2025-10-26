# Gumloop Webhook Integration Guide

## Overview

This integration enables hybrid AI processing for Rendetalje cleaning leads by combining:
- **Gumloop's AI processing** for email parsing and response generation
- **Tekup's business logic** for deterministic pricing and data sovereignty

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│  Email      │    │   Gumloop    │    │  Tekup CRM API  │
│ Aggregators ├────►   AI Flow    ├────►   Webhook       │
│             │    │              │    │   Processing    │
└─────────────┘    └──────────────┘    └─────────────────┘
                                                │
                                       ┌─────────────────┐
                                       │ Friday AI       │
                                       │ Service         │
                                       └─────────────────┘
                                                │
                                       ┌─────────────────┐
                                       │ Business Logic  │
                                       │ • Pricing       │
                                       │ • Calendar      │
                                       │ • Email Send    │
                                       │ • CRM Storage   │
                                       └─────────────────┘
```

## Webhook Endpoint

**Primary Endpoint:**
```
POST https://your-tekup-domain.com/integrations/rendetalje-ai/gumloop/webhook/lead
```

**Health Check:**
```
POST https://your-tekup-domain.com/integrations/rendetalje-ai/gumloop/webhook/health
```

**Test Endpoint:**
```
POST https://your-tekup-domain.com/integrations/rendetalje-ai/gumloop/webhook/test
```

## Gumloop Configuration

### 1. Set Up Webhook Node in Gumloop

Add a **Webhook** node at the end of your Rendetalje lead processing flow with:

- **URL:** `https://your-tekup-domain.com/integrations/rendetalje-ai/gumloop/webhook/lead`
- **Method:** `POST`
- **Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "x-gumloop-signature": "sha256=<calculated_signature>"
  }
  ```

### 2. Payload Structure

Configure Gumloop to send this JSON structure:

```json
{
  "flowId": "rendetalje_lead_processing",
  "executionId": "exec_{{timestamp}}_{{random}}",
  "timestamp": "{{current_datetime_iso}}",
  "status": "success",
  "leadData": {
    "customerEmail": "{{extracted_customer_email}}",
    "customerName": "{{extracted_customer_name}}",
    "leadSource": "{{email_source}}",
    "cleaningType": "{{detected_cleaning_type}}",
    "squareMeters": {{extracted_square_meters}},
    "address": "{{extracted_address}}",
    "desiredDate": "{{extracted_date}}",
    "phoneNumber": "{{extracted_phone}}",
    "originalEmail": {
      "from": "{{original_email_from}}",
      "subject": "{{original_email_subject}}",
      "body": "{{original_email_body}}",
      "messageId": "{{original_message_id}}"
    }
  },
  "gumloopResults": {
    "historyCheck": {
      "hasPreviousQuote": {{history_check_result}},
      "lastQuoteDate": "{{last_quote_date}}",
      "recommendation": "{{proceed|duplicate_detected|manual_review}}"
    },
    "estimation": {
      "estimatedHours": {{calculated_hours}},
      "price": {{calculated_price}},
      "breakdown": [
        {
          "component": "{{component_name}}",
          "hours": {{component_hours}},
          "description": "{{component_description}}"
        }
      ],
      "confidence": {{estimation_confidence}}
    },
    "calendarSlots": [
      {
        "startTime": "{{slot_start_iso}}",
        "endTime": "{{slot_end_iso}}",
        "confidence": {{slot_confidence}}
      }
    ],
    "responseGenerated": {
      "subject": "{{generated_subject}}",
      "body": "{{generated_email_body}}",
      "responseMethod": "{{reply_directly|create_new_email|send_to_customer_only}}"
    }
  },
  "metadata": {
    "processingTimeMs": {{processing_time}},
    "nodeExecutions": {{node_count}},
    "errorCount": {{error_count}},
    "warningCount": {{warning_count}}
  }
}
```

### 3. Error Handling

Configure error scenarios to send:

```json
{
  "status": "error",
  "leadData": {
    "customerEmail": "{{customer_email}}",
    "originalEmail": { /* basic email data */ }
  },
  "gumloopResults": {},
  "metadata": {
    "processingTimeMs": {{time}},
    "errorCount": 1,
    "warningCount": 0
  }
}
```

### 4. Partial Processing

For partial success (some nodes failed):

```json
{
  "status": "partial",
  "gumloopResults": {
    "estimation": { /* if this succeeded */ },
    "responseGenerated": null, /* if this failed */
    "calendarSlots": []
  }
}
```

## Security

### HMAC Signature Validation

1. Generate webhook secret:
   ```bash
   openssl rand -hex 32
   ```

2. Calculate signature in Gumloop:
   ```javascript
   const crypto = require('crypto');
   const secret = 'your_webhook_secret';
   const payload = JSON.stringify(webhookData);
   const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
   const header = `sha256=${signature}`;
   ```

3. Add to headers:
   ```
   x-gumloop-signature: sha256=calculated_signature
   ```

## Processing Flow

### Success Path
1. **Webhook Received** → Validate signature
2. **Process via Friday AI** → Use Gumloop results
3. **Store in CRM** → Create customer and deal records
4. **Send Email** → Use Gumloop-generated response
5. **Return Success** → Confirm to Gumloop

### Error/Partial Path
1. **Webhook Received** → Validate signature
2. **Fallback Processing** → Use Tekup's AI pipeline
3. **Supplement Data** → Fill gaps with Tekup processing
4. **Continue Normal Flow** → Store and respond

### Manual Review Path
1. **Webhook Received** → Gumloop recommends manual review
2. **Create Review Task** → Queue for human review
3. **Return Acknowledged** → Confirm receipt

## Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200  | OK     | Successfully processed |
| 400  | Bad Request | Invalid payload or signature |
| 401  | Unauthorized | Missing or invalid signature |
| 500  | Internal Error | Processing failed |

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Successfully processed kunde@example.com - quote_sent (872.5 DKK, 2.5h)",
  "tekupProcessingId": "deal_1704897123_abc123",
  "actions": [
    "lead_processed",
    "quote_generated", 
    "email_sent",
    "gumloop_webhook_processed"
  ]
}
```

### Error Response
```json
{
  "success": false,
  "message": "Processing failed for kunde@example.com: Invalid email format",
  "actions": ["processing_error"],
  "errors": ["Invalid email format"]
}
```

## Monitoring

### Key Metrics to Track
- Webhook processing time
- Success/failure rates
- Gumloop vs Tekup processing ratio
- Manual review rate
- Customer response rates

### Logging
All webhook events are logged with:
- Execution ID
- Processing time
- Actions taken
- Success/failure status
- Error details (if any)

### Health Checks
Regular health checks ensure:
- Database connectivity
- Friday AI service status
- Estimation engine availability

## Testing

### 1. Test Webhook Endpoint
```bash
curl -X POST https://your-domain.com/integrations/rendetalje-ai/gumloop/webhook/test \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

### 2. Test Health Check
```bash
curl -X POST https://your-domain.com/integrations/rendetalje-ai/gumloop/webhook/health \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "2024-01-15T10:30:00Z"}'
```

### 3. Sample Test Payload
```json
{
  "flowId": "test_flow",
  "executionId": "test_exec_123",
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "success",
  "leadData": {
    "customerEmail": "test@example.com",
    "customerName": "Test Kunde",
    "leadSource": "leadpoint",
    "cleaningType": "weekly",
    "squareMeters": 80,
    "originalEmail": {
      "from": "leads@leadpoint.dk",
      "subject": "Test rengøringsforespørgsel",
      "body": "Test email body",
      "messageId": "test_msg_123"
    }
  },
  "gumloopResults": {
    "historyCheck": {
      "hasPreviousQuote": false,
      "recommendation": "proceed"
    },
    "estimation": {
      "estimatedHours": 2,
      "price": 698,
      "confidence": 0.9
    },
    "responseGenerated": {
      "subject": "Test tilbud",
      "body": "Test response body",
      "responseMethod": "reply_directly"
    }
  },
  "metadata": {
    "processingTimeMs": 5000,
    "nodeExecutions": 10,
    "errorCount": 0
  }
}
```

## Troubleshooting

### Common Issues

1. **Invalid Signature**
   - Check webhook secret configuration
   - Verify signature calculation in Gumloop
   - Ensure payload matches exactly

2. **Processing Timeouts**
   - Increase `WEBHOOK_TIMEOUT_MS`
   - Check database connectivity
   - Monitor service performance

3. **Fallback Processing**
   - Normal when Gumloop has issues
   - Check `ENABLE_TEKUP_FALLBACK` setting
   - Monitor fallback success rates

### Debug Mode
Enable detailed logging:
```env
WEBHOOK_DEBUG_LOGGING=true
```

### Error Notifications
Configure Slack notifications:
```env
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## Benefits

### For Gumloop Users
- ✅ Easy AI-powered email processing
- ✅ Visual flow building
- ✅ Advanced text extraction
- ✅ Flexible response generation

### For Tekup Users
- ✅ Maintain data sovereignty
- ✅ Consistent business logic
- ✅ Deterministic pricing (349 DKK/hour)
- ✅ Existing CRM integration
- ✅ Fallback processing capability

### Hybrid Benefits
- 🚀 Best of both platforms
- 🔄 Automatic fallback processing
- 📊 Comprehensive analytics
- 🛡️ Robust error handling
- 📈 Scalable architecture

## Next Steps

1. **Configure Gumloop Flow** - Set up webhook node
2. **Deploy Webhook Endpoint** - Update environment variables
3. **Test Integration** - Use test endpoints
4. **Monitor Performance** - Set up alerts
5. **Optimize Processing** - Tune confidence thresholds