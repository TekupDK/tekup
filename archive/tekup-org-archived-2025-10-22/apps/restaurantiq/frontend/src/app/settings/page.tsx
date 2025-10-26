'use client'

import { useState } from 'react'

const SettingsManagement = () => {
  const [selectedTab, setSelectedTab] = useState('restaurant')

  const tabs = [
    { id: 'restaurant', name: 'Restaurant Info', icon: '🏪' },
    { id: 'payment', name: 'Betalinger', icon: '💳' },
    { id: 'integrations', name: 'Integrationer', icon: '🔗' },
    { id: 'notifications', name: 'Notifikationer', icon: '🔔' },
    { id: 'users', name: 'Brugere', icon: '👤' },
    { id: 'system', name: 'System', icon: '⚙️' }
  ]

  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Bella Vista Restaurant',
    address: 'Strøget 12, 1160 København K',
    phone: '+45 33 12 34 56',
    email: 'kontakt@bellavista.dk',
    website: 'www.bellavista.dk',
    openingHours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '23:00', closed: false },
      friday: { open: '11:00', close: '24:00', closed: false },
      saturday: { open: '10:00', close: '24:00', closed: false },
      sunday: { open: '12:00', close: '21:00', closed: false }
    }
  })

  const paymentMethods = [
    { id: 'mobilepay', name: 'MobilePay', enabled: true, fee: '1.5%' },
    { id: 'dankort', name: 'Dankort', enabled: true, fee: '0.5%' },
    { id: 'visa', name: 'Visa/Mastercard', enabled: true, fee: '1.2%' },
    { id: 'cash', name: 'Kontant', enabled: true, fee: '0%' },
    { id: 'apple_pay', name: 'Apple Pay', enabled: false, fee: '1.0%' },
    { id: 'google_pay', name: 'Google Pay', enabled: false, fee: '1.0%' }
  ]

  const integrations = [
    { id: 'just_eat', name: 'Just Eat', status: 'connected', lastSync: '2025-09-15 14:30' },
    { id: 'wolt', name: 'Wolt', status: 'connected', lastSync: '2025-09-15 14:25' },
    { id: 'foodora', name: 'Foodora', status: 'disconnected', lastSync: null },
    { id: 'uber_eats', name: 'Uber Eats', status: 'pending', lastSync: null },
    { id: 'economic', name: 'e-conomic', status: 'connected', lastSync: '2025-09-15 12:00' },
    { id: 'billy', name: 'Billy', status: 'disconnected', lastSync: null }
  ]

  const users = [
    { id: 1, name: 'Sarah Hansen', email: 'sarah@restaurant.dk', role: 'admin', lastLogin: '2025-09-15 14:30' },
    { id: 2, name: 'Lars Nielsen', email: 'lars@restaurant.dk', role: 'manager', lastLogin: '2025-09-15 12:15' },
    { id: 3, name: 'Anna Sørensen', email: 'anna@restaurant.dk', role: 'staff', lastLogin: '2025-09-14 22:45' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Indstillinger</h1>
        <p className="text-gray-600 mt-2">Konfigurer din restaurant og systemindstillinger</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'restaurant' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">🏪 Restaurant Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Navn</label>
                  <input
                    type="text"
                    value={restaurantInfo.name}
                    onChange={(e) => setRestaurantInfo({...restaurantInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="text"
                    value={restaurantInfo.phone}
                    onChange={(e) => setRestaurantInfo({...restaurantInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={restaurantInfo.address}
                    onChange={(e) => setRestaurantInfo({...restaurantInfo, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={restaurantInfo.email}
                    onChange={(e) => setRestaurantInfo({...restaurantInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hjemmeside</label>
                  <input
                    type="url"
                    value={restaurantInfo.website}
                    onChange={(e) => setRestaurantInfo({...restaurantInfo, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-4">🕐 Åbningstider</h4>
                <div className="space-y-3">
                  {Object.entries(restaurantInfo.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-20 text-sm font-medium capitalize">{day}:</div>
                      <input
                        type="time"
                        value={hours.open}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={hours.close}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                      <label className="flex items-center">
                        <input type="checkbox" checked={hours.closed} className="mr-2" />
                        <span className="text-sm">Lukket</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'payment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">💳 Betalingsmetoder</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{method.name}</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={method.enabled} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-gray-600">Gebyr: {method.fee}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">🔗 Integrationer</h3>
              
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-sm text-gray-600">
                          {integration.status === 'connected' && integration.lastSync && (
                            <>Sidste sync: {integration.lastSync}</>
                          )}
                          {integration.status === 'disconnected' && 'Ikke forbundet'}
                          {integration.status === 'pending' && 'Venter på godkendelse'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          integration.status === 'connected' ? 'bg-green-100 text-green-800' :
                          integration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {integration.status === 'connected' ? 'Forbundet' :
                           integration.status === 'pending' ? 'Afventer' : 'Afbrudt'}
                        </span>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                          {integration.status === 'connected' ? 'Konfigurer' : 'Forbind'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">👤 Brugere</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  ➕ Tilføj Bruger
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Navn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sidste Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">Rediger</button>
                          <button className="text-red-600 hover:text-red-900">Slet</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">⚙️ System Indstillinger</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-3">🛡️ Sikkerhed</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" checked={true} className="mr-3" />
                      <span className="text-sm">Kræv to-faktor autentificering</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={false} className="mr-3" />
                      <span className="text-sm">Automatisk logout efter inaktivitet</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={true} className="mr-3" />
                      <span className="text-sm">Log alle brugeraktiviteter</span>
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium mb-3">📊 Data & Backup</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" checked={true} className="mr-3" />
                      <span className="text-sm">Daglig automatisk backup</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={true} className="mr-3" />
                      <span className="text-sm">Opbevar backup i 30 dage</span>
                    </label>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Download backup nu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Annuller
        </button>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Gem Ændringer
        </button>
      </div>
    </div>
  )
}

export default SettingsManagement