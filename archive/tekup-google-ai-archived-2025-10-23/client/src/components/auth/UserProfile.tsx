import React, { useState } from 'react';
import { useAuth } from './SupabaseAuthProvider';

export const UserButton: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block">{user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-medium">{user.email}</div>
            <div className="text-xs text-gray-500">
              ID: {user.id.slice(0, 8)}...
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export const UserProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">User Profile</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <div className="mt-1 text-sm text-gray-900">{user.email}</div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">User ID</label>
          <div className="mt-1 text-sm text-gray-900 font-mono">{user.id}</div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Created At</label>
          <div className="mt-1 text-sm text-gray-900">
            {new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};