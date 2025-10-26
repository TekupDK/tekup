import { FileText, Mail, Calendar, UserPlus, Plus } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../ui/Card';

export function QuickActions() {
  const actions = [
    { icon: FileText, label: 'Create Invoice', color: 'bg-primary-500' },
    { icon: Mail, label: 'Send Email', color: 'bg-success-500' },
    { icon: Calendar, label: 'Book Appointment', color: 'bg-warning-500' },
    { icon: UserPlus, label: 'Add Lead', color: 'bg-purple-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
              >
                <div className={`${action.color} p-3 rounded-lg mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
