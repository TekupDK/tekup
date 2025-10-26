import { AIAgent } from '../../types';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface AgentMonitorProps {
  agents: AIAgent[];
}

export function AgentMonitor({ agents }: AgentMonitorProps) {
  const getStatusIcon = (status: AIAgent['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-success-600" />;
      case 'processing':
        return <Activity className="w-4 h-4 text-warning-600 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-danger-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: AIAgent['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      case 'error':
        return <Badge variant="danger">Error</Badge>;
      default:
        return <Badge variant="gray">Idle</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Agent Status</h3>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">{getStatusIcon(agent.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {agent.name}
                      </h4>
                      {getStatusBadge(agent.status)}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {agent.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Tasks: {agent.tasks_processed.toLocaleString()}</span>
                      <span>Avg. Response: {agent.average_response_time}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
