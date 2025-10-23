/**
 * Data Analysis & Insights Tools for Billy.dk MCP Server
 * Provides comprehensive analytics capabilities for product insights
 */

import { z } from 'zod';
import type { BillyClient } from '../billy-client.js';
import { dataLogger } from '../utils/data-logger.js';

// Input schemas for validation
const analyzeFeedbackSchema = z.object({
  feedback: z.array(z.object({
    id: z.string().optional(),
    text: z.string(),
    category: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    timestamp: z.string().optional(),
    source: z.string().optional(),
  })).describe('Array of user feedback objects'),
  themesCount: z.number().min(1).max(10).default(4).describe('Number of themes to identify'),
});

const analyzeUsageDataSchema = z.object({
  usageData: z.array(z.object({
    userId: z.string().optional(),
    feature: z.string(),
    usageCount: z.number(),
    sessionDuration: z.number().optional(),
    timestamp: z.string(),
    userSegment: z.string().optional(),
  })).describe('Array of usage data objects'),
  trendsCount: z.number().min(1).max(5).default(3).describe('Number of trends to identify'),
});

const analyzeAdoptionRisksSchema = z.object({
  rolloutPlan: z.object({
    features: z.array(z.object({
      name: z.string(),
      complexity: z.enum(['low', 'medium', 'high']),
      dependencies: z.array(z.string()).optional(),
      targetAdoption: z.number().min(0).max(100),
      rolloutPhase: z.string(),
    })),
    timeline: z.object({
      startDate: z.string(),
      endDate: z.string(),
      phases: z.array(z.object({
        name: z.string(),
        duration: z.number(),
        features: z.array(z.string()),
      })),
    }),
    userSegments: z.array(z.object({
      name: z.string(),
      size: z.number(),
      techSavviness: z.enum(['low', 'medium', 'high']),
      resistanceToChange: z.enum(['low', 'medium', 'high']),
    })),
  }).describe('Product rollout plan object'),
  risksCount: z.number().min(1).max(10).default(5).describe('Number of risks to identify'),
});

const analyzeABTestSchema = z.object({
  testData: z.object({
    testName: z.string(),
    variantA: z.object({
      name: z.string(),
      sampleSize: z.number(),
      conversions: z.number(),
      conversionRate: z.number(),
      revenue: z.number().optional(),
      otherMetrics: z.record(z.number()).optional(),
    }),
    variantB: z.object({
      name: z.string(),
      sampleSize: z.number(),
      conversions: z.number(),
      conversionRate: z.number(),
      revenue: z.number().optional(),
      otherMetrics: z.record(z.number()).optional(),
    }),
    testDuration: z.number().optional(),
    confidenceLevel: z.number().min(0.8).max(0.99).default(0.95),
  }).describe('A/B test data object'),
});

const analyzeSegmentAdoptionSchema = z.object({
  adoptionData: z.array(z.object({
    segment: z.string(),
    feature: z.string(),
    adoptionRate: z.number().min(0).max(100),
    usageFrequency: z.number(),
    retentionRate: z.number().min(0).max(100),
    revenue: z.number().optional(),
    userCount: z.number(),
  })).describe('Array of segment adoption data'),
  segments: z.array(z.string()).describe('Array of customer segments to compare'),
  features: z.array(z.string()).describe('Array of features to analyze'),
});

/**
 * Analyze user feedback and identify key themes
 */
