'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { RevenueData } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface RevenueChartProps {
  data: RevenueData[]
  loading?: boolean
}

type ChartType = 'line' | 'bar'
type Period = '7d' | '30d' | '90d'

export function RevenueChart({ data, loading = false }: RevenueChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [period, setPeriod] = useState<Period>('30d')

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Omsætning</h3>
          <div className="flex space-x-2">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'revenue') {
      return [formatCurrency(value), 'Omsætning']
    }
    return [value, 'Jobs']
  }

  const formatXAxisLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return formatDate(date, 'short')
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Omsætning & Jobs</h3>
        <div className="flex space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">7 dage</option>
            <option value="30d">30 dage</option>
            <option value="90d">90 dage</option>
          </select>
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-sm ${
                chartType === 'line'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Linje
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-sm ${
                chartType === 'bar'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Søjle
            </button>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisLabel}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                yAxisId="revenue"
                orientation="left"
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                yAxisId="jobs"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip
                formatter={formatTooltipValue}
                labelFormatter={(label) => formatDate(new Date(label), 'long')}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Line
                yAxisId="jobs"
                type="monotone"
                dataKey="jobs"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisLabel}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                yAxisId="revenue"
                orientation="left"
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                yAxisId="jobs"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip
                formatter={formatTooltipValue}
                labelFormatter={(label) => formatDate(new Date(label), 'long')}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar
                yAxisId="revenue"
                dataKey="revenue"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}