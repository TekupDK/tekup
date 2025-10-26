'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface QualificationChartProps {
  tenant: string
}

const getQualificationData = (tenant: string) => {
  if (tenant === 'rendetalje') {
    return [
      { name: 'Hot Leads', value: 23, color: '#ef4444' },
      { name: 'Warm Leads', value: 34, color: '#f59e0b' },
      { name: 'Cold Leads', value: 32, color: '#3b82f6' },
      { name: 'Unqualified', value: 11, color: '#6b7280' }
    ]
  }
  return [
    { name: 'Hot Leads', value: 15, color: '#ef4444' },
    { name: 'Warm Leads', value: 28, color: '#f59e0b' },
    { name: 'Cold Leads', value: 35, color: '#3b82f6' },
    { name: 'Unqualified', value: 22, color: '#6b7280' }
  ]
}

const getQualificationInsights = (tenant: string) => {
  if (tenant === 'rendetalje') {
    return [
      { label: 'Højeste scoring', value: 'Flytterengøring i Aarhus C', type: 'success' },
      { label: 'Mest aktive kanal', value: 'Leadpoint (67% af kvalificerede)', type: 'info' },
      { label: 'Gennemsnitlig responstid', value: '2.3 timer', type: 'warning' },
      { label: 'Konverteringsrate', value: '26% (over branchemål)', type: 'success' }
    ]
  }
  return [
    { label: 'Top category', value: 'Enterprise leads', type: 'success' },
    { label: 'Best channel', value: 'Direct contact', type: 'info' },
    { label: 'Avg response', value: '4.1 hours', type: 'warning' },
    { label: 'Conversion', value: '22%', type: 'info' }
  ]
}

export default function QualificationChart({ tenant }: QualificationChartProps) {
  const data = getQualificationData(tenant)
  const insights = getQualificationInsights(tenant)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.value} leads</p>
          <p className="text-xs text-gray-500">
            {((data.value / data.total) * 100).toFixed(1)}% af total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Lead Kvalifikation Fordeling
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontWeight: 500 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Kvalifikations Indsigter</h4>
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                insight.type === 'success' ? 'bg-green-400' :
                insight.type === 'warning' ? 'bg-yellow-400' :
                insight.type === 'info' ? 'bg-blue-400' : 'bg-gray-400'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {insight.label}
                </p>
                <p className="text-sm text-gray-600">
                  {insight.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rendetalje specific insights */}
      {tenant === 'rendetalje' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Rengørings-specifikt</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Flytterengøring</div>
              <div className="text-2xl font-bold text-blue-900">67%</div>
              <div className="text-xs text-blue-600">af kvalificerede leads</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Aarhus Geo-match</div>
              <div className="text-2xl font-bold text-green-900">94%</div>
              <div className="text-xs text-green-600">postnummer match rate</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Gennemsnit m²</div>
              <div className="text-2xl font-bold text-purple-900">89</div>
              <div className="text-xs text-purple-600">kvadratmeter pr. job</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
