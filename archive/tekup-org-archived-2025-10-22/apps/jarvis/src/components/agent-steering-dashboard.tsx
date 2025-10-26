'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AlertCircle, Play, Pause, Square, Send, Users, Activity, Zap } from 'lucide-react'

// Simple toast replacement function
const showToast = (message: { title: string; description: string; variant?: string }) => {
  console.log(`Toast: ${message.title} - ${message.description}`);
  // In a real implementation, you could add a proper toast notification system
};

interface Agent {
  id: string
  name: string
  role: string
  status: 'active' | 'idle' | 'error' | 'stopped'
  current_task?: string
  performance_metrics?: {
    response_time: number
    success_rate: number
    tokens_used: number
  }
}

interface SteeringSession {
  session_id: string
  active: boolean
  task: {
    task_id: string
    task_type: string
    description: string
    coordination_strategy: string
  }
  agents: Agent[]
  interventions: any[]
  websocket_connections: number
}

interface AgentSteeringDashboardProps {
  sessionId?: string
  onSessionChange?: (sessionId: string) => void
}

export default function AgentSteeringDashboard({ 
  sessionId, 
  onSessionChange 
}: AgentSteeringDashboardProps) {
  
  // State management
  const [session, setSession] = useState<SteeringSession | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [interventionType, setInterventionType] = useState<string>('redirect')
  const [interventionInstruction, setInterventionInstruction] = useState<string>('')
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null)
  const updatesRef = useRef<HTMLDivElement>(null)

  // Enhanced API client for AgentScope backend
  const apiClient = {
    baseUrl: process.env.NEXT_PUBLIC_AGENTSCOPE_API_URL || 'http://localhost:8001',
    
    async getSession(sessionId: string): Promise<SteeringSession> {
      const response = await fetch(`${this.baseUrl}/steering/sessions/${sessionId}`)
      if (!response.ok) throw new Error('Failed to fetch session')
      return response.json()
    },
    
    async applyIntervention(intervention: any) {
      const response = await fetch(`${this.baseUrl}/steering/intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intervention)
      })
      if (!response.ok) throw new Error('Failed to apply intervention')
      return response.json()
    },
    
    async createAgents(agentConfigs: any[]) {
      const response = await fetch(`${this.baseUrl}/agents/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentConfigs)
      })
      if (!response.ok) throw new Error('Failed to create agents')
      return response.json()
    },
    
    async executeTask(task: any, agentConfigs: any[]) {
      const response = await fetch(`${this.baseUrl}/tasks/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, agent_configs: agentConfigs })
      })
      if (!response.ok) throw new Error('Failed to execute task')
      return response.json()
    }
  }

  // WebSocket connection management
  const connectWebSocket = useCallback((sessionId: string) => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    const wsUrl = `ws://localhost:8001/steering/ws/${sessionId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsConnected(true)
      showToast({
        title: 'Connected',
        description: 'Real-time steering connection established',
      })
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Handle different message types
        switch (data.type) {
          case 'agent_response':
            setRealTimeUpdates(prev => [...prev.slice(-50), {
              type: 'agent_response',
              agent: data.agent,
              iteration: data.iteration,
              response: data.response,
              timestamp: data.timestamp
            }])
            break
            
          case 'intervention_applied':
            setRealTimeUpdates(prev => [...prev.slice(-50), {
              type: 'intervention_applied',
              intervention: data.intervention,
              timestamp: data.timestamp
            }])
            break
            
          case 'session_closed':
            setSession(null)
            setIsConnected(false)
            break
            
          default:
            console.log('Received unknown message type:', data.type)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      showToast({
        title: 'Connection Error',
        description: 'Failed to connect to real-time steering',
        variant: 'destructive',
      })
    }

    ws.onclose = () => {
      setIsConnected(false)
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (sessionId) {
          connectWebSocket(sessionId)
        }
      }, 3000)
    }

    wsRef.current = ws
  }, [])

  // Load session data
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true)
      const sessionData = await apiClient.getSession(sessionId)
      setSession(sessionData)
      setAgents(sessionData.agents)
      connectWebSocket(sessionId)
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to load steering session',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [apiClient, connectWebSocket])

  // Apply steering intervention
  const applyIntervention = async () => {
    if (!session || selectedAgents.length === 0 || !interventionInstruction.trim()) {
      showToast({
        title: 'Invalid Input',
        description: 'Please select agents and provide instruction',
        variant: 'destructive',
      })
      return
    }

    try {
      const intervention = {
        session_id: session.session_id,
        target_agents: selectedAgents,
        intervention_type: interventionType,
        instruction: interventionInstruction
      }

      await apiClient.applyIntervention(intervention)
      
      showToast({
        title: 'Intervention Applied',
        description: `${interventionType} applied to ${selectedAgents.length} agent(s)`,
      })

      // Clear form
      setInterventionInstruction('')
      setSelectedAgents([])
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to apply intervention',
        variant: 'destructive',
      })
    }
  }

  // Create new multi-agent task
  const createNewTask = async () => {
    const sampleAgentConfigs = [
      {
        name: 'Jarvis-Analyst',
        role: 'Business Analyst',
        system_prompt: 'Du er en erfaren business analyst der fokuserer på danske markedsforhold.',
        danish_support: true,
        specialized_heads: ['business_analysis', 'danish_nlp'],
        real_time_steering: true
      },
      {
        name: 'Jarvis-Coordinator',
        role: 'Task Coordinator',
        system_prompt: 'Du koordinerer opgaver mellem agenter og sikrer effektiv kommunikation.',
        danish_support: true,
        specialized_heads: ['reasoning', 'tool_calling'],
        real_time_steering: true
      }
    ]

    const sampleTask = {
      task_type: 'business_analysis',
      description: 'Analyser danske markedstendenser og giv strategiske anbefalinger',
      agents: ['Jarvis-Analyst', 'Jarvis-Coordinator'],
      danish_context: true,
      max_iterations: 10,
      coordination_strategy: 'dynamic'
    }

    try {
      setIsLoading(true)
      const result = await apiClient.executeTask(sampleTask, sampleAgentConfigs)
      
      if (result.steering_session_id) {
        await loadSession(result.steering_session_id)
        onSessionChange?.(result.steering_session_id)
      }

      showToast({
        title: 'Task Created',
        description: 'Multi-agent task started successfully',
      })
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-scroll updates
  useEffect(() => {
    if (updatesRef.current) {
      updatesRef.current.scrollTop = updatesRef.current.scrollHeight
    }
  }, [realTimeUpdates])

  // Load session on mount
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [sessionId, loadSession])

  // Agent status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'stopped': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Agent Steering Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time control and monitoring for Jarvis multi-agent systems
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant={isConnected ? "default" : "destructive"} className="px-3 py-1">
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          
          <Button 
            onClick={createNewTask}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Play className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="steering" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
          <TabsTrigger value="steering">Steering Control</TabsTrigger>
          <TabsTrigger value="agents">Agent Status</TabsTrigger>
          <TabsTrigger value="updates">Real-time Updates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Steering Control Tab */}
        <TabsContent value="steering" className="space-y-6">
          {session ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Info */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Active Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p><strong>Task:</strong> {session.task.description}</p>
                    <p><strong>Strategy:</strong> {session.task.coordination_strategy}</p>
                    <p><strong>Agents:</strong> {session.agents.length}</p>
                    <p><strong>Interventions:</strong> {session.interventions.length}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Steering Controls */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Apply Intervention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target Agents</label>
                    <Select 
                      value={selectedAgents[0] || ''} 
                      onValueChange={(value) => setSelectedAgents([value])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.name}>
                            {agent.name} ({agent.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Intervention Type</label>
                    <Select 
                      value={interventionType} 
                      onValueChange={setInterventionType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="redirect">Redirect</SelectItem>
                        <SelectItem value="modify">Modify</SelectItem>
                        <SelectItem value="accelerate">Accelerate</SelectItem>
                        <SelectItem value="stop">Stop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Instruction</label>
                    <Textarea
                      value={interventionInstruction}
                      onChange={(e) => setInterventionInstruction(e.target.value)}
                      placeholder="Provide specific instruction for the intervention..."
                      className="bg-slate-900/50 border-slate-600"
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={applyIntervention}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Apply Intervention
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-400 mb-4">No active steering session</p>
                <Button 
                  onClick={createNewTask}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Create New Multi-Agent Task
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Agent Status Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <Card key={agent.id} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{agent.name}</span>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400">Role</p>
                    <p className="font-medium">{agent.role}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <Badge variant="outline" className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>

                  {agent.current_task && (
                    <div>
                      <p className="text-sm text-slate-400">Current Task</p>
                      <p className="text-sm text-slate-300">{agent.current_task}</p>
                    </div>
                  )}

                  {agent.performance_metrics && (
                    <div className="pt-3 border-t border-slate-700">
                      <p className="text-sm text-slate-400 mb-2">Performance</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Response Time:</span>
                          <span>{agent.performance_metrics.response_time}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate:</span>
                          <span>{agent.performance_metrics.success_rate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tokens Used:</span>
                          <span>{agent.performance_metrics.tokens_used}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Real-time Updates Tab */}
        <TabsContent value="updates" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={updatesRef}
                className="h-96 overflow-y-auto space-y-2 bg-slate-900/30 rounded-lg p-4"
              >
                {realTimeUpdates.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    No updates yet. Activity will appear here in real-time.
                  </p>
                ) : (
                  realTimeUpdates.map((update, index) => (
                    <div 
                      key={index} 
                      className="bg-slate-800/50 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant="outline" 
                          className={update.type === 'agent_response' ? 'text-blue-400' : 'text-orange-400'}
                        >
                          {update.type}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {update.type === 'agent_response' && (
                        <div>
                          <p className="text-slate-300">
                            <strong>{update.agent}</strong> (iteration {update.iteration}):
                          </p>
                          <p className="text-slate-400 mt-1">{update.response}</p>
                        </div>
                      )}
                      
                      {update.type === 'intervention_applied' && (
                        <div>
                          <p className="text-slate-300">
                            <strong>Intervention Applied:</strong> {update.intervention.intervention_type}
                          </p>
                          <p className="text-slate-400 mt-1">{update.intervention.instruction}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-6">
                <div className="text-2xl font-bold">{agents.length}</div>
                <p className="text-sm text-slate-400">Active Agents</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-6">
                <div className="text-2xl font-bold">{session?.interventions.length || 0}</div>
                <p className="text-sm text-slate-400">Interventions Applied</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-6">
                <div className="text-2xl font-bold">{realTimeUpdates.length}</div>
                <p className="text-sm text-slate-400">Real-time Updates</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-6">
                <div className="text-2xl font-bold text-green-400">
                  {isConnected ? 'Online' : 'Offline'}
                </div>
                <p className="text-sm text-slate-400">System Status</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
