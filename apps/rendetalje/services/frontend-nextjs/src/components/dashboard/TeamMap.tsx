'use client'

import { useState, useEffect } from 'react'
import { MapPin, Users, Clock, AlertCircle } from 'lucide-react'
import { TeamLocation } from '@/types'
import { formatDate } from '@/lib/utils'

interface TeamMapProps {
  locations: TeamLocation[]
  loading?: boolean
}

export function TeamMap({ locations, loading = false }: TeamMapProps) {
  const [selectedMember, setSelectedMember] = useState<TeamLocation | null>(null)

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Team Lokationer</h3>
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500'
      case 'busy':
        return 'bg-blue-500'
      case 'break':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Tilgængelig'
      case 'busy':
        return 'Optaget'
      case 'break':
        return 'Pause'
      case 'offline':
        return 'Offline'
      default:
        return status
    }
  }

  const statusCounts = locations.reduce((acc, location) => {
    acc[location.status] = (acc[location.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Team Lokationer</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{locations.length} medarbejdere</span>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
            <span className="text-sm text-gray-600">
              {getStatusText(status)}: {count}
            </span>
          </div>
        ))}
      </div>

      {/* Map Placeholder - In a real implementation, this would be Google Maps or similar */}
      <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Kort integration kommer snart</p>
            <p className="text-sm text-gray-400">Google Maps integration</p>
          </div>
        </div>

        {/* Team Member Markers */}
        {locations.map((location, index) => (
          <div
            key={location.team_member_id}
            className="absolute"
            style={{
              left: `${20 + (index % 5) * 15}%`,
              top: `${30 + Math.floor(index / 5) * 20}%`,
            }}
          >
            <button
              onClick={() => setSelectedMember(location)}
              className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${getStatusColor(
                location.status
              )} hover:scale-110 transition-transform`}
              title={location.team_member_name}
            />
          </div>
        ))}
      </div>

      {/* Team Member List */}
      <div className="mt-6 space-y-3">
        <h4 className="font-medium text-gray-900">Aktive Medarbejdere</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {locations.map((location) => (
            <div
              key={location.team_member_id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => setSelectedMember(location)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(location.status)}`}></div>
                <div>
                  <p className="font-medium text-gray-900">{location.team_member_name}</p>
                  {location.current_job && (
                    <p className="text-sm text-gray-600">Job: {location.current_job}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {getStatusText(location.status)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(location.updated_at, 'time')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Member Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedMember.team_member_name}</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedMember.status)}`}></div>
                <span className="font-medium">{getStatusText(selectedMember.status)}</span>
              </div>
              {selectedMember.current_job && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Nuværende job: {selectedMember.current_job}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>
                  Position: {selectedMember.latitude.toFixed(4)}, {selectedMember.longitude.toFixed(4)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Sidst opdateret: {formatDate(selectedMember.updated_at, 'long')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}