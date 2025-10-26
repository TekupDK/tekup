import { Card, CardBody } from '../components/ui/Card';
import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      </div>

      <Card>
        <CardBody className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <Construction className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Coming Soon
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              This feature is currently under development. Check back soon for updates!
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
