'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

// Mock jobs data
const mockJobs = [
  {
    id: '66666666-6666-6666-6666-666666666666',
    customerName: 'Lars Hansen',
    type: 'Vinduespudsning',
    status: 'pending',
    address: 'Nørregade 10, 1234 København',
    price: 500,
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    customerName: 'Test Virksomhed ApS',
    type: 'Facadepolering',
    status: 'in_progress',
    address: 'Industrivej 5, 2000 Frederiksberg',
    price: 1200,
  },
];

export default function JobsPage() {
  const [jobs] = useState(mockJobs);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateJob = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitJob = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Job oprettet');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <a href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-2 block">
              ← Tilbage til dashboard
            </a>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          </div>
          <button
            onClick={handleCreateJob}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Opret job
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Alle</option>
                <option value="pending">Afventende</option>
                <option value="in_progress">I gang</option>
                <option value="completed">Færdig</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Søg efter kunde
              </label>
              <div className="flex">
                <input
                  id="search"
                  type="text"
                  placeholder="Søg efter kunde"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md"
                />
                <button className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700">
                  Søg
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pris</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Handling</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 cursor-pointer" role="row">
                  <td className="px-6 py-4 whitespace-nowrap">{job.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{job.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        job.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : job.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                      data-testid={`job-status-${job.status}`}
                    >
                      {job.status === 'pending' ? 'Afventende' : job.status === 'in_progress' ? 'I gang' : 'Færdig'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{job.price} kr</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a href={`/jobs/${job.id}`} className="text-blue-600 hover:text-blue-700">
                      Se detaljer
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" role="dialog" aria-label="Opret job">
            <h2 className="text-xl font-bold mb-4">Opret job</h2>
            <form onSubmit={handleSubmitJob} className="space-y-4">
              <div>
                <label htmlFor="jobtype" className="block text-sm font-medium text-gray-700 mb-1">
                  Jobtype
                </label>
                <select
                  id="jobtype"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Vælg type</option>
                  <option value="window">Vinduespudsning</option>
                  <option value="facade">Facadepolering</option>
                  <option value="gutter">Tagrendesrensning</option>
                </select>
              </div>
              <div>
                <label htmlFor="kunde" className="block text-sm font-medium text-gray-700 mb-1">
                  Kunde
                </label>
                <select id="kunde" className="w-full px-4 py-2 border border-gray-300 rounded-md" required>
                  <option value="">Vælg kunde</option>
                  <option value="1">Lars Hansen</option>
                  <option value="2">Test Virksomhed ApS</option>
                </select>
              </div>
              <div>
                <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  id="adresse"
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Gem job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
