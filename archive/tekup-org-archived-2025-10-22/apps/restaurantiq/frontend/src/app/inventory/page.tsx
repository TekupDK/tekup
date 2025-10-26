'use client'

import { useState } from 'react'

const InventoryManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'Alle', count: 45 },
    { id: 'meat', name: 'Kød', count: 8 },
    { id: 'vegetables', name: 'Grøntsager', count: 12 },
    { id: 'dairy', name: 'Mejeri', count: 6 },
    { id: 'pantry', name: 'Tørvarer', count: 10 },
    { id: 'beverages', name: 'Drikkevarer', count: 9 }
  ]

  const inventoryItems = [
    {
      id: 1,
      name: 'Oksekød (hakket)',
      category: 'meat',
      currentStock: 5.2,
      unit: 'kg',
      minStock: 10,
      maxStock: 50,
      costPerUnit: 125,
      supplier: 'Danish Crown',
      expiryDate: '2025-09-18',
      lastRestocked: '2025-09-12',
      status: 'low'
    },
    {
      id: 2,
      name: 'Mozzarella Ost',
      category: 'dairy',
      currentStock: 12,
      unit: 'stk',
      minStock: 5,
      maxStock: 25,
      costPerUnit: 45,
      supplier: 'Arla Foods',
      expiryDate: '2025-09-20',
      lastRestocked: '2025-09-10',
      status: 'ok'
    },
    {
      id: 3,
      name: 'Tomater (cherry)',
      category: 'vegetables',
      currentStock: 2.1,
      unit: 'kg',
      minStock: 5,
      maxStock: 20,
      costPerUnit: 35,
      supplier: 'Grønt Danmark',
      expiryDate: '2025-09-17',
      lastRestocked: '2025-09-14',
      status: 'critical'
    },
    {
      id: 4,
      name: 'Øl (Carlsberg)',
      category: 'beverages',
      currentStock: 48,
      unit: 'stk',
      minStock: 24,
      maxStock: 120,
      costPerUnit: 15,
      supplier: 'Carlsberg Group',
      expiryDate: '2025-12-01',
      lastRestocked: '2025-09-13',
      status: 'ok'
    },
    {
      id: 5,
      name: 'Pasta (Penne)',
      category: 'pantry',
      currentStock: 8.5,
      unit: 'kg',
      minStock: 5,
      maxStock: 30,
      costPerUnit: 25,
      supplier: 'Barilla',
      expiryDate: '2026-03-15',
      lastRestocked: '2025-09-01',
      status: 'ok'
    }
  ]

  const filteredItems = selectedCategory === 'all' 
    ? inventoryItems 
    : inventoryItems.filter(item => item.category === selectedCategory)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ok': return 'bg-green-100 text-green-800 border-green-200'
      case 'overstocked': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Kritisk Lav'
      case 'low': return 'Lav Beholdning'
      case 'ok': return 'OK'
      case 'overstocked': return 'Overfyldt'
      default: return status
    }
  }

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Lagerstyring</h1>
          <p className="text-gray-600 mt-2">Administrer ingredienser og beholdning</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            ➕ Tilføj Vare
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            📋 Generer Indkøbsliste
          </button>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-semibold">Kritisk lav beholdning</h3>
              <p className="text-red-700 text-sm">1 vare skal genbestilles øjeblikkeligt</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">📉</div>
            <div>
              <h3 className="text-yellow-800 font-semibold">Lav beholdning</h3>
              <p className="text-yellow-700 text-sm">2 varer nærmer sig minimum beholdning</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Kategorier</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Lagerbeholdning</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beholdning
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leverandør
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Udløber
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.costPerUnit} kr/{item.unit}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            item.status === 'critical' ? 'bg-red-500' :
                            item.status === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Min: {item.minStock} • Max: {item.maxStock}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.expiryDate).toLocaleDateString('da-DK')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">Rediger</button>
                    <button className="text-green-600 hover:text-green-900">Genbestil</button>
                    <button className="text-gray-600 hover:text-gray-900">Historik</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Lagerværdi</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total værdi:</span>
              <span className="font-semibold">125.450 kr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Månedlig forbrug:</span>
              <span className="font-semibold">89.200 kr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Omsætningshastighed:</span>
              <span className="font-semibold">1.4 måneder</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">⚠️ Beholdningsalerts</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-red-600">Kritisk lav:</span>
              <span className="font-semibold text-red-600">1 vare</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">Lav beholdning:</span>
              <span className="font-semibold text-yellow-600">2 varer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">OK status:</span>
              <span className="font-semibold text-green-600">42 varer</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📅 Udløbsdatoer</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-red-600">Udløber i dag:</span>
              <span className="font-semibold text-red-600">0 varer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">Udløber i uge:</span>
              <span className="font-semibold text-yellow-600">3 varer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">God holdbarhed:</span>
              <span className="font-semibold text-green-600">42 varer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryManagement