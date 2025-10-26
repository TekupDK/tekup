'use client'

const RecentOrders = () => {
  const orders = [
    {
      id: '#ORD-001',
      table: 'Bord 7',
      items: ['Beef Burger', 'Fries', 'Cola'],
      total: '275 kr',
      status: 'preparing',
      time: '5 min siden'
    },
    {
      id: '#ORD-002',
      table: 'Takeaway',
      items: ['Margherita Pizza', 'Garlic Bread'],
      total: '185 kr',
      status: 'ready',
      time: '2 min siden'
    },
    {
      id: '#ORD-003',
      table: 'Bord 3',
      items: ['Pasta Carbonara', 'Wine'],
      total: '325 kr',
      status: 'delivered',
      time: '12 min siden'
    },
    {
      id: '#ORD-004',
      table: 'Bord 12',
      items: ['Fish & Chips', 'Beer'],
      total: '225 kr',
      status: 'new',
      time: '1 min siden'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-yellow-100 text-yellow-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          📋 Seneste Bestillinger
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{order.id}</span>
                  <span className="text-sm text-gray-500">{order.time}</span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{order.table}</span>
                  <span className="mx-2">•</span>
                  <span>{order.items.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{order.total}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Se alle bestillinger
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecentOrders