import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  message: string;
  tenant_id?: string;
  language?: string;
  context?: {
    consciousness_level?: number;
    active_agents?: string[];
    tekup_services?: string[];
  };
  useAgentScope?: boolean;
}

interface AgentScopeResponse {
  response: string;
  agent_used: string;
  tools_executed: string[];
  consciousness_level: number;
  confidence: number;
  processing_time_ms: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, tenant_id = 'jarvis_app', language = 'da', context, useAgentScope = true } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Always route to AgentScope Enhanced backend for Jarvis Foundation Model
    const agentScopeUrl = process.env.AGENTSCOPE_API_URL || 'http://localhost:8001';
    
    console.log(`🤖 Routing chat request to AgentScope Enhanced: ${agentScopeUrl}/jarvis/generate`);

    const agentScopeResponse = await fetch(`${agentScopeUrl}/jarvis/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: message.trim(),
        task_type: 'chat',
        danish_context: language === 'da',
        max_tokens: 2000
      }),
    });

    if (!agentScopeResponse.ok) {
      const errorText = await agentScopeResponse.text();
      console.error('❌ AgentScope API error:', agentScopeResponse.status, errorText);
      
      // Fallback response if AgentScope is down
      return NextResponse.json({
        response: "Undskyld, jeg har midlertidigt forbindelsesproblemer til mine avancerede systemer. Prøv igen om et øjeblik.",
        agent_used: "fallback",
        tools_executed: [],
        consciousness_level: 5.0,
        confidence: 0.5,
        processing_time_ms: 100,
        error: "AgentScope temporarily unavailable"
      });
    }

    const result = await agentScopeResponse.json();
    
    console.log(`✅ AgentScope Enhanced response received:`, {
      model: result.model,
      task_type: result.task_type,
      danish_context: result.danish_context,
      timestamp: result.timestamp
    });

    return NextResponse.json({
      response: result.response,
      agent_used: result.model,
      tools_executed: [],
      consciousness_level: 8.9,
      confidence: 0.95,
      processing_time_ms: 1200,
    });

  } catch (error) {
    console.error('💥 Chat API error:', error);
    
    return NextResponse.json({
      response: "Der opstod en teknisk fejl. Sørg for at AgentScope backend kører på port 8000.",
      agent_used: "error_handler", 
      tools_executed: [],
      consciousness_level: 3.0,
      confidence: 0.3,
      processing_time_ms: 50,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
