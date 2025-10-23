# Analytics Tools Guide

## Overview

The Tekup-Billy MCP Server now includes comprehensive data analysis and insights tools that help analyze product feedback, usage patterns, adoption risks, A/B test results, and customer segment behavior. These tools are designed to provide actionable insights for product decision-making.

## Available Analytics Tools

### 1. Analyze Feedback (`analyze_feedback`)

**Purpose**: Analyze user feedback and identify key themes with sentiment analysis and product implications.

**Input Parameters**:
- `feedback` (required): Array of feedback objects containing:
  - `text`: Feedback text content
  - `rating`: User rating (1-5, optional)
  - `category`: Feedback category (optional)
  - `timestamp`: Feedback timestamp (optional)
  - `source`: Feedback source (optional)
- `themesCount` (optional): Number of themes to identify (default: 4, max: 10)

**Output**:
- Identified themes with frequency, sentiment, and example quotes
- Product implications for each theme
- Summary statistics

**Example**:

```json
{
  "feedback": [
    {
      "text": "The interface is confusing and hard to navigate",
      "rating": 2,
      "category": "UI",
      "timestamp": "2025-01-15T10:30:00Z"
    },
    {
      "text": "Great features but the app is slow",
      "rating": 3,
      "category": "Performance"
    }
  ],
  "themesCount": 4
}
```

### 2. Analyze Usage Data (`analyze_usage_data`)

**Purpose**: Analyze product usage data to identify behavioral trends and user needs.

**Input Parameters**:
- `usageData` (required): Array of usage data objects containing:
  - `userId`: User ID (optional)
  - `feature`: Feature name
  - `usageCount`: Number of times feature was used
  - `sessionDuration`: Session duration in minutes (optional)
  - `timestamp`: Usage timestamp
  - `userSegment`: User segment (optional)
- `trendsCount` (optional): Number of trends to identify (default: 3, max: 5)

**Output**:
- Behavioral trends with impact assessment
- Evidence supporting each trend
- Follow-up investigation recommendations

**Example**:

```json
{
  "usageData": [
    {
      "userId": "user123",
      "feature": "invoice_creation",
      "usageCount": 15,
      "sessionDuration": 45,
      "timestamp": "2025-01-15T09:00:00Z",
      "userSegment": "small_business"
    }
  ],
  "trendsCount": 3
}
```

### 3. Analyze Adoption Risks (`analyze_adoption_risks`)

**Purpose**: Analyze product rollout plan and identify risks to successful adoption.

**Input Parameters**:
- `rolloutPlan` (required): Rollout plan object containing:
  - `features`: Array of features with complexity, dependencies, target adoption
  - `timeline`: Rollout timeline with phases
  - `userSegments`: User segments with tech savviness and resistance levels
- `risksCount` (optional): Number of risks to identify (default: 5, max: 10)

**Output**:
- Identified risks with likelihood and impact assessment
  - Risk score (1-10)
  - Mitigation strategies
  - Affected features

**Example**:

```json
{
  "rolloutPlan": {
    "features": [
      {
        "name": "Advanced Reporting",
        "complexity": "high",
        "dependencies": ["Data Export"],
        "targetAdoption": 80,
        "rolloutPhase": "Phase 2"
      }
    ],
    "timeline": {
      "startDate": "2025-02-01",
      "endDate": "2025-06-01",
      "phases": [
        {
          "name": "Phase 1",
          "duration": 30,
          "features": ["Basic Features"]
        }
      ]
    },
    "userSegments": [
      {
        "name": "Enterprise",
        "size": 100,
        "techSavviness": "high",
        "resistanceToChange": "low"
      }
    ]
  },
  "risksCount": 5
}
```

### 4. Analyze A/B Test (`analyze_ab_test`)

**Purpose**: Analyze A/B test results with statistical significance and recommendations.

**Input Parameters**:
- `testData` (required): A/B test data object containing:
  - `testName`: Name of the A/B test
  - `variantA`: Variant A data (sample size, conversions, conversion rate, revenue)
  - `variantB`: Variant B data (sample size, conversions, conversion rate, revenue)
  - `testDuration`: Test duration in days (optional)
  - `confidenceLevel`: Confidence level for statistical significance (default: 0.95)

