'use client'

import { Card, Title, Text, ProgressBar, Flex, Badge } from '@tremor/react'
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline'

interface Goal {
  id: string;
  category: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
}

const goals2024: Goal[] = [
  {
    id: 'annual-revenue',
    category: 'Revenue',
    title: 'Annual Revenue',
    current: 156000,
    target: 395000,
    unit: '€',
    deadline: 'Dec 31, 2024',
    priority: 'high'
  },
  {
    id: 'mrr-target',
    category: 'Products',
    title: 'Monthly Recurring Revenue',
    current: 7496,
    target: 15000,
    unit: '€',
    deadline: 'Dec 31, 2024',
    priority: 'high'
  },
  {
    id: 'newsletter-subs',
    category: 'Marketing',
    title: 'Newsletter Subscribers',
    current: 320,
    target: 1000,
    unit: 'subscribers',
    deadline: 'Dec 31, 2024',
    priority: 'medium'
  },
  {
    id: 'client-count',
    category: 'Clients',
    title: 'Total Clients',
    current: 12,
    target: 24,
    unit: 'clients',
    deadline: 'Dec 31, 2024',
    priority: 'medium'
  },
  {
    id: 'product-users',
    category: 'Products',
    title: 'Total Product Users',
    current: 94,
    target: 200,
    unit: 'users',
    deadline: 'Dec 31, 2024',
    priority: 'medium'
  },
  {
    id: 'satisfaction-score',
    category: 'Quality',
    title: 'Client Satisfaction',
    current: 9.2,
    target: 9.0,
    unit: '/10',
    deadline: 'Ongoing',
    priority: 'low'
  }
]

export function GoalTracker() {
  const calculateProgress = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100)
  }

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'green'
    if (progress >= 60) return 'yellow'
    if (progress >= 40) return 'orange'
    return 'red'
  }

  const getTrendIcon = (current: number, target: number) => {
    const progress = calculateProgress(current, target)
    const expectedProgress = (new Date().getMonth() + 1) / 12 * 100 // Expected progress based on time of year
    
    if (progress > expectedProgress + 10) {
      return <TrendingUpIcon className="h-5 w-5 text-green-500" />
    } else if (progress < expectedProgress - 10) {
      return <TrendingDownIcon className="h-5 w-5 text-red-500" />
    } else {
      return <MinusIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const formatValue = (value: number, unit: string): string => {
    if (unit === '€') {
      return `€${value.toLocaleString()}`
    }
    return `${value.toLocaleString()} ${unit}`
  }

  const getTimeRemaining = (deadline: string): string => {
    if (deadline === 'Ongoing') return 'Ongoing'
    
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30)
      return `${months} måneder tilbage`
    } else if (diffDays > 0) {
      return `${diffDays} dage tilbage`
    } else {
      return 'Overskredet'
    }
  }

  return (
    <Card>
      <Title>2024 Goals Progress</Title>
      <Text>Track progress towards annual business objectives</Text>
      
      <div className="mt-6 space-y-6">
        {goals2024.map((goal) => {
          const progress = calculateProgress(goal.current, goal.target)
          const progressColor = getProgressColor(progress)
          
          return (
            <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
              <Flex className="mb-3">
                <div>
                  <Text className="font-medium">{goal.title}</Text>
                  <Text className="text-sm text-gray-600">{goal.category}</Text>
                </div>
                <div className="text-right">
                  <Flex className="items-center gap-2">
                    {getTrendIcon(goal.current, goal.target)}
                    <Badge 
                      color={goal.priority === 'high' ? 'red' : goal.priority === 'medium' ? 'yellow' : 'gray'}
                    >
                      {goal.priority}
                    </Badge>
                  </Flex>
                </div>
              </Flex>
              
              <Flex className="mb-2">
                <Text className="text-lg font-semibold">
                  {formatValue(goal.current, goal.unit)} / {formatValue(goal.target, goal.unit)}
                </Text>
                <Text className="font-medium">
                  {progress.toFixed(1)}%
                </Text>
              </Flex>
              
              <ProgressBar 
                value={progress} 
                color={progressColor}
                className="mb-2"
              />
              
              <Flex>
                <Text className="text-sm text-gray-600">
                  {getTimeRemaining(goal.deadline)}
                </Text>
                <Text className="text-sm text-gray-600">
                  {goal.target - goal.current > 0 ? 
                    `${formatValue(goal.target - goal.current, goal.unit)} to go` :
                    'Goal achieved!'
                  }
                </Text>
              </Flex>
            </div>
          )
        })}
      </div>
      
      {/* Goal Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Title className="text-blue-700">Goal Summary</Title>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Text className="text-2xl font-bold text-green-600">
              {goals2024.filter(g => calculateProgress(g.current, g.target) >= 80).length}
            </Text>
            <Text className="text-sm text-gray-600">On Track</Text>
          </div>
          <div className="text-center">
            <Text className="text-2xl font-bold text-yellow-600">
              {goals2024.filter(g => {
                const progress = calculateProgress(g.current, g.target)
                return progress >= 60 && progress < 80
              }).length}
            </Text>
            <Text className="text-sm text-gray-600">At Risk</Text>
          </div>
          <div className="text-center">
            <Text className="text-2xl font-bold text-red-600">
              {goals2024.filter(g => calculateProgress(g.current, g.target) < 60).length}
            </Text>
            <Text className="text-sm text-gray-600">Behind</Text>
          </div>
          <div className="text-center">
            <Text className="text-2xl font-bold text-blue-600">
              {goals2024.filter(g => calculateProgress(g.current, g.target) >= 100).length}
            </Text>
            <Text className="text-sm text-gray-600">Achieved</Text>
          </div>
        </div>
      </div>
    </Card>
  )
}