import { presetSystem } from '../utils/preset-system.js';
import { dataLogger } from '../utils/data-logger.js';

/**
 * Analyze user patterns to understand behavior and preferences
 */
export async function analyzeUserPatterns(client: any, args: { userId?: string }) {
  const startTime = Date.now();
  
  try {
    await dataLogger.logAction({
      action: 'analyze_patterns',
      tool: 'presets',
      parameters: args,
    });

    const pattern = await presetSystem.analyzeUserPatterns(args.userId);
    
    // Generate insights based on the pattern
    const insights = generateInsights(pattern);
    const recommendations = generateRecommendations(pattern);

    const executionTime = Date.now() - startTime;

    await dataLogger.logAction({
      action: 'analyze_patterns',
      tool: 'presets',
      parameters: args,
      result: 'success',
      metadata: { executionTime }
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: 'User patterns analyzed successfully',
          pattern,
          insights,
          recommendations,
        }, null, 2),
      }],
      structuredContent: {
        success: true,
        message: 'User patterns analyzed successfully',
        pattern,
        insights,
        recommendations,
      }
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await dataLogger.logAction({
      action: 'analyze_patterns',
      tool: 'presets',
      parameters: args,
      result: 'error',
      metadata: { 
        executionTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    });
    
    return {
      content: [{
        type: 'text' as const,
        text: `Error analyzing patterns: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Generate personalized presets based on user patterns
 */
export async function generatePersonalizedPresets(client: any, args: { userId?: string; limit?: number }) {
  const startTime = Date.now();
  
  try {
    await dataLogger.logAction({
      action: 'generate_presets',
      tool: 'presets',
      parameters: args,
    });

    const presets = await presetSystem.generatePersonalizedPresets(args.userId);
    const limitedPresets = args.limit ? presets.slice(0, args.limit) : presets;

    const executionTime = Date.now() - startTime;

    await dataLogger.logAction({
      action: 'generate_presets',
      tool: 'presets',
      parameters: args,
      result: 'success',
      metadata: { executionTime, dataSize: limitedPresets.length }
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: `Generated ${limitedPresets.length} personalized presets`,
          presets: limitedPresets,
          total: presets.length,
        }, null, 2),
      }],
      structuredContent: {
        success: true,
        message: `Generated ${limitedPresets.length} personalized presets`,
        presets: limitedPresets,
        total: presets.length,
      }
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await dataLogger.logAction({
      action: 'generate_presets',
      tool: 'presets',
      parameters: args,
      result: 'error',
      metadata: { 
        executionTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    });
    
    return {
      content: [{
        type: 'text' as const,
        text: `Error generating presets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Get recommended presets for a user
 */
export async function getRecommendedPresets(client: any, args: { userId?: string; limit?: number }) {
  const startTime = Date.now();
  
  try {
    await dataLogger.logAction({
      action: 'get_recommendations',
      tool: 'presets',
      parameters: args,
    });

    const presets = presetSystem.getRecommendedPresets(args.userId, args.limit);

    const executionTime = Date.now() - startTime;

    await dataLogger.logAction({
      action: 'get_recommendations',
      tool: 'presets',
      parameters: args,
      result: 'success',
      metadata: { executionTime, dataSize: presets.length }
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: `Found ${presets.length} recommended presets`,
          presets,
        }, null, 2),
      }],
      structuredContent: {
        success: true,
        message: `Found ${presets.length} recommended presets`,
        presets,
      }
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await dataLogger.logAction({
      action: 'get_recommendations',
      tool: 'presets',
      parameters: args,
      result: 'error',
      metadata: { 
        executionTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    });
    
    return {
      content: [{
        type: 'text' as const,
        text: `Error getting recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Execute a preset with optional parameter overrides
 */
export async function executePreset(client: any, args: { presetId: string; overrideParams?: Record<string, any> }) {
  const startTime = Date.now();
  
  try {
    await dataLogger.logAction({
      action: 'execute_preset',
      tool: 'presets',
      parameters: args,
    });

    const results = await presetSystem.executePreset(args.presetId, args.overrideParams);

    const executionTime = Date.now() - startTime;

    await dataLogger.logAction({
      action: 'execute_preset',
      tool: 'presets',
      parameters: args,
      result: 'success',
      metadata: { executionTime, dataSize: results.length }
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: `Executed preset ${args.presetId}`,
          results,
        }, null, 2),
      }],
      structuredContent: {
        success: true,
        message: `Executed preset ${args.presetId}`,
        results,
      }
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await dataLogger.logAction({
      action: 'execute_preset',
      tool: 'presets',
      parameters: args,
      result: 'error',
      metadata: { 
        executionTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    });
    
    return {
      content: [{
        type: 'text' as const,
        text: `Error executing preset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * List all available presets
 */
export async function listPresets(client: any, args: { businessType?: string }) {
  const startTime = Date.now();
  
  try {
    await dataLogger.logAction({
      action: 'list_presets',
      tool: 'presets',
      parameters: args,
    });

    const presets = presetSystem.listPresets(args.businessType);

    const executionTime = Date.now() - startTime;

    await dataLogger.logAction({
      action: 'list_presets',
      tool: 'presets',
      parameters: args,
      result: 'success',
      metadata: { executionTime, dataSize: presets.length }
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: `Found ${presets.length} presets`,
          presets,
          total: presets.length,
        }, null, 2),
      }],
      structuredContent: {
        success: true,
        message: `Found ${presets.length} presets`,
        presets,
        total: presets.length,
      }
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await dataLogger.logAction({
      action: 'list_presets',
      tool: 'presets',
      parameters: args,
      result: 'error',
      metadata: { 
        executionTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    });
    
    return {
      content: [{
        type: 'text' as const,
        text: `Error listing presets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

/**
 * Create a custom preset
 */
export async function createCustomPreset(client: any, args: { 
  name: string; 
  description: string; 
  businessType: 'freelancer' | 'retail' | 'service' | 'general';
  actions: Array<{
    tool: string;
    action: string;
    parameters: Record<string, any>;
    order: number;
    description: string;
  }>;
}) {
  const startTime = Date.now();
  
  try {
    await dataLogger.logAction({
      action: 'create_custom_preset',
      tool: 'presets',
      parameters: args,
      result: 'success',
      metadata: { executionTime: 0 }
    });

    const preset = presetSystem.createCustomPreset(
      args.name,
      args.description,
      args.businessType,
      args.actions
    );

    const executionTime = Date.now() - startTime;

    await dataLogger.logAction({
      action: 'create_custom_preset',
      tool: 'presets',
      parameters: args,
      result: 'success',
      metadata: { executionTime }
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          message: `Created custom preset: ${preset.name}`,
          preset,
        }, null, 2),
      }],
      structuredContent: {
        success: true,
        message: `Created custom preset: ${preset.name}`,
        preset,
      }
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await dataLogger.logAction({
      action: 'create_custom_preset',
      tool: 'presets',
      parameters: args,
      result: 'error',
      metadata: { 
        executionTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    });
    
    return {
      content: [{
        type: 'text' as const,
        text: `Error creating custom preset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      isError: true,
    };
  }
}

// Helper functions
function generateInsights(pattern: any) {
  const insights = [];
  
  if (pattern.commonActions.length > 0) {
    insights.push(`Most common action: ${pattern.commonActions[0]}`);
  }
  
  if (pattern.businessType !== 'unknown') {
    insights.push(`Business type identified as: ${pattern.businessType}`);
  }
  
  if (pattern.timePatterns.mostActiveHours.length > 0) {
    insights.push(`Most active during hours: ${pattern.timePatterns.mostActiveHours.join(', ')}`);
  }
  
  return insights;
}

function generateRecommendations(pattern: any) {
  const recommendations = [];
  
  if (pattern.commonActions.length >= 3) {
    recommendations.push('Consider creating a workflow preset for your common actions');
  }
  
  if (pattern.businessType === 'freelancer') {
    recommendations.push('Quick invoice presets would be beneficial for your workflow');
  }
  
  if (pattern.businessType === 'retail') {
    recommendations.push('Product management presets could streamline your operations');
  }
  
  return recommendations;
}