'use client'

import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { MapPinIcon, ClockIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { leadAPI, type Lead } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { da } from 'date-fns/locale'

interface RecentLeadsProps {
  tenant: string
}

// Fallback function for demo data (kept for non-test-tenant cases)
const getRecentLeadsData = (tenant: string) => {
  if (tenant === 'rendetalje') {
    return [
      {
        id: '1245',
        name: 'Anna Larsen',
        email: 'anna@email.dk',
        phone: '+45 23 45 67 89',
        type: 'Flytterengøring',
        location: '8000 Aarhus C',
        sqm: 95,
        qualification: 'hot',
        score: 89,
        source: 'leadpoint',
        timeAgo: '12 min',
        status: 'new',
        nextAction: 'immediate_contact'
      },
      {
        id: '1244',
        name: 'Michael Nielsen',
        email: 'michael.n@hotmail.com',
        phone: '+45 87 65 43 21',
        type: 'Erhvervsrengøring',
        location: '8200 Aarhus N',
        sqm: 240,
        qualification: 'warm',
        score: 74,
        source: '3match',
        timeAgo: '1t 23min',
        status: 'contacted',
        nextAction: 'follow_up_scheduled'
      },
      {
        id: '1243',
        name: 'Sophia Hansen',
        email: 'sophia@gmail.com',
        phone: '+45 12 34 56 78',
        type: 'Almindelig rengøring',
        location: '8210 Aarhus V',
        sqm: 67,
        qualification: 'cold',
        score: 52,
        source: 'website',
        timeAgo: '2t 45min',
        status: 'qualified',
        nextAction: 'schedule_follow_up'
      },
      {
        id: '1242',
        name: 'Lars Pedersen',
        email: 'lars.p@company.dk',
        phone: '+45 98 76 54 32',
        type: 'Vinduespudsning',
        location: '8220 Brabrand',
        sqm: 120,
        qualification: 'warm',
        score: 68,
        source: 'leadpoint',
        timeAgo: '3t 12min',
        status: 'response_sent',
        nextAction: 'awaiting_customer_response'
      },
      {
        id: '1241',
        name: 'Emma Christensen',
        email: 'emma@email.dk',
        phone: '+45 56 78 90 12',
        type: 'Flytterengøring',
        location: '8000 Aarhus C',
        sqm: 78,
        qualification: 'hot',
        score: 91,
        source: 'phone',
        timeAgo: '4t 55min',
        status: 'converted',
        nextAction: 'booking_confirmed'
      }
    ]
  }
  
  return [
    {
      id: '2001',
      name: 'John Doe',
      email: 'john@company.com',
      type: 'Enterprise Lead',
      qualification: 'warm',
      score: 72,
      source: 'website',
      timeAgo: '30 min',
      status: 'new'
    }
  ]
}

export default function RecentLeads({ tenant }: RecentLeadsProps) {
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeads = async () => {
      if (tenant === 'test-tenant') {
        setLoading(true)
        setError(null)
        
        const response = await leadAPI.listLeads(tenant, { limit: 5 })
        
        if (response.error) {
          setError(response.error)
          setLeads([])
        } else if (response.data) {
          setLeads(response.data.leads)
        }
        
        setLoading(false)
      } else {
        // Use demo data for other tenants
        const demoLeads = getRecentLeadsData(tenant).map(lead => ({
          ...lead,
          customData: {},
          tenantId: tenant,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })) as Lead[]
        setLeads(demoLeads)
        setLoading(false)
      }
    }
    
    fetchLeads()
  }, [tenant])

  // Map lead scores to qualification levels for filtering
  const getQualificationFromScore = (score?: number) => {
    if (!score) return 'cold'
    if (score >= 80) return 'hot'
    if (score >= 60) return 'warm'
    return 'cold'
  }

  const filteredLeads = filter === 'all' 
    ? leads 
    : leads.filter(lead => getQualificationFromScore(lead.score) === filter)

  const getQualificationColor = (qualification: string) => {
    switch (qualification) {
      case 'hot': return 'bg-red-100 text-red-800'
      case 'warm': return 'bg-yellow-100 text-yellow-800'
      case 'cold': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'contacted': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'qualified': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'response_sent': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'converted': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Seneste Leads</h3>
          
          {/* Filter buttons */}
          <div className="flex space-x-1">
            {['all', 'hot', 'warm', 'cold'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as any)}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  filter === filterOption
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                )}
              >
                {filterOption === 'all' ? 'Alle' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-gray-500">
            Loading leads...
          </div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500">
            Error: {error}
          </div>
        )}
        {!loading && !error && filteredLeads.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No leads found
          </div>
        )}
        {!loading && !error && filteredLeads.map((lead) => (
          <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {lead.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{lead.name}</h4>
                  <p className="text-xs text-gray-500">#{lead.id}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getQualificationColor(getQualificationFromScore(lead.score))
                )}>
                  {getQualificationFromScore(lead.score)} ({lead.score || 0})
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-gray-600 mb-3">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <EnvelopeIcon className="h-3 w-3 mr-1" />
                  {lead.email}
                </span>
                {lead.phone && (
                  <span className="flex items-center">
                    <PhoneIcon className="h-3 w-3 mr-1" />
                    {lead.phone}
                  </span>
                )}
              </div>
              
              {lead.company && (
                <div className="flex items-center space-x-4">
                  <span>{lead.company}</span>
                </div>
              )}
              {tenant === 'rendetalje' && (
                <div className="flex items-center space-x-4">
                  <span>{(lead as any).type}</span>
                  {(lead as any).location && (
                    <span className="flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {(lead as any).location}
                    </span>
                  )}
                  {(lead as any).sqm && <span>{(lead as any).sqm} m²</span>}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={clsx(
                  'inline-flex items-center px-2 py-1 rounded text-xs font-medium border',
                  getStatusColor(lead.status || 'new')
                )}>
                  {lead.status?.replace('_', ' ') || 'new'}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {lead.source}
                </span>
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <ClockIcon className="h-3 w-3 mr-1" />
                {tenant === 'test-tenant' 
                  ? formatDistanceToNow(new Date(lead.createdAt), { 
                      addSuffix: true, 
                      locale: da 
                    })
                  : (lead as any).timeAgo
                }
              </div>
            </div>

            {tenant === 'rendetalje' && (lead as any).nextAction && (
              <div className="mt-2 text-xs text-gray-600">
                <strong>Næste handling:</strong> {(lead as any).nextAction.replace('_', ' ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Se alle leads →
        </button>
      </div>
    </div>
  )
}
