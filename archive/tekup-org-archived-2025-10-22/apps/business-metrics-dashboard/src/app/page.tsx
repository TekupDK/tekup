'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Title, 
  Text, 
  Metric, 
  AreaChart, 
  BarChart, 
  DonutChart,
  Grid,
  Flex,
  Badge,
  ProgressBar
} from '@tremor/react'
import { 
  CurrencyEuroIcon,
  UserGroupIcon,
  ChartBarIcon,
  TrendingUpIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

// Mock data - replace with real API calls
const mockData = {
  revenue: {
    total: 156000,
    monthly: 45000,
    growth: 23.5,
    consulting: 120000,
    products: 36000
  },
  clients: {
    total: 12,
    active: 8,
    newThisMonth: 3,
    satisfaction: 9.2
  },
  projects: {
    completed: 15,
    inProgress: 4,
    pipeline: 8,
    averageValue: 18500
  },
  products: {
    voicedk: { users: 45, mrr: 2205 },
    multidash: { users: 23, mrr: 2277 },
    compliancebot: { users: 8, mrr: 1592 },
    crosssync: { users: 18, mrr: 1422 }
  }
}

const monthlyRevenueData = [
  { month: 'Jan', Consulting: 15000, Products: 2000, Total: 17000 },
  { month: 'Feb', Consulting: 22000, Products: 4500, Total: 26500 },
  { month: 'Mar', Consulting: 18000, Products: 6200, Total: 24200 },
  { month: 'Apr', Consulting: 35000, Products: 8900, Total: 43900 },
  { month: 'Maj', Consulting: 28000, Products: 12400, Total: 40400 },
  { month: 'Jun', Consulting: 45000, Products: 15600, Total: 60600 },
]

const clientAcquisitionData = [
  { month: 'Jan', 'New Clients': 2, 'Repeat Business': 1 },
  { month: 'Feb', 'New Clients': 3, 'Repeat Business': 1 },
  { month: 'Mar', 'New Clients': 2, 'Repeat Business': 2 },
  { month: 'Apr', 'New Clients': 4, 'Repeat Business': 1 },
  { month: 'Maj', 'New Clients': 3, 'Repeat Business': 3 },
  { month: 'Jun', 'New Clients': 5, 'Repeat Business': 2 },
]

const productMrrData = [
  { name: 'VoiceDK', value: 2205, growth: 15.2 },
  { name: 'MultiDash', value: 2277, growth: 22.1 },
  { name: 'ComplianceBot', value: 1592, growth: 8.7 },
  { name: 'CrossSync', value: 1422, growth: 12.4 },
]

export default function BusinessMetricsDashboard() {
  const [timeRange, setTimeRange] = useState('6months')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Title className="text-3xl font-bold text-gray-900">
            Tekup AI Business Dashboard
          </Title>
          <Text className="text-gray-600 mt-2">
            Real-time metrics for AI consulting og micro-SaaS businesses
          </Text>
        </div>

        {/* KPI Cards */}
        <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-8">
          <Card decoration="top" decorationColor="blue">
            <Flex alignItems="start">
              <div>
                <Text>Total Revenue (YTD)</Text>
                <Metric>€{mockData.revenue.total.toLocaleString()}</Metric>
              </div>
              <CurrencyEuroIcon className="h-8 w-8 text-blue-500" />
            </Flex>
            <Flex className="mt-4">
              <Text className="truncate">vs. last year</Text>
              <Text>+{mockData.revenue.growth}%</Text>
            </Flex>
          </Card>

          <Card decoration="top" decorationColor="green">
            <Flex alignItems="start">
              <div>
                <Text>Monthly Recurring Revenue</Text>
                <Metric>€{(mockData.products.voicedk.mrr + mockData.products.multidash.mrr + mockData.products.compliancebot.mrr + mockData.products.crosssync.mrr).toLocaleString()}</Metric>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-green-500" />
            </Flex>
            <Flex className="mt-4">
              <Text className="truncate">Growth rate</Text>
              <Text>+18.2%</Text>
            </Flex>
          </Card>

          <Card decoration="top" decorationColor="purple">
            <Flex alignItems="start">
              <div>
                <Text>Active Clients</Text>
                <Metric>{mockData.clients.active}</Metric>
              </div>
              <UserGroupIcon className="h-8 w-8 text-purple-500" />
            </Flex>
            <Flex className="mt-4">
              <Text className="truncate">Satisfaction</Text>
              <Text>{mockData.clients.satisfaction}/10</Text>
            </Flex>
          </Card>

          <Card decoration="top" decorationColor="orange">
            <Flex alignItems="start">
              <div>
                <Text>Projects in Pipeline</Text>
                <Metric>{mockData.projects.pipeline}</Metric>
              </div>
              <ChartBarIcon className="h-8 w-8 text-orange-500" />
            </Flex>
            <Flex className="mt-4">
              <Text className="truncate">Avg. project value</Text>
              <Text>€{mockData.projects.averageValue.toLocaleString()}</Text>
            </Flex>
          </Card>
        </Grid>

        {/* Revenue Charts */}
        <Grid numItemsMd={2} className="gap-6 mb-8">
          <Card>
            <Title>Revenue Breakdown</Title>
            <Text>Consulting vs Product revenue over time</Text>
            <AreaChart
              className="mt-6"
              data={monthlyRevenueData}
              index="month"
              categories={["Consulting", "Products"]}
              colors={["blue", "purple"]}
              valueFormatter={(number: number) => `€${number.toLocaleString()}`}
              showLegend={true}
              showGridLines={true}
            />
          </Card>

          <Card>
            <Title>Client Acquisition</Title>
            <Text>New vs repeat business clients</Text>
            <BarChart
              className="mt-6"
              data={clientAcquisitionData}
              index="month"
              categories={["New Clients", "Repeat Business"]}
              colors={["green", "blue"]}
              valueFormatter={(number: number) => `${number} clients`}
              showLegend={true}
            />
          </Card>
        </Grid>

        {/* Product Performance */}
        <Grid numItemsMd={2} className="gap-6 mb-8">
          <Card>
            <Title>Micro-SaaS Performance</Title>
            <Text>Monthly recurring revenue by product</Text>
            <DonutChart
              className="mt-6"
              data={productMrrData}
              category="value"
              index="name"
              valueFormatter={(number: number) => `€${number}`}
              colors={["blue", "purple", "green", "orange"]}
              showTooltip={true}
            />
          </Card>

          <Card>
            <Title>Product Growth Rates</Title>
            <Text>Month-over-month growth for each product</Text>
            <div className="mt-6 space-y-4">
              {productMrrData.map((product) => (
                <div key={product.name}>
                  <Flex>
                    <Text>{product.name}</Text>
                    <Text>€{product.value.toLocaleString()}</Text>
                  </Flex>
                  <Flex className="mt-2">
                    <ProgressBar value={product.growth} className="flex-1" color="blue" />
                    <Text className="ml-2">+{product.growth}%</Text>
                  </Flex>
                </div>
              ))}
            </div>
          </Card>
        </Grid>

        {/* Business Health Indicators */}
        <Grid numItemsMd={3} className="gap-6 mb-8">
          <Card>
            <Title>Sales Pipeline</Title>
            <div className="mt-6 space-y-4">
              <div>
                <Flex>
                  <Text>Discovery Calls</Text>
                  <Text>12</Text>
                </Flex>
                <ProgressBar value={75} color="blue" className="mt-2" />
              </div>
              <div>
                <Flex>
                  <Text>Proposals Sent</Text>
                  <Text>8</Text>
                </Flex>
                <ProgressBar value={50} color="purple" className="mt-2" />
              </div>
              <div>
                <Flex>
                  <Text>Negotiations</Text>
                  <Text>4</Text>
                </Flex>
                <ProgressBar value={25} color="green" className="mt-2" />
              </div>
            </div>
          </Card>

          <Card>
            <Title>Client Satisfaction</Title>
            <div className="mt-6 space-y-4">
              <div>
                <Text>Overall Satisfaction</Text>
                <Metric>{mockData.clients.satisfaction}/10</Metric>
                <Badge color="green" className="mt-2">Excellent</Badge>
              </div>
              <div className="mt-4">
                <Text>Referral Rate</Text>
                <Metric>67%</Metric>
                <Text className="text-sm text-gray-600">8 af 12 clients har refereret</Text>
              </div>
            </div>
          </Card>

          <Card>
            <Title>Time Allocation</Title>
            <div className="mt-6 space-y-3">
              <div>
                <Flex>
                  <Text>Client Delivery</Text>
                  <Text>60%</Text>
                </Flex>
                <ProgressBar value={60} color="blue" className="mt-1" />
              </div>
              <div>
                <Flex>
                  <Text>Product Development</Text>
                  <Text>25%</Text>
                </Flex>
                <ProgressBar value={25} color="purple" className="mt-1" />
              </div>
              <div>
                <Flex>
                  <Text>Marketing & Sales</Text>
                  <Text>15%</Text>
                </Flex>
                <ProgressBar value={15} color="green" className="mt-1" />
              </div>
            </div>
          </Card>
        </Grid>

        {/* Goals & Targets */}
        <Card className="mb-8">
          <Title>2024 Goals Progress</Title>
          <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mt-6">
            <div>
              <Text>Annual Revenue Target</Text>
              <Metric>€350K</Metric>
              <Flex className="mt-2">
                <ProgressBar value={44.6} color="blue" className="flex-1" />
                <Text className="ml-2">44.6%</Text>
              </Flex>
              <Text className="text-sm text-gray-600 mt-1">€156K achieved</Text>
            </div>
            
            <div>
              <Text>Newsletter Subscribers</Text>
              <Metric>1,000</Metric>
              <Flex className="mt-2">
                <ProgressBar value={32} color="purple" className="flex-1" />
                <Text className="ml-2">32%</Text>
              </Flex>
              <Text className="text-sm text-gray-600 mt-1">320 current subscribers</Text>
            </div>

            <div>
              <Text>Product MRR Target</Text>
              <Metric>€15K</Metric>
              <Flex className="mt-2">
                <ProgressBar value={49.6} color="green" className="flex-1" />
                <Text className="ml-2">49.6%</Text>
              </Flex>
              <Text className="text-sm text-gray-600 mt-1">€7.4K current MRR</Text>
            </div>

            <div>
              <Text>Client Projects</Text>
              <Metric>24</Metric>
              <Flex className="mt-2">
                <ProgressBar value={62.5} color="orange" className="flex-1" />
                <Text className="ml-2">62.5%</Text>
              </Flex>
              <Text className="text-sm text-gray-600 mt-1">15 projects completed</Text>
            </div>
          </Grid>
        </Card>

        {/* Recent Activity */}
        <Grid numItemsMd={2} className="gap-6">
          <Card>
            <Title>Recent Client Activity</Title>
            <div className="mt-6 space-y-4">
              {[
                { client: 'Restaurant Kæden A/S', action: 'Project completed', date: '2 dage siden', status: 'success' },
                { client: 'Service Firma ApS', action: 'Proposal sent', date: '1 dag siden', status: 'pending' },
                { client: 'Retail Group', action: 'Discovery call', date: 'I dag', status: 'scheduled' },
                { client: 'Healthcare Klinik', action: 'Follow-up needed', date: '3 dage siden', status: 'action' }
              ].map((activity, index) => (
                <Flex key={index} className="items-center">
                  <div className="flex-1">
                    <Text className="font-medium">{activity.client}</Text>
                    <Text className="text-sm text-gray-600">{activity.action}</Text>
                  </div>
                  <div className="text-right">
                    <Badge 
                      color={
                        activity.status === 'success' ? 'green' :
                        activity.status === 'pending' ? 'yellow' :
                        activity.status === 'scheduled' ? 'blue' : 'red'
                      }
                    >
                      {activity.date}
                    </Badge>
                  </div>
                </Flex>
              ))}
            </div>
          </Card>

          <Card>
            <Title>Product User Growth</Title>
            <div className="mt-6 space-y-4">
              {Object.entries(mockData.products).map(([product, data]) => (
                <div key={product}>
                  <Flex>
                    <Text className="capitalize">{product}</Text>
                    <Text>{data.users} users</Text>
                  </Flex>
                  <Flex className="mt-1">
                    <Text className="text-sm text-gray-600">€{data.mrr} MRR</Text>
                    <Badge color="green">+12% this month</Badge>
                  </Flex>
                </div>
              ))}
            </div>
          </Card>
        </Grid>

        {/* Action Items */}
        <Card className="mt-8">
          <Title>This Week's Action Items</Title>
          <div className="mt-6 space-y-3">
            {[
              { task: 'Follow up with 3 warm prospects', priority: 'high', due: 'Today' },
              { task: 'Complete VoiceDK feature update', priority: 'medium', due: 'Tomorrow' },
              { task: 'Send newsletter issue #12', priority: 'medium', due: 'Friday' },
              { task: 'Record course module 3', priority: 'low', due: 'Next week' }
            ].map((item, index) => (
              <Flex key={index} className="items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Text className="font-medium">{item.task}</Text>
                  <Text className="text-sm text-gray-600">Due: {item.due}</Text>
                </div>
                <Badge 
                  color={
                    item.priority === 'high' ? 'red' :
                    item.priority === 'medium' ? 'yellow' : 'gray'
                  }
                >
                  {item.priority}
                </Badge>
              </Flex>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}