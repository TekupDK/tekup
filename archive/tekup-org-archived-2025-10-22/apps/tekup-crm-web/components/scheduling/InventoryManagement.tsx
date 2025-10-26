'use client';

import React, { useState, useMemo } from 'react';

// Simple SVG icon components
const CubeIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ExclamationTriangleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const PlusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const TruckIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShoppingCartIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
  </svg>
);

// Inventory interfaces
interface InventoryItem {
  id: string;
  name: string;
  category: 'chemicals' | 'equipment' | 'supplies' | 'uniforms';
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  lastRestocked: Date;
  expiryDate?: Date;
  location: string;
  description: string;
  barcode?: string;
}

interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  employeeId: string;
  timestamp: Date;
  jobId?: string;
  notes?: string;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  items: { itemId: string; quantity: number; unitCost: number }[];
  totalCost: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  orderDate: Date;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
}

// Mock data for inventory
const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv-001',
    name: 'Universalrengøringsmiddel',
    category: 'chemicals',
    currentStock: 25,
    minStock: 10,
    maxStock: 50,
    unit: 'liter',
    costPerUnit: 45.50,
    supplier: 'CleanChem Danmark A/S',
    lastRestocked: new Date('2024-08-15'),
    expiryDate: new Date('2025-08-15'),
    location: 'Lager A - Hylde 1',
    description: 'Miljøvenligt universalrengøringsmiddel til alle overflader'
  },
  {
    id: 'inv-002',
    name: 'Mikrofiberklud (gul)',
    category: 'supplies',
    currentStock: 180,
    minStock: 50,
    maxStock: 300,
    unit: 'stk',
    costPerUnit: 12.75,
    supplier: 'ProClean Udstyr ApS',
    lastRestocked: new Date('2024-09-01'),
    location: 'Lager B - Skab 2',
    description: 'Gule mikrofiber klude til badeværelse og køkken'
  },
  {
    id: 'inv-003',
    name: 'Støvsuger (HEPA filter)',
    category: 'equipment',
    currentStock: 8,
    minStock: 5,
    maxStock: 12,
    unit: 'stk',
    costPerUnit: 2850.00,
    supplier: 'Industrial Vacuum Danmark',
    lastRestocked: new Date('2024-07-20'),
    location: 'Udstyrslager - Zone C',
    description: 'Professionel støvsuger med HEPA filter til allergivenlige miljøer'
  },
  {
    id: 'inv-004',
    name: 'Desinfektionsmiddel (alkoholbaseret)',
    category: 'chemicals',
    currentStock: 5,
    minStock: 15,
    maxStock: 40,
    unit: 'liter',
    costPerUnit: 78.90,
    supplier: 'MediClean Solutions',
    lastRestocked: new Date('2024-08-01'),
    expiryDate: new Date('2025-02-01'),
    location: 'Lager A - Sikkerhedsskab',
    description: 'Hospitalskvalitet desinfektionsmiddel til kritiske områder'
  },
  {
    id: 'inv-005',
    name: 'Arbejdsuniform (polo + bukser)',
    category: 'uniforms',
    currentStock: 22,
    minStock: 15,
    maxStock: 40,
    unit: 'sæt',
    costPerUnit: 285.00,
    supplier: 'Workwear Nordic A/S',
    lastRestocked: new Date('2024-08-25'),
    location: 'Personalelager',
    description: 'Komplet uniformssæt med firmalogo og refleksstriber'
  },
  {
    id: 'inv-006',
    name: 'Gulvmoppe (industriel)',
    category: 'equipment',
    currentStock: 12,
    minStock: 8,
    maxStock: 20,
    unit: 'stk',
    costPerUnit: 145.50,
    supplier: 'ProClean Udstyr ApS',
    lastRestocked: new Date('2024-09-05'),
    location: 'Udstyrslager - Zone A',
    description: 'Udskiftelige mopper til store gulvarealer'
  },
  {
    id: 'inv-007',
    name: 'Vinduespudsemiddel',
    category: 'chemicals',
    currentStock: 18,
    minStock: 12,
    maxStock: 30,
    unit: 'liter',
    costPerUnit: 32.25,
    supplier: 'CleanChem Danmark A/S',
    lastRestocked: new Date('2024-09-10'),
    expiryDate: new Date('2026-09-10'),
    location: 'Lager A - Hylde 3',
    description: 'Specialmiddel til stribelefri vinduespudsning'
  },
  {
    id: 'inv-008',
    name: 'Handsker (nitril, engangs)',
    category: 'supplies',
    currentStock: 4,
    minStock: 10,
    maxStock: 50,
    unit: 'kasse (100 stk)',
    costPerUnit: 89.00,
    supplier: 'Safety First Danmark',
    lastRestocked: new Date('2024-08-05'),
    location: 'Lager B - Hylde 1',
    description: 'Puderfri nitrilhandsker til beskyttelse mod kemikalier'
  }
];

