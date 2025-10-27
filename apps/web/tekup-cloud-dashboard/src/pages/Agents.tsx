import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { AgentTask, AIAgent } from "../types";

export function Agents() {
  const agents: AIAgent[] = [
    {
      id: "1",
      name: "Lead Capture Agent",
      type: "lead_capture",
      status: "active",
      last_activity: new Date().toISOString(),
      tasks_processed: 1247,
      average_response_time: 145,
      description:
        "Monitors and captures leads from Gmail, Calendar, and Website",
    },
    {
      id: "2",
      name: "Email Automation Agent",
      type: "email_automation",
      status: "active",
      last_activity: new Date().toISOString(),
      tasks_processed: 3421,
      average_response_time: 89,
      description: "Manages email campaigns and automated follow-ups",
    },
    {
      id: "3",
      name: "Calendar Agent",
      type: "calendar",
      status: "processing",
      last_activity: new Date().toISOString(),
      tasks_processed: 892,
      average_response_time: 212,
      description: "Handles meeting scheduling and calendar synchronization",
    },
    {
      id: "4",
      name: "Invoicing Agent",
      type: "invoicing",
      status: "active",
      last_activity: new Date().toISOString(),
      tasks_processed: 567,
      average_response_time: 324,
      description: "Manages Billy.dk invoicing and payment tracking",
    },
    {
      id: "5",
      name: "Support Agent",
      type: "support",
      status: "active",
      last_activity: new Date().toISOString(),
      tasks_processed: 2134,
      average_response_time: 178,
      description: "Provides customer support and knowledge base queries",
    },
    {
      id: "6",
      name: "Analytics Agent",
      type: "analytics",
      status: "active",
      last_activity: new Date().toISOString(),
      tasks_processed: 445,
      average_response_time: 456,
      description: "Generates reports and business intelligence insights",
    },
    {
      id: "7",
      name: "Orchestrator Agent",
      type: "orchestrator",
      status: "active",
      last_activity: new Date().toISOString(),
      tasks_processed: 8923,
      average_response_time: 67,
      description: "Coordinates all agents and manages task distribution",
    },
  ];

  const tasks: AgentTask[] = [
    {
      id: "1",
      agent_id: "2",
      tenant_id: "1",
      title: "Send follow-up email campaign",
      priority: "high",
      status: "processing",
      progress: 65,
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: "2",
      agent_id: "1",
      tenant_id: "1",
      title: "Process new leads from website",
      priority: "medium",
      status: "queued",
      progress: 0,
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    },
    {
      id: "3",
      agent_id: "3",
      tenant_id: "1",
      title: "Sync calendar appointments",
      priority: "low",
      status: "completed",
      progress: 100,
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
      completed_at: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    {
      id: "4",
      agent_id: "4",
      tenant_id: "1",
      title: "Generate monthly invoices",
      priority: "critical",
      status: "queued",
      progress: 0,
      created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    {
      id: "5",
      agent_id: "6",
      tenant_id: "1",
      title: "Generate weekly analytics report",
      priority: "medium",
      status: "processing",
      progress: 35,
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    },
  ];

  const getStatusBadge = (status: AIAgent["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "processing":
        return <Badge variant="warning">Processing</Badge>;
      case "error":
        return <Badge variant="danger">Error</Badge>;
      default:
        return <Badge variant="gray">Idle</Badge>;
    }
  };

  const getTaskStatusBadge = (status: AgentTask["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "processing":
        return <Badge variant="warning">Processing</Badge>;
      case "failed":
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="gray">Queued</Badge>;
    }
  };

  const getPriorityBadge = (priority: AgentTask["priority"]) => {
    switch (priority) {
      case "critical":
        return <Badge variant="danger">Critical</Badge>;
      case "high":
        return <Badge variant="warning">High</Badge>;
      case "medium":
        return <Badge variant="primary">Medium</Badge>;
      default:
        return <Badge variant="gray">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          AI Agent Monitoring
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Monitor and manage all AI agents in the TekUp ecosystem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} hover>
            <CardBody>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {agent.name}
                    </h3>
                    {getStatusBadge(agent.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {agent.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tasks Processed
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {agent.tasks_processed.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Avg Response
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {agent.average_response_time}ms
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Task Queue
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="px-6 py-4">
                      {getTaskStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-12">
                          {task.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
