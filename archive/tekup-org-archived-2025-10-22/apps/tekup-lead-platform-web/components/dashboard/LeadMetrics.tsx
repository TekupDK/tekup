'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface LeadMetricsProps {
  tenant: string
}

const getMetricsData = (tenant: string) => {
  if (tenant === 'rendetalje') {
    return [
      { name: 'Jan', leads: 45, qualified: 38, converted: 8, revenue: 28400 },
      { name: 'Feb', leads: 52, qualified: 44, converted: 12, revenue: 42800 },
      { name: 'Mar', leads: 48, qualified: 41, converted: 9, revenue: 35600 },
      { name: 'Apr', leads: 61, qualified: 52, converted: 14, revenue: 48900 },
      { name: 'Maj', leads: 59, qualified: 48, converted: 11, revenue: 39200 },
      { name: 'Jun', leads: 67, qualified: 58, converted: 16, revenue: 56700 },
    ]
  }
  return [
    { name: 'Jan', leads: 25, qualified: 18, converted: 4, revenue: 15400 },
    { name: 'Feb', leads: 32, qualified: 24, converted: 7, revenue: 22800 },
    { name: 'Mar', leads: 28, qualified: 21, converted: 5, revenue: 18600 },
    { name: 'Apr', leads: 41, qualified: 32, converted: 9, revenue: 32900 },
    { name: 'Maj', leads: 39, qualified: 28, converted: 7, revenue: 26200 },
    { name: 'Jun', leads: 47, qualified: 38, converted: 12, revenue: 41700 },
  ]
}

export default function LeadMetrics({ tenant }: LeadMetricsProps) {
  const data = getMetricsData(tenant)

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Lead Metrics - {tenant === 'rendetalje' ? 'Rendetalje' : 'Overview'}
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            Total Leads
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Qualified
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            Converted
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              className="text-gray-600"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className="text-gray-600"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="leads" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Total Leads"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="qualified" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Qualified"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="converted" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              name="Converted"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {tenant === 'rendetalje' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Månedlig Omsætning (Estimeret)</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  className="text-gray-600"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-gray-600"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('da-DK')} kr`, 'Omsætning']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
