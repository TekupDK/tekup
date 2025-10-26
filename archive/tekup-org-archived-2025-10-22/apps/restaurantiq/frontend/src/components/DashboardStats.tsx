'use client'

const DashboardStats = () => {
  const stats = [
    {
      title: 'Dagens Salg',
      value: '12.450 kr',
      change: '+8.2%',
      changeType: 'positive',
      icon: '💰'
    },
    {
      title: 'Aktive Bestillinger',
      value: '24',
      change: '+3',
      changeType: 'positive',
      icon: '📋'
    },
    {
      title: 'Gennemsnitlig Ordre',
      value: '285 kr',
      change: '+5.1%',
      changeType: 'positive',
      icon: '🧾'
    },
    {
      title: 'Lagerstatus',
      value: '89%',
      change: '-2%',
      changeType: 'negative',
      icon: '📦'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stat.value}
              </p>
            </div>
            <div className="text-3xl">
              {stat.icon}
            </div>
          </div>
          <div className="mt-4">
            <span
              className={`inline-flex items-center text-sm font-semibold ${
                stat.changeType === 'positive'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {stat.changeType === 'positive' ? '↗' : '↘'} {stat.change}
            </span>
            <span className="text-sm text-gray-500 ml-2">fra i går</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DashboardStats