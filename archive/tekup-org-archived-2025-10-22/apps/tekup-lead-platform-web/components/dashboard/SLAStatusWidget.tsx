'use client'

import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface SLAStatusWidgetProps {
  tenant: string
}

const getSLAData = (tenant: string) => {
  if (tenant === 'rendetalje') {
    return {
      breached: 2,
      atRisk: 5,
      onTrack: 16,
      averageResponseTime: 2.3,
      targetResponseTime: 4.0,
      items: [
        {
          id: '1234',
          customer: 'Maria Hansen',
          type: 'Flytterengøring',
          status: 'breached',
          hoursOverdue: 4.2,
          urgency: 'high'
        },
        {
          id: '1235', 
          customer: 'Jens Nielsen',
          type: 'Erhvervsrengøring',
          status: 'breached',
          hoursOverdue: 1.8,
          urgency: 'medium'
        },
        {
          id: '1236',
          customer: 'Søren Madsen',
          type: 'Almindelig rengøring',
          status: 'at_risk',
          hoursRemaining: 0.5,
          urgency: 'medium'
        },
        {
          id: '1237',
          customer: 'Lone Christensen', 
          type: 'Flytterengøring',
          status: 'at_risk',
          hoursRemaining: 1.2,
          urgency: 'high'
        },
        {
          id: '1238',
          customer: 'Thomas Larsen',
          type: 'Vinduespudsning',
          status: 'at_risk',
          hoursRemaining: 2.1,
          urgency: 'low'
        }
      ]
    }
  }
  
  return {
    breached: 1,
    atRisk: 3,
    onTrack: 12,
    averageResponseTime: 3.8,
    targetResponseTime: 6.0,
    items: []
  }
}

export default function SLAStatusWidget({ tenant }: SLAStatusWidgetProps) {
  const slaData = getSLAData(tenant)
  const total = slaData.breached + slaData.atRisk + slaData.onTrack

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">SLA Status</h3>
        <div className="flex items-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          {slaData.averageResponseTime}h avg
        </div>
      </div>

      {/* SLA Overview */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-gray-900">Overtrådt</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-red-600">{slaData.breached}</span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${(slaData.breached / total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-900">I risiko</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-yellow-600">{slaData.atRisk}</span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(slaData.atRisk / total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-900">På sporet</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-green-600">{slaData.onTrack}</span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(slaData.onTrack / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Critical Items */}
      {slaData.items.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Kræver handling</h4>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {slaData.items.map((item) => (
              <div key={item.id} className={clsx(
                'p-3 rounded-lg border-l-4',
                item.status === 'breached' 
                  ? 'bg-red-50 border-red-400' 
                  : 'bg-yellow-50 border-yellow-400'
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    #{item.id}
                  </span>
                  <span className={clsx(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    item.urgency === 'high' ? 'bg-red-100 text-red-800' :
                    item.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  )}>
                    {item.urgency}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {item.customer} • {item.type}
                </div>
                <div className="text-xs mt-1">
                  {item.status === 'breached' ? (
                    <span className="text-red-600 font-medium">
                      {item.hoursOverdue}h forsinket
                    </span>
                  ) : (
                    <span className="text-yellow-600 font-medium">
                      {item.hoursRemaining}h tilbage
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target vs Actual */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Mål responstid:</span>
          <span className="font-medium text-gray-900">{slaData.targetResponseTime}h</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Faktisk gennemsnit:</span>
          <span className={clsx(
            'font-medium',
            slaData.averageResponseTime <= slaData.targetResponseTime 
              ? 'text-green-600' 
              : 'text-red-600'
          )}>
            {slaData.averageResponseTime}h
          </span>
        </div>
      </div>
    </div>
  )
}
