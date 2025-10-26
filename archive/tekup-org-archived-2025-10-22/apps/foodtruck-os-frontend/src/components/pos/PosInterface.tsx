'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { ShoppingCartIcon, CreditCardIcon } from '@heroicons/react/outline';
import { MenuItem, SaleItem, PaymentMethod } from '@/types';
import { posApi } from '@/services/api';

export function PosInterface() {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: menuItems = [], isLoading } = useQuery(
    ['menuItems'],
    () => posApi.getMenuItems()
  );

  const processSaleMutation = useMutation(posApi.processSale, {
    onSuccess: () => {
      setCart([]);
      toast.success('Salg gennemført!');
      queryClient.invalidateQueries(['dailySales']);
    },
    onError: () => {
      toast.error('Salg fejlede');
    },
  });

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.menuItemId === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menuItemId === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      }]);
    }
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart(cart.map(item =>
      item.menuItemId === menuItemId
        ? { ...item, quantity }
        : item
    ));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatAmount = totalAmount * 0.25; // 25% Danish VAT

  const handlePayment = (method: PaymentMethod) => {
    processSaleMutation.mutate({
      items: cart,
      paymentMethod: method,
      totalAmount,
      vatAmount,
    });
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Items */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Menu</h2>
          
          {/* Category Filter */}
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'Alle' : category}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-lg font-semibold text-blue-600 mt-2">
                  {item.price} DKK
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart & Payment */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <ShoppingCartIcon className="w-5 h-5 mr-2" />
          <h2 className="text-lg font-semibold">Kurv</h2>
        </div>

        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Kurven er tom</p>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {cart.map(item => (
                <div key={item.menuItemId} className="flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.price} DKK</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{(totalAmount - vatAmount).toFixed(2)} DKK</span>
              </div>
              <div className="flex justify-between">
                <span>Moms (25%):</span>
                <span>{vatAmount.toFixed(2)} DKK</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{totalAmount.toFixed(2)} DKK</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => handlePayment('DANKORT')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Dankort
              </button>
              <button
                onClick={() => handlePayment('MOBILEPAY')}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
              >
                MobilePay
              </button>
              <button
                onClick={() => handlePayment('CASH')}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
              >
                Kontant
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
