import { Card, CardHeader, CardBody } from '../ui/Card';

export function PerformanceChart() {
  const data = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 61 },
    { month: 'May', value: 55 },
    { month: 'Jun', value: 67 },
    { month: 'Jul', value: 72 },
  ];

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Business Performance
          </h3>
          <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last year</option>
          </select>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div className="flex items-end justify-between h-48 space-x-2">
            {data.map((item, index) => {
              const height = (item.value / maxValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex items-end justify-center h-40 mb-2">
                    <div
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg hover:from-primary-600 hover:to-primary-500 transition-all cursor-pointer relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded">
                        {item.value}k
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">$428k</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg. Growth</p>
              <p className="text-lg font-bold text-success-600 dark:text-success-400">+12.5%</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Best Month</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">July</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