**Output**:
- Statistical significance analysis
- Winner determination
- Improvement percentage and lift
- Confidence intervals
- Implementation recommendations

**Example**:

```json
{
  "testData": {
    "testName": "Checkout Button Color",
    "variantA": {
      "name": "Blue Button",
      "sampleSize": 1000,
      "conversions": 120,
      "conversionRate": 0.12,
      "revenue": 12000
    },
    "variantB": {
      "name": "Green Button",
      "sampleSize": 1000,
      "conversions": 150,
      "conversionRate": 0.15,
      "revenue": 15000
    },
    "confidenceLevel": 0.95
  }
}
```

### 5. Analyze Segment Adoption (`analyze_segment_adoption`)

**Purpose**: Compare feature adoption across different customer segments.

**Input Parameters**:
- `adoptionData` (required): Array of segment adoption data containing:
  - `segment`: Customer segment
  - `feature`: Feature name
  - `adoptionRate`: Adoption rate percentage (0-100)
  - `usageFrequency`: Usage frequency
  - `retentionRate`: Retention rate percentage (0-100)
  - `revenue`: Revenue generated (optional)
  - `userCount`: Number of users in segment
- `segments`: Array of customer segments to compare
- `features`: Array of features to analyze

**Output**:
- Segment comparison table
- Best and worst performing segments
- Average adoption rates
- Feature-specific insights

**Example**:

```json
{
  "adoptionData": [
    {
      "segment": "small_business",
      "feature": "invoice_automation",
      "adoptionRate": 75,
      "usageFrequency": 12,
      "retentionRate": 85,
      "revenue": 5000,
      "userCount": 200
    }
  ],
  "segments": ["small_business", "enterprise"],
  "features": ["invoice_automation", "reporting"]
}
```

## Usage Examples

### Analyzing User Feedback

```bash
# Using the MCP server directly
curl -X POST http://localhost:3000/api/v1/tools/analyze_feedback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "feedback": [
      {
        "text": "The invoice creation process is too complicated",
        "rating": 2,
        "category": "Usability"
      },
      {
        "text": "Love the new reporting features!",
        "rating": 5,
        "category": "Features"
      }
    ],
    "themesCount": 4
  }'
```

### Analyzing Usage Patterns

```bash
# Using the MCP server directly
curl -X POST http://localhost:3000/api/v1/tools/analyze_usage_data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "usageData": [
      {
        "userId": "user123",
        "feature": "invoice_creation",
        "usageCount": 25,
        "sessionDuration": 30,
        "timestamp": "2025-01-15T09:00:00Z",
        "userSegment": "small_business"
      }
    ],
    "trendsCount": 3
  }'
```

## Integration with Billy.dk Data

The analytics tools can be combined with Billy.dk data to provide comprehensive insights:

1. **Revenue Analysis**: Use `get_revenue` tool to get financial data, then analyze with `analyze_usage_data`
2. **Customer Segmentation**: Use `list_customers` to get customer data, then analyze adoption patterns
3. **Product Performance**: Use `list_products` and `list_invoices` to analyze product usage and revenue

## Best Practices

1. **Data Quality**: Ensure input data is clean and properly formatted
2. **Sample Size**: Use adequate sample sizes for meaningful analysis
3. **Time Periods**: Analyze data over appropriate time periods
4. **Segmentation**: Use meaningful customer segments for comparison
5. **Regular Analysis**: Perform regular analysis to track trends over time

## Error Handling

All analytics tools include comprehensive error handling:
- Input validation using Zod schemas
- Graceful error responses with detailed messages
- Audit logging for all operations
- Execution time tracking

## Performance Considerations

- Tools are optimized for large datasets
- Built-in rate limiting for API calls
- Efficient algorithms for data processing
- Memory management for large analyses

## Future Enhancements

Planned improvements include:
- Machine learning integration for advanced pattern recognition
- Real-time analytics capabilities
- Custom visualization generation
- Integration with external analytics platforms
- Advanced statistical methods

## Support

For questions or issues with the analytics tools:
1. Check the error messages in tool responses
2. Verify input data format and completeness
3. Review the audit logs for detailed execution information
4. Contact the development team for advanced use cases

---

**Version**: 1.3.0  
**Last Updated**: January 2025  
**Compatibility**: Billy MCP Server v1.3.0+
