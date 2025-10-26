'use client'

import { useState } from 'react'

const StaffManagement = () => {
  const [selectedView, setSelectedView] = useState('overview')

  const staff = [
    {
      id: 1,
      name: 'Lars Nielsen',
      role: 'Chef',
      email: 'lars@restaurant.dk',
      phone: '+45 20 12 34 56',
      status: 'active',
      hireDate: '2023-01-15',
      salary: 45000,
      avatar: '👨‍🍳'
    },
    {
      id: 2,
      name: 'Anna Sørensen',
      role: 'Servitrice',
      email: 'anna@restaurant.dk',
      phone: '+45 30 87 65 43',
      status: 'active',
      hireDate: '2023-03-20',
      salary: 32000,
      avatar: '👩‍💼'
    },
    {
      id: 3,
      name: 'Michael Andersen',
      role: 'Køkkenassistent',
      email: 'michael@restaurant.dk',
      phone: '+45 40 98 76 54',
      status: 'active',
      hireDate: '2023-06-10',
      salary: 28000,
      avatar: '👨‍🍳'
    },
    {
      id: 4,
      name: 'Sarah Hansen',
      role: 'Manager',
      email: 'sarah@restaurant.dk',
      phone: '+45 50 11 22 33',
      status: 'active',
      hireDate: '2022-11-01',
      salary: 52000,
      avatar: '👩‍💼'
    },
    {
      id: 5,
      name: 'Peter Christensen',
      role: 'Bartender',
      email: 'peter@restaurant.dk',
      phone: '+45 60 44 55 66',
      status: 'vacation',
      hireDate: '2023-04-15',
      salary: 30000,
      avatar: '🍹'
    }
  ]

  const shifts = [
    {
      id: 1,
      employeeId: 1,
      name: 'Lars Nielsen',
      date: '2025-09-15',
      startTime: '10:00',
      endTime: '18:00',
      position: 'Chef',
      status: 'scheduled'
    },
    {
      id: 2,
      employeeId: 2,
      name: 'Anna Sørensen',
      date: '2025-09-15',
      startTime: '16:00',
      endTime: '24:00',
      position: 'Servitrice',
      status: 'in_progress'
    },
    {
      id: 3,
      employeeId: 3,
      name: 'Michael Andersen',
      date: '2025-09-15',
      startTime: '11:00',
      endTime: '19:00',
      position: 'Køkkenassistent',
      status: 'scheduled'
    },
    {
      id: 4,
      employeeId: 4,
      name: 'Sarah Hansen',
      date: '2025-09-15',
      startTime: '09:00',
      endTime: '17:00',
      position: 'Manager',
      status: 'completed'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'vacation': return 'bg-yellow-100 text-yellow-800'
      case 'sick': return 'bg-red-100 text-red-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv'
      case 'vacation': return 'På ferie'
      case 'sick': return 'Sygemeldt'
      case 'inactive': return 'Inaktiv'
      default: return status
    }
  }

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'absent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getShiftStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planlagt'
      case 'in_progress': return 'I gang'
      case 'completed': return 'Afsluttet'
      case 'absent': return 'Fraværende'
      default: return status
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👥 Medarbejdere</h1>
          <p className="text-gray-600 mt-2">Administrer medarbejdere og vagtplaner</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
          ➕ Tilføj Medarbejder
        </button>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            👥 Medarbejderoversigt
          </button>
          <button
            onClick={() => setSelectedView('schedule')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'schedule'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📅 Vagtplan
          </button>
        </div>
      </div>

      {selectedView === 'overview' && (
        <>
          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((employee) => (
              <div key={employee.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{employee.avatar}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                      {getStatusText(employee.status)}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{employee.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{employee.role}</p>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="w-4">📧</span>
                      <span className="ml-2">{employee.email}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4">📱</span>
                      <span className="ml-2">{employee.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4">📅</span>
                      <span className="ml-2">Ansat: {new Date(employee.hireDate).toLocaleDateString('da-DK')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-4">💰</span>
                      <span className="ml-2">{employee.salary.toLocaleString('da-DK')} kr/måned</span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm">
                      Rediger
                    </button>
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                      Vagtplan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Staff Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-gray-600">Total Medarbejdere</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-green-600">4</div>
              <div className="text-sm text-gray-600">Aktive</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <div className="text-sm text-gray-600">På ferie</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">187.000 kr</div>
              <div className="text-sm text-gray-600">Månedsløn total</div>
            </div>
          </div>
        </>
      )}

      {selectedView === 'schedule' && (
        <>
          {/* Today's Schedule */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">📅 Dagens Vagtplan - 15. September 2025</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {shifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {staff.find(s => s.id === shift.employeeId)?.avatar}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{shift.name}</h4>
                        <p className="text-sm text-gray-600">{shift.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {shift.startTime} - {shift.endTime}
                        </div>
                        <div className="text-xs text-gray-500">8 timer</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getShiftStatusColor(shift.status)}`}>
                        {getShiftStatusText(shift.status)}
                      </span>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                        Rediger
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Overview */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">📊 Uge Oversigt</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-7 gap-4">
                {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((day, index) => (
                  <div key={day} className="text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">{day}</h4>
                    <div className="space-y-1">
                      <div className="text-xs bg-blue-100 text-blue-800 p-1 rounded">
                        Lars: 10-18
                      </div>
                      <div className="text-xs bg-green-100 text-green-800 p-1 rounded">
                        Anna: 16-24
                      </div>
                      <div className="text-xs bg-yellow-100 text-yellow-800 p-1 rounded">
                        Michael: 11-19
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">32</div>
              <div className="text-sm text-gray-600">Timer i dag</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-green-600">184</div>
              <div className="text-sm text-gray-600">Timer denne uge</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <div className="text-sm text-gray-600">Overarbejdstimer</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">92%</div>
              <div className="text-sm text-gray-600">Fremmøde rate</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default StaffManagement