const mockStockMovements: StockMovement[] = [
  {
    id: 'mov-001',
    itemId: 'inv-001',
    type: 'out',
    quantity: 3,
    reason: 'Brugt til job',
    employeeId: 'emp-001',
    timestamp: new Date('2024-09-15'),
    jobId: 'job-123',
    notes: 'Kontorrengøring hos Danske Bank'
  },
  {
    id: 'mov-002',
    itemId: 'inv-004',
    type: 'out',
    quantity: 1,
    reason: 'Brugt til job',
    employeeId: 'emp-002',
    timestamp: new Date('2024-09-14'),
    jobId: 'job-124',
    notes: 'Hospitalsrengøring - intensiv afdeling'
  },
  {
    id: 'mov-003',
    itemId: 'inv-002',
    type: 'in',
    quantity: 50,
    reason: 'Indkøb',
    employeeId: 'admin-001',
    timestamp: new Date('2024-09-01'),
    notes: 'Månedlig genopfyldning'
  }
];

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventoryItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAddItem, setShowAddItem] = useState<boolean>(false);
  const [stockMovements] = useState<StockMovement[]>(mockStockMovements);

  // Filter inventory based on category, low stock, and search
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const lowStockMatch = !showLowStock || item.currentStock <= item.minStock;
      const searchMatch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return categoryMatch && lowStockMatch && searchMatch;
    });
  }, [inventory, selectedCategory, showLowStock, searchTerm]);

  // Calculate statistics
  const inventoryStats = useMemo(() => {
    const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
    const expiringItems = inventory.filter(item => 
      item.expiryDate && 
      item.expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
    );

    return {
      totalItems: inventory.length,
      lowStockCount: lowStockItems.length,
      totalValue,
      expiringCount: expiringItems.length
    };
  }, [inventory]);

  const handleStockAdjustment = (itemId: string, adjustment: number, reason: string) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, currentStock: Math.max(0, item.currentStock + adjustment) }
        : item
    ));

    // In a real app, you'd also create a stock movement record
    console.log(`Stock adjustment: ${itemId}, ${adjustment}, ${reason}`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'chemicals': return '🧪';
      case 'equipment': return '🛠️';
      case 'supplies': return '📦';
      case 'uniforms': return '👕';
      default: return '📋';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'chemicals': return 'Kemikalier';
      case 'equipment': return 'Udstyr';
      case 'supplies': return 'Forsyninger';
      case 'uniforms': return 'Uniformer';
      default: return 'Alle';
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minStock) {
      return { status: 'low', color: 'text-red-600 bg-red-100', label: 'Lav lagerbeholdning' };
    } else if (item.currentStock >= item.maxStock * 0.8) {
      return { status: 'high', color: 'text-green-600 bg-green-100', label: 'God lagerbeholdning' };
    } else {
      return { status: 'normal', color: 'text-yellow-600 bg-yellow-100', label: 'Normal lagerbeholdning' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lagerstyring
            </h1>
            <p className="text-gray-600">
              Administration af rengøringsmidler, udstyr og forsyninger
            </p>
          </div>
          
          <button
            onClick={() => setShowAddItem(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Tilføj vare
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <CubeIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total varer</p>
                <p className="text-2xl font-semibold text-gray-900">{inventoryStats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Lav lagerbeholdning</p>
                <p className="text-2xl font-semibold text-gray-900">{inventoryStats.lowStockCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Udløber snart</p>
                <p className="text-2xl font-semibold text-gray-900">{inventoryStats.expiringCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total værdi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(inventoryStats.totalValue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Søg efter varer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alle kategorier</option>
              <option value="chemicals">Kemikalier</option>
              <option value="equipment">Udstyr</option>
              <option value="supplies">Forsyninger</option>
              <option value="uniforms">Uniformer</option>
            </select>

            {/* Low Stock Filter */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Kun lav lagerbeholdning</span>
            </label>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lagerbeholdning
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Værdi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {getCategoryIcon(item.category)} {getCategoryName(item.category)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <strong>{item.currentStock}</strong> {item.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {item.minStock} | Max: {item.maxStock}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(item.currentStock * item.costPerUnit)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.costPerUnit)}/{item.unit}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.location}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStockAdjustment(item.id, -1, 'Manual justering')}
                            className="text-red-600 hover:text-red-800"
                            disabled={item.currentStock <= 0}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleStockAdjustment(item.id, 1, 'Manual justering')}
                            className="text-green-600 hover:text-green-800"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            Detaljer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Hurtige handlinger
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors">
              <ShoppingCartIcon className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Opret indkøbsordre</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors">
              <TruckIcon className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Registrer levering</span>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors">
              <ClockIcon className="h-6 w-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Lageropgørelse</span>
            </button>
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Seneste lagerbevægelser
          </h3>
          
          <div className="space-y-3">
            {stockMovements.slice(0, 5).map((movement) => {
              const item = inventory.find(i => i.id === movement.itemId);
              
              return (
                <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      movement.type === 'in' ? 'bg-green-500' : 
                      movement.type === 'out' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item?.name} ({movement.quantity} {item?.unit})
                      </p>
                      <p className="text-xs text-gray-500">
                        {movement.reason} - {movement.timestamp.toLocaleDateString('da-DK')}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`text-sm font-medium ${
                    movement.type === 'in' ? 'text-green-600' : 
                    movement.type === 'out' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}{movement.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}