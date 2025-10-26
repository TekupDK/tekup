import { Activity } from '../../types';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock } from 'lucide-react';

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getActivityBadge = (type: Activity['type']) => {
    const badges: Record<Activity['type'], { variant: 'primary' | 'success' | 'warning' | 'danger' | 'gray'; label: string }> = {
      lead_created: { variant: 'primary', label: 'Lead' },
      invoice_sent: { variant: 'success', label: 'Invoice' },
      email_sent: { variant: 'primary', label: 'Email' },
      meeting_scheduled: { variant: 'success', label: 'Meeting' },
      system_alert: { variant: 'warning', label: 'Alert' },
      agent_action: { variant: 'gray', label: 'Agent' },
    };
    return badges[type];
  };

  return (
    <Card shadow="md">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700" role="list" aria-label="Recent activities">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => {
              const badge = getActivityBadge(activity.type);
              return (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  role="listitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={badge.variant} size="sm">
                          {badge.label}
                        </Badge>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 ml-4">
                      <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                      <time dateTime={activity.created_at} title={new Date(activity.created_at).toLocaleString()}>
                        {formatTime(activity.created_at)}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardBody>
    </Card>
  );
}
