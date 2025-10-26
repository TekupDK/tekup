import React, { useState, useEffect } from 'react';
import { useTekUpAuth } from '../../contexts/TekUpAuthContext';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy';
  currentTask?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
}

export const WorkspaceDashboard: React.FC = () => {
  const { user, logout } = useTekUpAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load projects and agents for the workspace
      const [projectsResponse, agentsResponse] = await Promise.all([
        fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('tekup_auth_token')}`,
          },
        }),
        fetch('/api/agents', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('tekup_auth_token')}`,
          },
        }),
      ]);

      if (projectsResponse.ok && agentsResponse.ok) {
        const projectsData = await projectsResponse.json();
        const agentsData = await agentsResponse.json();
        setProjects(projectsData);
        setAgents(agentsData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewProject = async () => {
    const projectName = prompt('Enter project name:');
    if (!projectName) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tekup_auth_token')}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: `AI Agent collaboration project for ${projectName}`,
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const createNewAgent = async () => {
    const agentName = prompt('Enter agent name:');
    if (!agentName) return;

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tekup_auth_token')}`,
        },
        body: JSON.stringify({
          name: agentName,
          role: 'assistant',
          type: 'claude-3-sonnet',
        }),
      });

      if (response.ok) {
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AgentRooms</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name} • {user?.workspaceId}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {user?.subscription.plan} ({user?.subscription.status})
          </div>
          <button
            onClick={logout}
            className="text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Active Projects</h3>
          <p className="text-2xl font-bold text-blue-900">
            {projects.filter(p => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Available Agents</h3>
          <p className="text-2xl font-bold text-green-900">{agents.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600">Active Agents</h3>
          <p className="text-2xl font-bold text-yellow-900">
            {agents.filter(a => a.status === 'active').length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Subscription</h3>
          <p className="text-sm font-bold text-purple-900">
            {user?.subscription.maxUsers} users
          </p>
        </div>
      </div>

      {/* Projects Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
          <button
            onClick={createNewProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            New Project
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{project.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{project.description}</p>
              <div className="text-xs text-gray-500">
                {project.agents.length} agents assigned
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agents Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">AI Agents</h2>
          <button
            onClick={createNewAgent}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Agent
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{agent.name}</h3>
                <div className={`w-3 h-3 rounded-full ${
                  agent.status === 'active' ? 'bg-green-400' :
                  agent.status === 'busy' ? 'bg-yellow-400' :
                  'bg-gray-400'
                }`}></div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{agent.role}</p>
              {agent.currentTask && (
                <p className="text-xs text-blue-600">{agent.currentTask}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
