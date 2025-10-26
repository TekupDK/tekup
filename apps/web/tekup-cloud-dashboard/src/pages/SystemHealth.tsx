import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SystemMetric } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';

export function SystemHealth() {
  const services: SystemMetric[] = [
    { id: '1', service_name: 'API Gateway', status: 'healthy', response_time: 45, uptime_percentage: 99.9, last_check: new Date().toISOString(), error_count: 0 },
    { id: '2', service_name: 'Authentication Service', status: 'healthy', response_time: 32, uptime_percentage: 99.8, last_check: new Date().toISOString(), error_count: 1 },
    { id: '3', service_name: 'Lead Capture Service', status: 'healthy', response_time: 78, uptime_percentage: 99.7, last_check: new Date().toISOString(), error_count: 2 },
    { id: '4', service_name: 'Email Service', status: 'degraded', response_time: 234, uptime_percentage: 98.5, last_check: new Date().toISOString(), error_count: 12 },
    { id: '5', service_name: 'Calendar Integration', status: 'healthy', response_time: 156, uptime_percentage: 99.6, last_check: new Date().toISOString(), error_count: 3 },
    { id: '6', service_name: 'Billy.dk Integration', status: 'healthy', response_time: 189, uptime_percentage: 99.4, last_check: new Date().toISOString(), error_count: 5 },
    { id: '7', service_name: 'Database Primary', status: 'healthy', response_time: 12, uptime_percentage: 99.99, last_check: new Date().toISOString(), error_count: 0 },
    { id: '8', service_name: 'Database Replica', status: 'healthy', response_time: 15, uptime_percentage: 99.95, last_check: new Date().toISOString(), error_count: 0 },
    { id: '9', service_name: 'Cache Layer (Redis)', status: 'healthy', response_time: 3, uptime_percentage: 99.98, last_check: new Date().toISOString(), error_count: 0 },
    { id: '10', service_name: 'Message Queue', status: 'healthy', response_time: 8, uptime_percentage: 99.9, last_check: new Date().toISOString(), error_count: 1 },
    { id: '11', service_name: 'File Storage', status: 'healthy', response_time: 67, uptime_percentage: 99.7, last_check: new Date().toISOString(), error_count: 4 },
    { id: '12', service_name: 'AI Agent Orchestrator', status: 'healthy', response_time: 89, uptime_percentage: 99.8, last_check: new Date().toISOString(), error_count: 2 },
    { id: '13', service_name: 'Notification Service', status: 'healthy', response_time: 54, uptime_percentage: 99.6, last_check: new Date().toISOString(), error_count: 6 },
    { id: '14', service_name: 'Analytics Engine', status: 'healthy', response_time: 234, uptime_percentage: 99.5, last_check: new Date().toISOString(), error_count: 8 },
    { id: '15', service_name: 'Search Service', status: 'healthy', response_time: 98, uptime_percentage: 99.7, last_check: new Date().toISOString(), error_count: 3 },
    { id: '16', service_name: 'Webhook Handler', status: 'healthy', response_time: 123, uptime_percentage: 99.6, last_check: new Date().toISOString(), error_count: 5 },
    { id: '17', service_name: 'Backup Service', status: 'healthy', response_time: 456, uptime_percentage: 99.9, last_check: new Date().toISOString(), error_count: 1 },
    { id: '18', service_name: 'Monitoring Service', status: 'healthy', response_time: 34, uptime_percentage: 99.95, last_check: new Date().toISOString(), error_count: 0 },
    { id: '19', service_name: 'Load Balancer', status: 'healthy', response_time: 5, uptime_percentage: 99.99, last_check: new Date().toISOString(), error_count: 0 },
    { id: '20', service_name: 'CDN Service', status: 'healthy', response_time: 23, uptime_percentage: 99.95, last_check: new Date().toISOString(), error_count: 1 },
    { id: '21', service_name: 'Logging Service', status: 'healthy', response_time: 67, uptime_percentage: 99.8, last_check: new Date().toISOString(), error_count: 3 },
    { id: '22', service_name: 'Security Service', status: 'healthy', response_time: 45, uptime_percentage: 99.9, last_check: new Date().toISOString(), error_count: 1 },
  ];

  const getStatusIcon = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-success-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-danger-600" />;
    }
  };

  const getStatusBadge = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="warning">Degraded</Badge>;
      case 'down':
        return <Badge variant="danger">Down</Badge>;
    }
  };

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const downCount = services.filter(s => s.status === 'down').length;
  const avgResponseTime = Math.round(services.reduce((acc, s) => acc + s.response_time, 0) / services.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Monitor all microservices and infrastructure components
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Healthy Services</p>
                <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1">
                  {healthyCount}/{services.length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-success-600" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Degraded</p>
                <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                  {degradedCount}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning-600" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Down</p>
                <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">
                  {downCount}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-danger-600" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {avgResponseTime}ms
                </p>
              </div>
              <Activity className="w-8 h-8 text-primary-600" />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Services</h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Uptime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Errors (24h)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(service.status)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {service.service_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(service.status)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {service.response_time}ms
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {service.uptime_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${service.error_count > 10 ? 'text-danger-600' : 'text-gray-600 dark:text-gray-400'}`}>
                        {service.error_count}
                      </span>
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
