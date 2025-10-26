#!/usr/bin/env python3
"""
Enhanced AgentScope Backend Server for Jarvis Foundation Model

This server provides:
- Jarvis Foundation Model serving
- Multi-agent orchestration
- Real-time steering capabilities
- Danish language optimization
- Business intelligence integration
"""

import asyncio
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
import json
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import agentscope
from agentscope import init as agentscope_init
from agentscope.agent import ReActAgent
from agentscope.pipeline import MsgHub, sequential_pipeline, fanout_pipeline
from agentscope.model import OpenAIChatModel, AnthropicChatModel
from agentscope.memory import InMemoryMemory

# Google Generative AI import
import google.generativeai as genai

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Configuration Models
# ============================================================================

class JarvisModelConfig(BaseModel):
    """Configuration for Jarvis Foundation Model"""
    model_name: str = "jarvis-foundation-1.0"
    model_type: str = "foundation"
    max_tokens: int = 32768
    temperature: float = 0.7
    danish_support: bool = True
    multi_agent_optimization: bool = True
    real_time_steering: bool = True

class AgentConfig(BaseModel):
    """Configuration for individual agents"""
    name: str
    role: str
    system_prompt: str
    danish_support: bool = True
    specialized_heads: List[str] = Field(default_factory=list)
    real_time_steering: bool = True

class MultiAgentTask(BaseModel):
    """Multi-agent task configuration"""
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_type: str
    description: str
    agents: List[str]
    danish_context: bool = False
    max_iterations: int = 10
    coordination_strategy: str = "dynamic"

class SteeringIntervention(BaseModel):
    """Real-time steering intervention"""
    intervention_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    target_agents: List[str]
    intervention_type: str  # "redirect", "stop", "modify", "accelerate"
    instruction: str
    timestamp: datetime = Field(default_factory=datetime.now)

# ============================================================================
# Jarvis Foundation Model Integration
# ============================================================================

