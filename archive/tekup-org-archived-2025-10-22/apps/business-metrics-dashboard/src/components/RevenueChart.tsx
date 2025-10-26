'use client'

import { AreaChart, Card, Title, Text } from '@tremor/react'
import { useState, useEffect } from 'react'

interface RevenueData {
  month: string;
  Consulting: number;
  Products: number;
  Content: number;
  Total: number;
}

export function RevenueChart() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call - replace with real data fetching
    const fetchRevenueData = async () => {
      setIsLoading(true)
      
      // Mock data - replace with actual API call
      const data: RevenueData[] = [
        { month: 'Jan', Consulting: 15000, Products: 2000, Content: 500, Total: 17500 },
        { month: 'Feb', Consulting: 22000, Products: 4500, Content: 800, Total: 27300 },
        { month: 'Mar', Consulting: 18000, Products: 6200, Content: 1200, Total: 25400 },
        { month: 'Apr', Consulting: 35000, Products: 8900, Content: 1800, Total: 45700 },
        { month: 'Maj', Consulting: 28000, Products: 12400, Content: 2400, Total: 42800 },
        { month: 'Jun', Consulting: 45000, Products: 15600, Content: 3200, Total: 63800 },
      ]
      
      setRevenueData(data)
      setIsLoading(false)
    }

    fetchRevenueData()
  }, [])

  const valueFormatter = (number: number) => `€${number.toLocaleString()}`

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Title>Revenue Breakdown</Title>
      <Text>Consulting vs Product vs Content revenue over time</Text>
      <AreaChart
        className="mt-6"
        data={revenueData}
        index="month"
        categories={["Consulting", "Products", "Content"]}
        colors={["blue", "purple", "green"]}
        valueFormatter={valueFormatter}
        showLegend={true}
        showGridLines={true}
        curveType="monotone"
        connectNulls={false}
        showAnimation={true}
      />
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <Text className="text-blue-600 font-medium">Consulting</Text>
          <Text className="text-2xl font-bold text-blue-700">
            €{revenueData[revenueData.length - 1]?.Consulting.toLocaleString()}
          </Text>
          <Text className="text-sm text-blue-600">This month</Text>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <Text className="text-purple-600 font-medium">Products</Text>
          <Text className="text-2xl font-bold text-purple-700">
            €{revenueData[revenueData.length - 1]?.Products.toLocaleString()}
          </Text>
          <Text className="text-sm text-purple-600">MRR</Text>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <Text className="text-green-600 font-medium">Content</Text>
          <Text className="text-2xl font-bold text-green-700">
            €{revenueData[revenueData.length - 1]?.Content.toLocaleString()}
          </Text>
          <Text className="text-sm text-green-600">This month</Text>
        </div>
      </div>
    </Card>
  )
}