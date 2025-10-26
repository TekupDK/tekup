'use client';

import { useEffect, useState } from 'react';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState('checking...');

  useEffect(() => {
    // Test API connection
    fetch(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') + '/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.message || 'API Connected'))
      .catch(() => setApiStatus('API Connection Failed'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🧹 Rendetalje OS
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Professionel Rengøringsstyring - Dansk Edition
          </p>
          <p className="text-sm text-gray-500">
            API Status: {apiStatus}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">📋 Opgaver</h3>
            <p className="text-3xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-500">Aktive i dag</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">👥 Medarbejdere</h3>
            <p className="text-3xl font-bold text-green-600">8</p>
            <p className="text-sm text-gray-500">På arbejde</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">💰 Omsætning</h3>
            <p className="text-3xl font-bold text-indigo-600">125k</p>
            <p className="text-sm text-gray-500">DKK denne måned</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">⭐ Rating</h3>
            <p className="text-3xl font-bold text-yellow-600">4.8</p>
            <p className="text-sm text-gray-500">Gennemsnit</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📅 Planlægning</h2>
            <p className="text-gray-600 mb-4">AI-optimeret rute og opgaveplanlægning</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Åbn Planlægning
            </button>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Dashboard</h2>
            <p className="text-gray-600 mb-4">Realtids overblik over alle opgaver</p>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Se Dashboard
            </button>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚙️ Indstillinger</h2>
            <p className="text-gray-600 mb-4">Konfigurer system og medarbejdere</p>
            <button className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">
              Åbn Indstillinger
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Rendetalje OS - Bygget med ❤️ i Danmark</p>
          <p className="text-sm">Backend API: http://localhost:3006 | Frontend: http://localhost:3051</p>
        </div>
      </div>
    </div>
  );
}