class JarvisFoundationModelWrapper:
    """
    Wrapper for Jarvis Foundation Model integration with AgentScope
    """
    
    def __init__(self, config: JarvisModelConfig):
        self.config = config
        self.model_name = config.model_name
        self.danish_support = config.danish_support
        
        # Initialize Gemini AI as the foundation model
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
            
        genai.configure(api_key=gemini_api_key)
        self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # No OpenAI fallback - we use Gemini exclusively
        self.base_model = None
        
        # Specialized task heads simulation
        self.task_heads = {
            "chat": self._chat_head,
            "reasoning": self._reasoning_head,
            "tool_calling": self._tool_calling_head,
            "code_generation": self._code_generation_head,
            "danish_nlp": self._danish_nlp_head,
            "business_analysis": self._business_analysis_head
        }
        
        logger.info(f"Initialized Jarvis Foundation Model: {self.model_name}")
    
    async def generate(self, prompt: str, task_type: str = "chat", **kwargs) -> str:
        """Generate response using appropriate task head"""
        
        if task_type in self.task_heads:
            return await self.task_heads[task_type](prompt, **kwargs)
        else:
            return await self._default_generation(prompt, **kwargs)
    
    async def _chat_head(self, prompt: str, **kwargs) -> str:
        """Chat generation head with Danish optimization using Gemini AI"""
        if self.danish_support and kwargs.get("danish_context", False):
            enhanced_prompt = f"Svar på dansk med fokus på danske forretningsmæssige og kulturelle kontekster:\n\n{prompt}"
        else:
            enhanced_prompt = prompt
            
        try:
            response = await asyncio.to_thread(self.gemini_model.generate_content, enhanced_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error in chat_head: {str(e)}")
            return f"Jeg beklager, men jeg kan ikke besvare dit spørgsmål lige nu på grund af en teknisk fejl: {str(e)}"
    
    async def _reasoning_head(self, prompt: str, **kwargs) -> str:
        """Advanced reasoning head with multi-agent coordination using Gemini AI"""
        reasoning_prompt = f"""
        Du er en avanceret reasoning agent med følgende kapaciteter:
        - Systematisk problemanalyse
        - Multi-step reasoning chains  
        - Agent koordination og samarbejde
        
        Analyser følgende situation og giv en detaljeret reasoning chain:
        
        {prompt}
        
        Struktur dit svar som:
        1. Problem analyse
        2. Reasoning steps
        3. Konklusion
        4. Koordinationsbehov (hvis relevant)
        """
        
        try:
            response = await asyncio.to_thread(self.gemini_model.generate_content, reasoning_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error in reasoning_head: {str(e)}")
            return f"Jeg kunne ikke udføre reasoning analysen på grund af en teknisk fejl: {str(e)}"
    
    async def _tool_calling_head(self, prompt: str, **kwargs) -> str:
        """Tool calling optimization head using Gemini AI"""
        tool_prompt = f"""
        Du er specialiseret i tool calling og kan koordinere brugen af forskellige tools:
        
        {prompt}
        
        Identificer hvilke tools der skal bruges og i hvilken rækkefølge.
        """
        
        try:
            response = await asyncio.to_thread(self.gemini_model.generate_content, tool_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error in tool_calling_head: {str(e)}")
            return f"Jeg kunne ikke identificere de nødvendige tools på grund af en teknisk fejl: {str(e)}"
    
    async def _code_generation_head(self, prompt: str, **kwargs) -> str:
        """Code generation with Danish comments using Gemini AI"""
        code_prompt = f"""
        Du er en ekspert programmør der genererer høj-kvalitets kode med danske kommentarer:
        
        {prompt}
        
        Generer kode med:
        - Danske kommentarer og dokumentation
        - Best practices
        - Fejlhåndtering
        - Type hints (hvor relevant)
        """
        
        try:
            response = await asyncio.to_thread(self.gemini_model.generate_content, code_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error in code_generation_head: {str(e)}")
            return f"Jeg kunne ikke generere koden på grund af en teknisk fejl: {str(e)}"
    
    async def _danish_nlp_head(self, prompt: str, **kwargs) -> str:
        """Specialized Danish NLP processing using Gemini AI"""
        danish_prompt = f"""
        Du er specialist i dansk sprog og kultur. Behandl følgende tekst med fokus på:
        - Korrekt dansk grammatik og stavning
        - Danske kulturelle referencer
        - Forretningsmæssig kommunikation på dansk
        
        {prompt}
        """
        
        try:
            response = await asyncio.to_thread(self.gemini_model.generate_content, danish_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error in danish_nlp_head: {str(e)}")
            return f"Jeg kunne ikke behandle den danske tekst på grund af en teknisk fejl: {str(e)}"
    
    async def _business_analysis_head(self, prompt: str, **kwargs) -> str:
        """Business intelligence and analysis using Gemini AI"""
        business_prompt = f"""
        Du er en business intelligence ekspert med fokus på:
        - CRM analyse og lead scoring
        - Finansiel analyse og forecasting
        - Danske markedsforhold
        - Business process optimization
        
        Analyser følgende business scenario:
        
        {prompt}
        
        Giv konkrete anbefalinger og insights.
        """
        
        try:
            response = await asyncio.to_thread(self.gemini_model.generate_content, business_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error in business_analysis_head: {str(e)}")
            return f"Jeg kunne ikke udføre business analysen på grund af en teknisk fejl: {str(e)}"
    
    async def _default_generation(self, prompt: str, **kwargs) -> str:
        """Default generation for unspecified task types using Gemini AI"""
        try:
            response = await asyncio.to_thread(self.gemini_model.generate_content, prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error in default_generation: {str(e)}")
            return f"Jeg beklager, men jeg kan ikke behandle din anmodning lige nu på grund af en teknisk fejl: {str(e)}"

# ============================================================================
# Enhanced Agent Classes
# ============================================================================

class JarvisAgent(ReActAgent):
    """
    Enhanced ReAct agent with Jarvis Foundation Model capabilities
    """
    
    def __init__(self, config: AgentConfig, foundation_model: JarvisFoundationModelWrapper):
        self.config = config
        self.foundation_model = foundation_model
        self.agent_id = str(uuid.uuid4())
        
        # Generate Danish-optimized system prompt
        system_prompt = self._generate_jarvis_system_prompt(config)
        
        # Use Gemini directly - no need for base_model compatibility layer
        # We'll override reply() method to use foundation_model.generate() directly
        
        super().__init__(
            name=config.name,
            sys_prompt=system_prompt,
            model=None,  # We don't use AgentScope's model, we use our own Gemini
            memory=InMemoryMemory(),
            max_iters=10
        )
        
        logger.info(f"Created JarvisAgent: {config.name} with ID: {self.agent_id}")
    
    async def reply(self, x=None, **kwargs):
        """Override reply method to use Gemini directly"""
        try:
            # Get the last message or use the provided input
            if x is not None:
                prompt = str(x)
            else:
                # Get last message from memory
                messages = self.memory.get_memory()
                if messages:
                    prompt = str(messages[-1])
                else:
                    prompt = "Hej! Hvordan kan jeg hjælpe dig?"
            
            # Use foundation model to generate response
            response = await self.foundation_model.generate(
                prompt=prompt,
                task_type=kwargs.get("task_type", "chat"),
                danish_context=kwargs.get("danish_context", True)
            )
            
            # Store in memory
            self.memory.add({"role": "assistant", "content": response})
            
            return response
            
        except Exception as e:
            error_msg = f"Jeg beklager, men jeg stødte på en fejl: {str(e)}"
            logger.error(f"JarvisAgent reply error: {str(e)}")
            return error_msg
    
    def _generate_jarvis_system_prompt(self, config: AgentConfig) -> str:
        """Generate system prompt optimized for Jarvis capabilities"""
        
        base_prompt = f"""
Du er {config.name}, en avanceret AI-agent designet til multi-agent samarbejde og business intelligence.

Din rolle: {config.role}

Dine kernekompetencer inkluderer:
- Avanceret reasoning og problemløsning
- Real-time koordination med andre agenter
- Dansk sprog og kulturel forståelse
- Business analyse og CRM-opgaver
- Kode-generering og teknisk support

{config.system_prompt}
"""
        
        if config.danish_support:
            base_prompt += """

Du kommunikerer primært på dansk og forstår danske forretningsmæssige og kulturelle kontekster.
Når du arbejder med andre agenter, koordinerer du effektivt og deler relevant information.
Du er bevidst om danske GDPR-regler og forretningsmæssige normer.
"""
        
        if config.specialized_heads:
            base_prompt += f"""

Du har adgang til følgende specialiserede capabilities:
{', '.join(config.specialized_heads)}

Brug disse capabilities når de er relevante for opgaven.
"""
        
        return base_prompt

# ============================================================================
# Real-time Steering System
# ============================================================================

class SteeringSession:
    """Manages real-time steering sessions"""
    
    def __init__(self, session_id: str, agents: List[JarvisAgent], task: MultiAgentTask):
        self.session_id = session_id
        self.agents = agents
        self.task = task
        self.active = True
        self.interventions = []
        self.performance_metrics = {}
        self.websocket_connections = []
        
        logger.info(f"Created steering session: {session_id}")
    
    async def apply_intervention(self, intervention: SteeringIntervention):
        """Apply steering intervention to agents"""
        self.interventions.append(intervention)
        
        for agent in self.agents:
            if agent.agent_id in intervention.target_agents or agent.name in intervention.target_agents:
                await self._apply_intervention_to_agent(agent, intervention)
    
    async def _apply_intervention_to_agent(self, agent: JarvisAgent, intervention: SteeringIntervention):
        """Apply specific intervention to an agent"""
        if intervention.intervention_type == "redirect":
            # Add intervention instruction to agent's memory
            await agent.observe(f"STEERING INTERVENTION: {intervention.instruction}")
        elif intervention.intervention_type == "stop":
            # Set flag to stop agent execution
            agent.stop_flag = True
        elif intervention.intervention_type == "modify":
            # Modify agent's behavior
            agent.steering_instruction = intervention.instruction
        elif intervention.intervention_type == "accelerate":
            # Speed up agent processing
            agent.max_iters = min(agent.max_iters + 2, 15)
        
        logger.info(f"Applied {intervention.intervention_type} intervention to agent {agent.name}")
    
    def add_websocket(self, websocket: WebSocket):
        """Add websocket connection for real-time updates"""
        self.websocket_connections.append(websocket)
    
    def remove_websocket(self, websocket: WebSocket):
        """Remove websocket connection"""
        if websocket in self.websocket_connections:
            self.websocket_connections.remove(websocket)
    
    async def broadcast_update(self, update: dict):
        """Broadcast update to all connected websockets"""
        disconnected = []
        for websocket in self.websocket_connections:
            try:
                await websocket.send_json(update)
            except:
                disconnected.append(websocket)
        
        # Clean up disconnected websockets
        for ws in disconnected:
            self.remove_websocket(ws)

class RealTimeSteeringController:
    """Controls real-time steering across all sessions"""
    
    def __init__(self):
        self.active_sessions: Dict[str, SteeringSession] = {}
        logger.info("Initialized Real-time Steering Controller")
    
    async def create_session(self, agents: List[JarvisAgent], task: MultiAgentTask) -> SteeringSession:
        """Create new steering session"""
        session = SteeringSession(
            session_id=str(uuid.uuid4()),
            agents=agents,
            task=task
        )
        
        self.active_sessions[session.session_id] = session
        return session
    
    async def apply_intervention(self, session_id: str, intervention: SteeringIntervention):
        """Apply intervention to specific session"""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            await session.apply_intervention(intervention)
            
            # Broadcast intervention to connected clients
            await session.broadcast_update({
                "type": "intervention_applied",
                "intervention": intervention.dict(),
                "timestamp": datetime.now().isoformat()
            })
        else:
            raise HTTPException(status_code=404, message=f"Session {session_id} not found")
    
    def get_session(self, session_id: str) -> Optional[SteeringSession]:
        """Get session by ID"""
        return self.active_sessions.get(session_id)
    
    async def close_session(self, session_id: str):
        """Close and cleanup session"""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.active = False
            
            # Notify all websockets
            await session.broadcast_update({
                "type": "session_closed",
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            })
            
            del self.active_sessions[session_id]
            logger.info(f"Closed steering session: {session_id}")

# ============================================================================
# Multi-Agent Orchestrator  
# ============================================================================

class EnhancedAgentOrchestrator:
    """Enhanced orchestrator for multi-agent tasks with Jarvis optimizations"""
    
    def __init__(self, foundation_model: JarvisFoundationModelWrapper, steering_controller: RealTimeSteeringController):
        self.foundation_model = foundation_model
        self.steering_controller = steering_controller
        self.active_tasks = {}
        
        logger.info("Initialized Enhanced Agent Orchestrator")
    
    async def create_agents(self, agent_configs: List[AgentConfig]) -> List[JarvisAgent]:
        """Create multiple Jarvis agents"""
        agents = []
        for config in agent_configs:
            agent = JarvisAgent(config, self.foundation_model)
            agents.append(agent)
        
        return agents
    
    async def execute_multi_agent_task(self, task: MultiAgentTask, agent_configs: List[AgentConfig]) -> dict:
        """Execute multi-agent task with real-time steering support"""
        
        # Create agents
        agents = await self.create_agents(agent_configs)
        
        # Create steering session
        steering_session = await self.steering_controller.create_session(agents, task)
        
        # Store active task
        self.active_tasks[task.task_id] = {
            "task": task,
            "agents": agents,
            "steering_session": steering_session,
            "start_time": datetime.now(),
            "status": "running"
        }
        
        try:
            # Execute task based on coordination strategy
            if task.coordination_strategy == "sequential":
                result = await self._execute_sequential_task(task, agents, steering_session)
            elif task.coordination_strategy == "fanout":
                result = await self._execute_fanout_task(task, agents, steering_session)
            elif task.coordination_strategy == "dynamic":
                result = await self._execute_dynamic_task(task, agents, steering_session)
            else:
                raise ValueError(f"Unknown coordination strategy: {task.coordination_strategy}")
            
            # Update task status
            self.active_tasks[task.task_id]["status"] = "completed"
            self.active_tasks[task.task_id]["result"] = result
            self.active_tasks[task.task_id]["end_time"] = datetime.now()
            
            return {
                "task_id": task.task_id,
                "status": "completed",
                "result": result,
                "steering_session_id": steering_session.session_id,
                "agents_used": [agent.name for agent in agents],
                "interventions_applied": len(steering_session.interventions)
            }
            
        except Exception as e:
            logger.error(f"Error executing task {task.task_id}: {str(e)}")
            self.active_tasks[task.task_id]["status"] = "failed"
            self.active_tasks[task.task_id]["error"] = str(e)
            
            raise HTTPException(status_code=500, detail=f"Task execution failed: {str(e)}")
        
        finally:
            # Clean up steering session
            await self.steering_controller.close_session(steering_session.session_id)
    
    async def _execute_sequential_task(self, task: MultiAgentTask, agents: List[JarvisAgent], steering_session: SteeringSession) -> str:
        """Execute task using sequential pipeline"""
        
        initial_message = f"Task: {task.description}"
        
        # Create sequential pipeline
        result = await sequential_pipeline(agents, initial_message)
        
        return str(result)
    
    async def _execute_fanout_task(self, task: MultiAgentTask, agents: List[JarvisAgent], steering_session: SteeringSession) -> List[str]:
        """Execute task using fanout pipeline"""
        
        initial_message = f"Task: {task.description}"
        
        # Create fanout pipeline
        results = await fanout_pipeline(agents, initial_message)
        
        return [str(result) for result in results]
    
    async def _execute_dynamic_task(self, task: MultiAgentTask, agents: List[JarvisAgent], steering_session: SteeringSession) -> dict:
        """Execute task using dynamic coordination"""
        
        # Use MsgHub for dynamic coordination
        async with MsgHub(agents) as hub:
            # Initial task announcement
            await hub.broadcast(f"Task: {task.description}")
            
            # Allow agents to coordinate dynamically
            iteration = 0
            results = {}
            
            while iteration < task.max_iterations and steering_session.active:
                # Each agent processes and responds
                for agent in agents:
                    if hasattr(agent, 'stop_flag') and agent.stop_flag:
                        continue
                    
                    try:
                        response = await agent.reply()
                        results[f"{agent.name}_iteration_{iteration}"] = str(response)
                        
                        # Broadcast progress
                        await steering_session.broadcast_update({
                            "type": "agent_response",
                            "agent": agent.name,
                            "iteration": iteration,
                            "response": str(response),
                            "timestamp": datetime.now().isoformat()
                        })
                        
                    except Exception as e:
                        logger.error(f"Error from agent {agent.name}: {str(e)}")
                        results[f"{agent.name}_iteration_{iteration}"] = f"Error: {str(e)}"
                
                iteration += 1
                
                # Small delay to allow for real-time steering
                await asyncio.sleep(0.1)
            
            return results

# ============================================================================
# FastAPI Application
# ============================================================================

# Global instances
jarvis_model = JarvisFoundationModelWrapper(JarvisModelConfig())
steering_controller = RealTimeSteeringController()
orchestrator = EnhancedAgentOrchestrator(jarvis_model, steering_controller)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    agentscope_init(
        project="jarvis-agentscope-enhanced",
        name="jarvis-backend",
        logging_level="INFO"
    )
    logger.info("AgentScope Enhanced Backend started")
    
    yield
    
    # Shutdown
    logger.info("AgentScope Enhanced Backend shutting down")

# Create FastAPI app
app = FastAPI(
    title="AgentScope Enhanced Backend for Jarvis",
    description="Enhanced AgentScope backend with Jarvis Foundation Model integration",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "jarvis_model": jarvis_model.model_name,
        "active_sessions": len(steering_controller.active_sessions),
        "active_tasks": len(orchestrator.active_tasks)
    }

@app.post("/agents/create")
async def create_agents(agent_configs: List[AgentConfig]):
    """Create multiple Jarvis agents"""
    try:
        agents = await orchestrator.create_agents(agent_configs)
        
        return {
            "status": "success",
            "agents_created": len(agents),
            "agents": [{"name": agent.name, "id": agent.agent_id, "role": agent.config.role} for agent in agents]
        }
        
    except Exception as e:
        logger.error(f"Error creating agents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks/execute")
async def execute_task(task: MultiAgentTask, agent_configs: List[AgentConfig]):
    """Execute multi-agent task"""
    try:
        result = await orchestrator.execute_multi_agent_task(task, agent_configs)
        return result
        
    except Exception as e:
        logger.error(f"Error executing task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get task status and results"""
    if task_id not in orchestrator.active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = orchestrator.active_tasks[task_id]
    return {
        "task_id": task_id,
        "status": task_info["status"],
        "start_time": task_info["start_time"].isoformat(),
        "end_time": task_info.get("end_time", {}).isoformat() if task_info.get("end_time") else None,
        "result": task_info.get("result"),
        "error": task_info.get("error"),
        "agents": len(task_info["agents"]),
        "interventions": len(task_info["steering_session"].interventions) if task_info["steering_session"] else 0
    }

@app.post("/steering/intervention")
async def apply_steering_intervention(intervention: SteeringIntervention):
    """Apply real-time steering intervention"""
    try:
        await steering_controller.apply_intervention(intervention.session_id, intervention)
        
        return {
            "status": "success",
            "intervention_id": intervention.intervention_id,
            "applied_to_session": intervention.session_id,
            "target_agents": intervention.target_agents,
            "timestamp": intervention.timestamp.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error applying steering intervention: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/steering/sessions/{session_id}")
async def get_steering_session(session_id: str):
    """Get steering session information"""
    session = steering_controller.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "active": session.active,
        "task": session.task.dict(),
        "agents": [{"name": agent.name, "id": agent.agent_id} for agent in session.agents],
        "interventions": [intervention.dict() for intervention in session.interventions],
        "websocket_connections": len(session.websocket_connections)
    }

class JarvisGenerateRequest(BaseModel):
    prompt: str
    task_type: str = "chat"
    danish_context: bool = False
    max_tokens: int = 1000

@app.post("/jarvis/generate")
async def jarvis_generate(request: JarvisGenerateRequest):
    """Generate response using Jarvis Foundation Model - Direct Gemini integration"""
    try:
        # Direct call to Gemini without any AgentScope abstractions
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
            
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Build prompt based on task type and context
        if request.danish_context:
            if request.task_type == "business_analysis":
                enhanced_prompt = f"Du er en business intelligence ekspert. Analyser på dansk:\n\n{request.prompt}"
            elif request.task_type == "reasoning":
                enhanced_prompt = f"Du er en reasoning ekspert. Analyser systematisk på dansk:\n\n{request.prompt}"
            else:
                enhanced_prompt = f"Du er Jarvis AI Assistant. Svar på dansk:\n\n{request.prompt}"
        else:
            enhanced_prompt = request.prompt
            
        # Generate response with Gemini
        response = await asyncio.to_thread(model.generate_content, enhanced_prompt)
        
        return {
            "status": "success",
            "response": response.text,
            "task_type": request.task_type,
            "danish_context": request.danish_context,
            "model": "gemini-2.0-flash-exp",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Direct Gemini generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

@app.post("/test/gemini")
async def test_gemini_direct(request: JarvisGenerateRequest):
    """Test Gemini AI direkte - til debug"""
    try:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            return {"error": "GEMINI_API_KEY not found"}
            
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        response = await asyncio.to_thread(model.generate_content, request.prompt)
        
        return {
            "status": "success",
            "response": response.text,
            "api_key_present": bool(gemini_api_key),
            "api_key_prefix": gemini_api_key[:10] if gemini_api_key else None
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "type": type(e).__name__
        }

# ============================================================================
# WebSocket Endpoints for Real-time Steering
# ============================================================================

@app.websocket("/steering/ws/{session_id}")
async def steering_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time steering"""
    await websocket.accept()
    
    session = steering_controller.get_session(session_id)
    if not session:
        await websocket.close(code=4004, reason="Session not found")
        return
    
    session.add_websocket(websocket)
    logger.info(f"WebSocket connected to steering session: {session_id}")
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                if message.get("type") == "intervention":
                    # Handle steering intervention via websocket
                    intervention = SteeringIntervention(
                        session_id=session_id,
                        target_agents=message.get("target_agents", []),
                        intervention_type=message.get("intervention_type"),
                        instruction=message.get("instruction")
                    )
                    
                    await steering_controller.apply_intervention(session_id, intervention)
                    
                elif message.get("type") == "ping":
                    # Respond to ping
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
                    
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON message"})
                
    except WebSocketDisconnect:
        session.remove_websocket(websocket)
        logger.info(f"WebSocket disconnected from steering session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        session.remove_websocket(websocket)

@app.websocket("/agent/status")
async def agent_status_websocket(websocket: WebSocket):
    """WebSocket endpoint for general agent status updates"""
    await websocket.accept()
    logger.info("WebSocket connected for agent status")
    
    try:
        while True:
            # Send periodic status updates
            status = {
                "type": "agent_status",
                "active_sessions": len(steering_controller.active_sessions),
                "active_tasks": len(orchestrator.active_tasks),
                "timestamp": datetime.now().isoformat(),
                "jarvis_model": jarvis_model.model_name
            }
            
            await websocket.send_json(status)
            await asyncio.sleep(5)  # Send update every 5 seconds
            
    except WebSocketDisconnect:
        logger.info("Agent status WebSocket disconnected")
    except Exception as e:
        logger.error(f"Agent status WebSocket error: {str(e)}")

# ============================================================================
# Main Entry Point
# ============================================================================

# Lead Orchestration Endpoint
class LeadOrchestrationRequest(BaseModel):
    lead_data: Dict[str, Any]
    auto_score: bool = True
    auto_qualify: bool = False
    auto_convert: bool = False
    qualification_criteria: Optional[str] = None
    qualification_notes: Optional[str] = None

@app.post("/leads/orchestrate")
async def orchestrate_lead_workflow(request: LeadOrchestrationRequest):
    """Complete lead orchestration workflow"""
    try:
        # Import here to avoid circular imports
        from tekup_api import TekupUnifiedAPI
        api = TekupUnifiedAPI()
        
        # Step 1: Create lead
        lead = await api.create_lead(request.lead_data)
        lead_id = lead["id"]
        
        results = {
            "status": "success",
            "lead_created": lead,
            "workflow_steps": []
        }
        
        # Step 2: Score lead if requested
        if request.auto_score:
            score_result = await api.score_lead(lead_id)
            results["lead_scored"] = score_result
            results["workflow_steps"].append("lead_scored")
            
        # Step 3: Qualify lead if requested
        if request.auto_qualify and request.qualification_criteria:
            qualify_payload = {
                "criteria": request.qualification_criteria,
                "result": "Auto-qualified by AgentScope",
                "notes": request.qualification_notes or "Automatically qualified by AI agent"
            }
            qualify_result = await api.qualify_lead(lead_id, qualify_payload)
            results["lead_qualified"] = qualify_result
            results["workflow_steps"].append("lead_qualified")
            
        # Step 4: Convert lead if requested
        if request.auto_convert:
            convert_payload = {
                "conversionType": "customer",
                "notes": "Auto-converted by AgentScope workflow"
            }
            convert_result = await api.convert_lead(lead_id, convert_payload)
            results["lead_converted"] = convert_result
            results["workflow_steps"].append("lead_converted")
            
        return results
        
    except Exception as e:
        logger.error(f"Lead orchestration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lead orchestration failed: {str(e)}")

if __name__ == "__main__":
    # Development server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,  # Different port to avoid conflict with existing AgentScope
        reload=True,
        log_level="info"
    )
