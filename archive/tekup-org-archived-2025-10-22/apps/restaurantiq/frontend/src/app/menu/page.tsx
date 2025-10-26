'use client'

import { useState } from 'react'
import Link from 'next/link'

const MenuManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'Alle', count: 28 },
    { id: 'appetizers', name: 'Forretter', count: 6 },
    { id: 'mains', name: 'Hovedretter', count: 12 },
    { id: 'desserts', name: 'Desserter', count: 5 },
    { id: 'drinks', name: 'Drikkevarer', count: 5 }
  ]

  const menuItems = [
    {
      id: 1,
      name: 'Klassisk Beef Burger',
      category: 'mains',
      price: 185,
      description: 'Saftig oksekødsburger med salat, tomat og hjemmelavet sauce',
      image: '🍔',
      available: true,
      ingredients: ['Oksekød', 'Salat', 'Tomat', 'Løg', 'Burger bolle']
    },
    {
      id: 2,
      name: 'Margherita Pizza',
      category: 'mains',
      price: 145,
      description: 'Traditionel pizza med tomatsauce, mozzarella og basilikum',
      image: '🍕',
      available: true,
      ingredients: ['Pizzadej', 'Tomatsauce', 'Mozzarella', 'Basilikum']
    },
    {
      id: 3,
      name: 'Caesar Salad',
      category: 'appetizers',
      price: 95,
      description: 'Frisk salat med kylling, parmesan og hjemmelavet dressing',
      image: '🥗',
      available: false,
      ingredients: ['Iceberg salat', 'Kylling', 'Parmesan', 'Caesar dressing']
    },
    {
      id: 4,
      name: 'Chocolate Brownie',
      category: 'desserts',
      price: 65,
      description: 'Varm chokoladebrownie med vaniljeis',
      image: '🍰',
      available: true,
      ingredients: ['Chokolade', 'Smør', 'Sukker', 'Æg', 'Mel', 'Vaniljeis']
    },
    {
      id: 5,
      name: 'Craft Beer',
      category: 'drinks',
      price: 45,
      description: 'Lokalt bryggeri øl - roterende udvalg',
      image: '🍺',
      available: true,
      ingredients: ['Øl']
    }
  ]

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🍽️ Menu Administration</h1>
          <p className="text-gray-600 mt-2">Administrer dit menukort og priser</p>
        </div>
        <Link
          href="/menu/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          ➕ Tilføj Menu Item
        </Link>
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

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">{item.image}</div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.available ? 'Tilgængelig' : 'Ikke tilgængelig'}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredienser:</h4>
                <div className="flex flex-wrap gap-1">
                  {item.ingredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">{item.price} kr</span>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                    Rediger
                  </button>
                  <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm">
                    Slet
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Menu Statistik</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">28</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">25</div>
            <div className="text-sm text-gray-600">Tilgængelige</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">3</div>
            <div className="text-sm text-gray-600">Ikke tilgængelige</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">142 kr</div>
            <div className="text-sm text-gray-600">Gennemsnitspris</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuManagement