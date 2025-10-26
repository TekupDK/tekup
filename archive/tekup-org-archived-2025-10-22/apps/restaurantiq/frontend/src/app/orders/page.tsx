'use client'

import { useState } from 'react'

const OrdersManagement = () => {
  const [selectedStatus, setSelectedStatus] = useState('all')

  const statusOptions = [
    { id: 'all', name: 'Alle', count: 24 },
    { id: 'new', name: 'Nye', count: 4 },
    { id: 'preparing', name: 'Forberedes', count: 8 },
    { id: 'ready', name: 'Klar', count: 6 },
    { id: 'delivered', name: 'Leveret', count: 6 }
  ]

  const orders = [
    {
      id: '#ORD-001',
      table: 'Bord 7',
      customer: 'Lars Nielsen',
      items: [
        { name: 'Beef Burger', quantity: 1, price: 185 },
        { name: 'Pommes Frites', quantity: 1, price: 45 },
        { name: 'Cola', quantity: 1, price: 25 }
      ],
      total: 255,
      status: 'preparing',
      orderTime: '14:25',
      notes: 'Uden løg på burgeren'
    },
    {
      id: '#ORD-002',
      table: 'Takeaway',
      customer: 'Anna Sørensen',
      items: [
        { name: 'Margherita Pizza', quantity: 1, price: 145 },
        { name: 'Hvidløgsbrød', quantity: 1, price: 35 }
      ],
      total: 180,
      status: 'ready',
      orderTime: '14:18',
      notes: ''
    },
    {
      id: '#ORD-003',
      table: 'Bord 3',
      customer: 'Michael Andersen',
      items: [
        { name: 'Pasta Carbonara', quantity: 1, price: 165 },
        { name: 'Hvidvin', quantity: 1, price: 85 }
      ],
      total: 250,
      status: 'delivered',
      orderTime: '14:05',
      notes: 'Glutenfri pasta'
    },
    {
      id: '#ORD-004',
      table: 'Bord 12',
      customer: 'Sarah Hansen',
      items: [
        { name: 'Fish & Chips', quantity: 1, price: 195 },
        { name: 'Øl', quantity: 1, price: 45 }
      ],
      total: 240,
      status: 'new',
      orderTime: '14:28',
      notes: ''
    }
  ]

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Ny'
      case 'preparing': return 'Forberedes'
      case 'ready': return 'Klar'
      case 'delivered': return 'Leveret'
      default: return status
    }
  }

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    // Implementer API kald her
    console.log(`Updating order ${orderId} to status ${newStatus}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Bestillinger</h1>
          <p className="text-gray-600 mt-2">Administrer og spor alle bestillinger</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
          ➕ Ny Bestilling
        </button>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filter efter status</h3>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status.id}
              onClick={() => setSelectedStatus(status.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === status.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.name} ({status.count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border">
            <div className="p-6">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{order.id}</h3>
                  <p className="text-sm text-gray-600">{order.table} • {order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{order.orderTime}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Bestilte varer:</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">{item.price} kr</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> {order.notes}
                  </p>
                </div>
              )}

              {/* Total and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">
                  Total: {order.total} kr
                </span>
                <div className="flex space-x-2">
                  {order.status === 'new' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                    >
                      Start Forberedelse
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      Marker Klar
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Lever
                    </button>
                  )}
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                    Detaljer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Dagens Statistik</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">24</div>
            <div className="text-sm text-gray-600">Total Bestillinger</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">8</div>
            <div className="text-sm text-gray-600">Forberedes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">6</div>
            <div className="text-sm text-gray-600">Klar til Levering</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">6</div>
            <div className="text-sm text-gray-600">Leveret</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">5.925 kr</div>
            <div className="text-sm text-gray-600">Total Salg</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrdersManagement