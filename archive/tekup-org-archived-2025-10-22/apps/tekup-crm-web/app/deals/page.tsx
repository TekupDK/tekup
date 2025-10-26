'use client';

import React, { useState } from 'react';

export default function Deals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  
  // Mock data for deals
  const deals = [
    {
      id: '1',
      name: 'Enterprise Software License',
      company: 'TechCorp',
      value: 125000,
      stage: 'Proposal',
      closeDate: '2023-12-15',
    },
    {
      id: '2',
      name: 'Marketing Campaign',
      company: 'Innovate Inc',
      value: 45000,
      stage: 'Negotiation',
      closeDate: '2023-11-30',
    },
    {
      id: '3',
      name: 'Cloud Migration Project',
      company: 'Startup.io',
      value: 87500,
      stage: 'Prospecting',
      closeDate: '2024-01-20',
    },
  ];

  const dealStages = [
    { id: '1', name: 'Prospecting', color: 'bg-blue-500' },
    { id: '2', name: 'Qualification', color: 'bg-yellow-500' },
    { id: '3', name: 'Proposal', color: 'bg-purple-500' },
    { id: '4', name: 'Negotiation', color: 'bg-green-500' },
    { id: '5', name: 'Closed Won', color: 'bg-green-700' },
    { id: '6', name: 'Closed Lost', color: 'bg-red-500' },
  ];

  const filteredDeals = deals.filter(deal =>
    deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.stage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">Deals</h1>
          <div className="flex space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search deals..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                className={`px-3 py-2 ${viewMode === 'board' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                onClick={() => setViewMode('board')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                onClick={() => setViewMode('list')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Deal
            </button>
          </div>
        </div>

        {viewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dealStages.map((stage) => (
              <div key={stage.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className={`${stage.color} text-white p-3 rounded-t-lg`}>
                  <h3 className="font-semibold">{stage.name}</h3>
                </div>
                <div className="p-3 space-y-3">
                  {filteredDeals
                    .filter((deal) => deal.stage === stage.name)
                    .map((deal) => (
                      <div key={deal.id} className="border border-gray-200 dark:border-gray-700 rounded p-3 hover:shadow-md transition-shadow">
                        <h4 className="font-medium text-gray-900 dark:text-white">{deal.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{deal.company}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            ${deal.value.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {deal.closeDate}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deal</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stage</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Close Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {deal.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {deal.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${deal.value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {deal.closeDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3">Edit</a>
                      <a href="#" className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Delete</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}