import { useState } from 'react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Search, Filter, Plus, Mail, Phone, Building2 } from 'lucide-react';
import { Lead } from '../types';

export function Leads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Lead['status'] | 'all'>('all');

  const mockLeads: Lead[] = [
    {
      id: '1',
      tenant_id: '1',
      name: 'John Doe',
      email: 'john@acme.com',
      phone: '+45 12 34 56 78',
      company: 'Acme Corporation',
      status: 'new',
      source: 'website',
      value: 25000,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      notes: 'Interested in enterprise plan',
    },
    {
      id: '2',
      tenant_id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@techstart.dk',
      phone: '+45 98 76 54 32',
      company: 'TechStart',
      status: 'qualified',
      source: 'gmail',
      value: 45000,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      notes: 'Follow-up scheduled for next week',
    },
    {
      id: '3',
      tenant_id: '1',
      name: 'Michael Chen',
      email: 'michael@innovate.com',
      phone: '+45 23 45 67 89',
      company: 'Innovate Solutions',
      status: 'proposal',
      source: 'calendar',
      value: 75000,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      notes: 'Proposal sent, awaiting response',
    },
    {
      id: '4',
      tenant_id: '1',
      name: 'Emma Nielsen',
      email: 'emma@localco.dk',
      phone: '+45 34 56 78 90',
      company: 'Local Business Co',
      status: 'won',
      source: 'referral',
      value: 15000,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      notes: 'Deal closed successfully',
    },
  ];

  const getStatusBadge = (status: Lead['status']) => {
    const variants: Record<Lead['status'], { variant: 'primary' | 'success' | 'warning' | 'danger' | 'gray'; label: string }> = {
      new: { variant: 'primary', label: 'New' },
      contacted: { variant: 'gray', label: 'Contacted' },
      qualified: { variant: 'warning', label: 'Qualified' },
      proposal: { variant: 'warning', label: 'Proposal' },
      negotiation: { variant: 'warning', label: 'Negotiation' },
      won: { variant: 'success', label: 'Won' },
      lost: { variant: 'danger', label: 'Lost' },
    };
    return variants[status];
  };

  const getSourceBadge = (source: Lead['source']) => {
    const labels: Record<Lead['source'], string> = {
      gmail: 'Gmail',
      calendar: 'Calendar',
      website: 'Website',
      manual: 'Manual',
      referral: 'Referral',
    };
    return labels[source];
  };

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and track your sales leads
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Lead['status'] | 'all')}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLeads.map((lead) => {
                  const statusBadge = getStatusBadge(lead.status);
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {lead.name}
                          </p>
                          {lead.company && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <Building2 className="w-3 h-3 mr-1" />
                              {lead.company}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <Mail className="w-3 h-3 mr-1" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                              <Phone className="w-3 h-3 mr-1" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getSourceBadge(lead.source)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {lead.value.toLocaleString()} DKK
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