export async function analyzeFeedback(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { feedback, themesCount } = analyzeFeedbackSchema.parse(args);

    await dataLogger.logAction({
      action: 'analyzeFeedback',
      tool: 'analytics',
      parameters: { feedbackCount: feedback.length, themesCount },
    });

    // Simple keyword extraction and theme identification
    const themes = identifyFeedbackThemes(feedback, themesCount);

    const analysis = {
      success: true,
      analysis: {
        totalFeedback: feedback.length,
        themesIdentified: themes.length,
        themes: themes.map(theme => ({
          name: theme.name,
          frequency: theme.frequency,
          percentage: Math.round((theme.frequency / feedback.length) * 100),
          exampleQuotes: theme.examples,
          sentiment: theme.sentiment,
          productImplications: theme.implications,
        })),
        summary: {
          mostCommonTheme: themes[0]?.name || 'None',
          averageSentiment: calculateAverageSentiment(feedback),
          totalThemes: themes.length,
        },
      },
    };

    await dataLogger.logAction({
      action: 'analyzeFeedback',
      tool: 'analytics',
      parameters: { feedbackCount: feedback.length, themesCount },
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
        dataSize: themes.length,
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(analysis, null, 2),
      }],
      structuredContent: analysis,
    };
  } catch (error) {
    await dataLogger.logAction({
      action: 'analyzeFeedback',
      tool: 'analytics',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error analyzing feedback: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Analyze product usage data and identify behavioral trends
 */
export async function analyzeUsageData(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { usageData, trendsCount } = analyzeUsageDataSchema.parse(args);

    await dataLogger.logAction({
      action: 'analyzeUsageData',
      tool: 'analytics',
      parameters: { dataPoints: usageData.length, trendsCount },
    });

    const trends = identifyUsageTrends(usageData, trendsCount);
    const recommendations = generateFollowUpRecommendations(trends);

    const analysis = {
      success: true,
      analysis: {
        totalDataPoints: usageData.length,
        trendsIdentified: trends.length,
        trends: trends.map(trend => ({
          name: trend.name,
          description: trend.description,
          impact: trend.impact,
          evidence: trend.evidence,
          userSegment: trend.userSegment,
        })),
        recommendations: recommendations,
        summary: {
          mostSignificantTrend: trends[0]?.name || 'None',
          averageUsage: calculateAverageUsage(usageData),
          totalUsers: new Set(usageData.map(d => d.userId)).size,
        },
      },
    };

    await dataLogger.logAction({
      action: 'analyzeUsageData',
      tool: 'analytics',
      parameters: { dataPoints: usageData.length, trendsCount },
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
        dataSize: trends.length,
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(analysis, null, 2),
      }],
      structuredContent: analysis,
    };
  } catch (error) {
    await dataLogger.logAction({
      action: 'analyzeUsageData',
      tool: 'analytics',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error analyzing usage data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Analyze product rollout plan and identify adoption risks
 */
export async function analyzeAdoptionRisks(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { rolloutPlan, risksCount } = analyzeAdoptionRisksSchema.parse(args);

    await dataLogger.logAction({
      action: 'analyzeAdoptionRisks',
      tool: 'analytics',
      parameters: { featuresCount: rolloutPlan.features.length, risksCount },
    });

    const risks = identifyAdoptionRisks(rolloutPlan, risksCount);

    const analysis = {
      success: true,
      analysis: {
        totalFeatures: rolloutPlan.features.length,
        risksIdentified: risks.length,
        risks: risks.map(risk => ({
          name: risk.name,
          description: risk.description,
          likelihood: risk.likelihood,
          impact: risk.impact,
          riskScore: risk.riskScore,
          mitigation: risk.mitigation,
          affectedFeatures: risk.affectedFeatures,
        })),
        summary: {
          highestRisk: risks[0]?.name || 'None',
          averageRiskScore: risks.reduce((sum: number, r: any) => sum + r.riskScore, 0) / risks.length,
          criticalRisks: risks.filter(r => r.riskScore >= 7).length,
        },
      },
    };

    await dataLogger.logAction({
      action: 'analyzeAdoptionRisks',
      tool: 'analytics',
      parameters: { featuresCount: rolloutPlan.features.length, risksCount },
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
        dataSize: risks.length,
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(analysis, null, 2),
      }],
      structuredContent: analysis,
    };
  } catch (error) {
    await dataLogger.logAction({
      action: 'analyzeAdoptionRisks',
      tool: 'analytics',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error analyzing adoption risks: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Analyze A/B test results and provide statistical insights
 */
export async function analyzeABTest(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { testData } = analyzeABTestSchema.parse(args);

    await dataLogger.logAction({
      action: 'analyzeABTest',
      tool: 'analytics',
      parameters: { testName: testData.testName },
    });

    const analysis = performABTestAnalysis(testData);

    await dataLogger.logAction({
      action: 'analyzeABTest',
      tool: 'analytics',
      parameters: { testName: testData.testName },
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
        dataSize: 1,
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(analysis, null, 2),
      }],
      structuredContent: analysis,
    };
  } catch (error) {
    await dataLogger.logAction({
      action: 'analyzeABTest',
      tool: 'analytics',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error analyzing A/B test: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Compare feature adoption across customer segments
 */
export async function analyzeSegmentAdoption(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { adoptionData, segments, features } = analyzeSegmentAdoptionSchema.parse(args);

    await dataLogger.logAction({
      action: 'analyzeSegmentAdoption',
      tool: 'analytics',
      parameters: { segmentsCount: segments.length, featuresCount: features.length },
    });

    const comparison = compareSegmentAdoption(adoptionData, segments, features);

    const analysis = {
      success: true,
      analysis: {
        segments: segments,
        features: features,
        comparison: comparison,
        summary: {
          bestPerformingSegment: comparison.bestPerformingSegment,
          worstPerformingSegment: comparison.worstPerformingSegment,
          averageAdoptionRate: comparison.averageAdoptionRate,
          totalUsers: adoptionData.reduce((sum: number, d: any) => sum + d.userCount, 0),
        },
      },
    };

    await dataLogger.logAction({
      action: 'analyzeSegmentAdoption',
      tool: 'analytics',
      parameters: { segmentsCount: segments.length, featuresCount: features.length },
      result: 'success',
      metadata: {
        executionTime: Date.now() - startTime,
        dataSize: segments.length,
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(analysis, null, 2),
      }],
      structuredContent: analysis,
    };
  } catch (error) {
    await dataLogger.logAction({
      action: 'analyzeSegmentAdoption',
      tool: 'analytics',
      parameters: args,
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Error analyzing segment adoption: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

// Helper functions for analysis

function identifyFeedbackThemes(feedback: any[], themesCount: number): Array<{
  name: string;
  frequency: number;
  examples: string[];
  sentiment: number;
  implications: string[];
}> {
  // Simple keyword-based theme identification
  const keywordMap: Record<string, string[]> = {
    'User Interface': ['ui', 'interface', 'design', 'layout', 'navigation', 'button', 'menu'],
    'Performance': ['slow', 'fast', 'speed', 'loading', 'lag', 'performance', 'responsive'],
    'Features': ['feature', 'functionality', 'capability', 'tool', 'option', 'setting'],
    'Support': ['support', 'help', 'documentation', 'tutorial', 'guide', 'assistance'],
    'Billing': ['billing', 'payment', 'invoice', 'price', 'cost', 'subscription'],
    'Integration': ['integration', 'api', 'connect', 'sync', 'import', 'export'],
    'Reliability': ['bug', 'error', 'crash', 'stable', 'reliable', 'issue'],
    'Usability': ['easy', 'difficult', 'confusing', 'intuitive', 'user-friendly', 'complex'],
  };

  const themeCounts: Record<string, { count: number; examples: string[]; sentiment: number[] }> = {};

  feedback.forEach(item => {
    const text = item.text.toLowerCase();
    const rating = item.rating || 3; // Default neutral rating

    Object.entries(keywordMap).forEach(([theme, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword));
      if (matches.length > 0) {
        if (!themeCounts[theme]) {
          themeCounts[theme] = { count: 0, examples: [], sentiment: [] };
        }
        themeCounts[theme].count++;
        if (themeCounts[theme].examples.length < 3) {
          themeCounts[theme].examples.push(item.text);
        }
        themeCounts[theme].sentiment.push(rating);
      }
    });
  });

  return Object.entries(themeCounts)
    .map(([name, data]) => ({
      name,
      frequency: data.count,
      examples: data.examples,
      sentiment: data.sentiment.reduce((a: number, b: number) => a + b, 0) / data.sentiment.length,
      implications: generateThemeImplications(name, data.sentiment.reduce((a: number, b: number) => a + b, 0) / data.sentiment.length),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, themesCount);
}

function calculateAverageSentiment(feedback: any[]): number {
  const ratings = feedback.map(f => f.rating).filter(r => r !== undefined);
  return ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
}

function generateThemeImplications(theme: string, sentiment: number): string[] {
  const implications: Record<string, string[]> = {
    'User Interface': [
      sentiment < 3 ? 'Consider UI/UX redesign' : 'Continue current design approach',
      'Gather more specific UI feedback',
      'A/B test interface improvements'
    ],
    'Performance': [
      sentiment < 3 ? 'Prioritize performance optimization' : 'Maintain current performance levels',
      'Monitor performance metrics closely',
      'Consider caching strategies'
    ],
    'Features': [
      sentiment < 3 ? 'Review feature usability' : 'Expand successful features',
      'Conduct feature usage analysis',
      'Plan feature roadmap based on feedback'
    ],
    'Support': [
      sentiment < 3 ? 'Improve support documentation' : 'Maintain current support quality',
      'Expand support channels',
      'Create self-service resources'
    ],
    'Billing': [
      sentiment < 3 ? 'Review pricing strategy' : 'Current pricing is acceptable',
      'Improve billing transparency',
      'Consider flexible payment options'
    ],
    'Integration': [
      sentiment < 3 ? 'Improve integration capabilities' : 'Expand integration options',
      'Provide better API documentation',
      'Create integration guides'
    ],
    'Reliability': [
      sentiment < 3 ? 'Address stability issues immediately' : 'Maintain current reliability',
      'Implement better error handling',
      'Increase testing coverage'
    ],
    'Usability': [
      sentiment < 3 ? 'Simplify user workflows' : 'Continue current usability approach',
      'Conduct usability testing',
      'Provide user training materials'
    ],
  };

  return implications[theme] || ['Monitor theme closely', 'Gather more data'];
}

function identifyUsageTrends(usageData: any[], trendsCount: number): Array<{
  name: string;
  description: string;
  impact: string;
  evidence: string;
  userSegment: string;
}> {
  // Group by feature and analyze patterns
  const featureUsage: Record<string, any[]> = {};
  usageData.forEach(data => {
    const feature = data.feature;
    if (feature) {
      if (!featureUsage[feature]) {
        featureUsage[feature] = [];
      }
      featureUsage[feature].push(data);
    }
  });

  const trends = [];

  // Trend 1: Most/Least Used Features
  const featureStats = Object.entries(featureUsage).map(([feature, data]) => ({
    feature,
    totalUsage: data.reduce((sum: number, d: any) => sum + d.usageCount, 0),
    avgUsage: data.reduce((sum: number, d: any) => sum + d.usageCount, 0) / data.length,
    userCount: new Set(data.map(d => d.userId)).size,
  })).sort((a, b) => b.totalUsage - a.totalUsage);

  if (featureStats.length > 0 && featureStats[0]) {
    trends.push({
      name: 'Feature Usage Distribution',
      description: `Feature "${featureStats[0].feature}" is most used with ${featureStats[0].totalUsage} total interactions`,
      impact: 'high',
      evidence: `Top 3 features: ${featureStats.slice(0, 3).map((f: any) => `${f.feature} (${f.totalUsage})`).join(', ')}`,
      userSegment: 'all',
    });
  }

  // Trend 2: Session Duration Patterns
  const sessionData = usageData.filter(d => d.sessionDuration !== undefined);
  if (sessionData.length > 0) {
    const avgDuration = sessionData.reduce((sum: number, d: any) => sum + d.sessionDuration, 0) / sessionData.length;
    trends.push({
      name: 'Session Duration Patterns',
      description: `Average session duration is ${Math.round(avgDuration)} minutes`,
      impact: avgDuration > 30 ? 'high' : 'medium',
      evidence: `Based on ${sessionData.length} sessions with duration data`,
      userSegment: 'all',
    });
  }

  // Trend 3: User Segment Behavior
  const segmentData = usageData.filter(d => d.userSegment);
  if (segmentData.length > 0) {
    const segmentUsage: Record<string, number> = {};
    segmentData.forEach(d => {
      segmentUsage[d.userSegment] = (segmentUsage[d.userSegment] || 0) + d.usageCount;
    });
  const topSegment = Object.entries(segmentUsage).sort((a, b) => b[1] - a[1])[0];
  if (topSegment) {
    trends.push({
      name: 'Segment Usage Patterns',
      description: `${topSegment[0]} segment shows highest engagement`,
      impact: 'medium',
      evidence: `Segment usage: ${Object.entries(segmentUsage).map(([s, u]) => `${s}: ${u}`).join(', ')}`,
      userSegment: topSegment[0],
    });
  }
  }

  return trends.slice(0, trendsCount);
}

function generateFollowUpRecommendations(trends: Array<{
  name: string;
  description: string;
  impact: string;
  evidence: string;
  userSegment: string;
}>): string[] {
  const recommendations: string[] = [];
  
  trends.forEach(trend => {
    switch (trend.name) {
      case 'Feature Usage Distribution':
        recommendations.push('Conduct user interviews to understand feature preferences');
        recommendations.push('Analyze feature usage patterns over time');
        break;
      case 'Session Duration Patterns':
        recommendations.push('Investigate factors affecting session duration');
        recommendations.push('A/B test different onboarding flows');
        break;
      case 'Segment Usage Patterns':
        recommendations.push('Create targeted features for high-engagement segments');
        recommendations.push('Investigate why certain segments have lower engagement');
        break;
    }
  });

  return [...new Set(recommendations)].slice(0, 2);
}

function calculateAverageUsage(usageData: any[]): number {
  return usageData.reduce((sum: number, d: any) => sum + d.usageCount, 0) / usageData.length;
}

function identifyAdoptionRisks(rolloutPlan: any, risksCount: number): Array<{
  name: string;
  description: string;
  likelihood: string;
  impact: string;
  riskScore: number;
  mitigation: string;
  affectedFeatures: string[];
}> {
  const risks = [];

  // Risk 1: Complex Features
  const complexFeatures = rolloutPlan.features.filter((f: any) => f.complexity === 'high');
  if (complexFeatures.length > 0) {
    risks.push({
      name: 'High Complexity Features',
      description: `${complexFeatures.length} high-complexity features may be difficult to adopt`,
      likelihood: 'high',
      impact: 'high',
      riskScore: 8,
      mitigation: 'Provide extensive training and documentation',
      affectedFeatures: complexFeatures.map((f: any) => f.name),
    });
  }

  // Risk 2: Feature Dependencies
  const dependentFeatures = rolloutPlan.features.filter((f: any) => f.dependencies && f.dependencies.length > 0);
  if (dependentFeatures.length > 0) {
    risks.push({
      name: 'Feature Dependencies',
      description: 'Features with dependencies may cause rollout delays',
      likelihood: 'medium',
      impact: 'high',
      riskScore: 7,
      mitigation: 'Create dependency mapping and contingency plans',
      affectedFeatures: dependentFeatures.map((f: any) => f.name),
    });
  }

  // Risk 3: User Resistance
  const resistantSegments = rolloutPlan.userSegments.filter((s: any) => s.resistanceToChange === 'high');
  if (resistantSegments.length > 0) {
    risks.push({
      name: 'User Resistance',
      description: `${resistantSegments.length} user segments show high resistance to change`,
      likelihood: 'high',
      impact: 'medium',
      riskScore: 6,
      mitigation: 'Implement change management strategies and gradual rollout',
      affectedFeatures: rolloutPlan.features.map((f: any) => f.name),
    });
  }

  // Risk 4: Timeline Pressure
  const totalDuration = rolloutPlan.timeline.phases.reduce((sum: number, phase: any) => sum + phase.duration, 0);
  if (totalDuration < 90) { // Less than 3 months
    risks.push({
      name: 'Aggressive Timeline',
      description: 'Short rollout timeline may lead to rushed implementation',
      likelihood: 'medium',
      impact: 'high',
      riskScore: 7,
      mitigation: 'Consider extending timeline or reducing scope',
      affectedFeatures: rolloutPlan.features.map((f: any) => f.name),
    });
  }

  // Risk 5: Low Tech Savviness
  const lowTechSegments = rolloutPlan.userSegments.filter((s: any) => s.techSavviness === 'low');
  if (lowTechSegments.length > 0) {
    risks.push({
      name: 'Low Technical Adoption',
      description: `${lowTechSegments.length} segments have low technical savviness`,
      likelihood: 'high',
      impact: 'medium',
      riskScore: 6,
      mitigation: 'Provide extensive training and simplified interfaces',
      affectedFeatures: rolloutPlan.features.map((f: any) => f.name),
    });
  }

  return risks.sort((a, b) => b.riskScore - a.riskScore).slice(0, risksCount);
}

function performABTestAnalysis(testData: any): {
  success: boolean;
  analysis: {
    testName: string;
    isSignificant: boolean;
    confidenceLevel: number;
    winner: string;
    improvement: number;
    lift: number;
    zScore: number;
    confidenceInterval: { lower: number; upper: number };
    metrics: {
      variantA: { name: string; conversionRate: number; conversions: number; sampleSize: number };
      variantB: { name: string; conversionRate: number; conversions: number; sampleSize: number };
    };
    recommendations: string[];
  };
} {
  const { variantA, variantB, confidenceLevel } = testData;
  
  // Calculate conversion rates
  const rateA = variantA.conversionRate;
  const rateB = variantB.conversionRate;
  
  // Calculate sample sizes
  const nA = variantA.sampleSize;
  const nB = variantB.sampleSize;
  
  // Calculate pooled standard error
  const pooledRate = (variantA.conversions + variantB.conversions) / (nA + nB);
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/nA + 1/nB));
  
  // Calculate z-score
  const zScore = Math.abs(rateB - rateA) / se;
  
  // Determine significance (simplified - using z-score > 1.96 for 95% confidence)
  const criticalValue = confidenceLevel === 0.95 ? 1.96 : 2.58; // 95% or 99%
  const isSignificant = zScore > criticalValue;
  
  // Calculate confidence interval
  const marginOfError = criticalValue * se;
  const confidenceInterval = {
    lower: (rateB - rateA) - marginOfError,
    upper: (rateB - rateA) + marginOfError,
  };
  
  // Calculate lift
  const lift = ((rateB - rateA) / rateA) * 100;
  
  // Determine winner
  const winner = rateB > rateA ? variantB.name : variantA.name;
  const improvement = Math.abs(lift);
  
  return {
    success: true,
    analysis: {
      testName: testData.testName,
      isSignificant,
      confidenceLevel,
      winner,
      improvement: Math.round(improvement * 100) / 100,
      lift: Math.round(lift * 100) / 100,
      zScore: Math.round(zScore * 100) / 100,
      confidenceInterval,
      metrics: {
        variantA: {
          name: variantA.name,
          conversionRate: rateA,
          conversions: variantA.conversions,
          sampleSize: nA,
        },
        variantB: {
          name: variantB.name,
          conversionRate: rateB,
          conversions: variantB.conversions,
          sampleSize: nB,
        },
      },
      recommendations: generateABTestRecommendations(isSignificant, improvement, winner),
    },
  };
}

function generateABTestRecommendations(isSignificant: boolean, improvement: number, winner: string): string[] {
  const recommendations = [];
  
  if (isSignificant) {
    if (improvement > 10) {
      recommendations.push(`Implement ${winner} immediately - shows strong positive impact`);
      recommendations.push('Plan for full rollout of winning variant');
    } else if (improvement > 5) {
      recommendations.push(`Consider implementing ${winner} - shows moderate improvement`);
      recommendations.push('Run additional tests to validate results');
    } else {
      recommendations.push(`Implement ${winner} cautiously - improvement is small`);
      recommendations.push('Monitor closely for any negative side effects');
    }
  } else {
    recommendations.push('Results are not statistically significant');
    recommendations.push('Consider running test longer or increasing sample size');
  }
  
  return recommendations;
}

function compareSegmentAdoption(adoptionData: any[], segments: string[], features: string[]): {
  segmentStats: Record<string, any>;
  bestPerformingSegment: string;
  worstPerformingSegment: string;
  averageAdoptionRate: number;
} {
  const segmentStats: Record<string, any> = {};
  
  // Initialize segment stats
  segments.forEach(segment => {
    segmentStats[segment] = {
      totalUsers: 0,
      totalRevenue: 0,
      features: {},
      averageAdoptionRate: 0,
      averageRetentionRate: 0,
    };
  });
  
  // Calculate stats for each segment
  adoptionData.forEach(data => {
    if (segments.includes(data.segment)) {
      const segment = segmentStats[data.segment];
      segment.totalUsers += data.userCount;
      segment.totalRevenue += data.revenue || 0;
      
      if (!segment.features[data.feature]) {
        segment.features[data.feature] = {
          adoptionRate: 0,
          usageFrequency: 0,
          retentionRate: 0,
          userCount: 0,
        };
      }
      
      segment.features[data.feature].adoptionRate = data.adoptionRate;
      segment.features[data.feature].usageFrequency = data.usageFrequency;
      segment.features[data.feature].retentionRate = data.retentionRate;
      segment.features[data.feature].userCount = data.userCount;
    }
  });
  
  // Calculate averages
  Object.values(segmentStats).forEach((segment: any) => {
    const featureCount = Object.keys(segment.features).length;
    if (featureCount > 0) {
      segment.averageAdoptionRate = Object.values(segment.features)
        .reduce((sum: number, f: any) => sum + f.adoptionRate, 0) / featureCount;
      segment.averageRetentionRate = Object.values(segment.features)
        .reduce((sum: number, f: any) => sum + f.retentionRate, 0) / featureCount;
    }
  });
  
  // Find best and worst performing segments
  const sortedSegments = Object.entries(segmentStats)
    .sort((a, b) => b[1].averageAdoptionRate - a[1].averageAdoptionRate);
  
  const bestPerformingSegment = sortedSegments[0]?.[0] || 'None';
  const worstPerformingSegment = sortedSegments[sortedSegments.length - 1]?.[0] || 'None';
  
  const averageAdoptionRate = sortedSegments.reduce((sum: number, [, stats]: [string, any]) => sum + stats.averageAdoptionRate, 0) / sortedSegments.length;
  
  return {
    segmentStats,
    bestPerformingSegment,
    worstPerformingSegment,
    averageAdoptionRate: Math.round(averageAdoptionRate * 100) / 100,
  };
}