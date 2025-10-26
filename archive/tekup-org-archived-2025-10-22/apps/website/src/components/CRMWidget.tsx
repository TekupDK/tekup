import { ArrowRight, Calendar, Mail, Phone, Plus, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CRMWidget = () => {
  const navigate = useNavigate();

  const recentActivities = [
    {
      id: '1',
      type: 'call',
      title: 'Opfølgning på AI-platform demo',
      contact: 'Lars Andersen - Nordea Bank',
      dueDate: '2024-09-15T10:00:00',
      priority: 'high'
    },
    {
      id: '2',
      type: 'email',
      title: 'Send teknisk dokumentation',
      contact: 'Maria Hansen - TDC Group',
      dueDate: '2024-09-16T14:00:00',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'meeting',
      title: 'Præsentation for LEGO leadership',
      contact: 'Thomas Nielsen - LEGO Group',
      dueDate: '2024-09-18T13:00:00',
      priority: 'high'
    }
  ];

  const crmStats = {
    totalContacts: 47,
    activeDeals: 12,
    pipelineValue: 2.8,
    monthlyGrowth: 23
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Users;
      default: return Calendar;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'I dag';
    if (diffDays === 1) return 'I morgen';
    if (diffDays < 0) return `${Math.abs(diffDays)} dage siden`;
    if (diffDays <= 7) return `Om ${diffDays} dage`;
    
    return date.toLocaleDateString('da-DK', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  return (
    <div className="space-y-6">
      {/* CRM Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Kontakter</p>
              <p className="text-lg font-bold text-white">{crmStats.totalContacts}</p>
            </div>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Aktive Deals</p>
              <p className="text-lg font-bold text-white">{crmStats.activeDeals}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Pipeline</p>
              <p className="text-lg font-bold text-white">{crmStats.pipelineValue}M DKK</p>
            </div>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Vækst</p>
              <p className="text-lg font-bold text-green-400">+{crmStats.monthlyGrowth}%</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Kommende Aktiviteter</h3>
          <button
            onClick={() => navigate('/crm')}
            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span className="text-sm">Se alle</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {recentActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activity.type === 'call' ? 'bg-green-600/20 text-green-400' :
                  activity.type === 'email' ? 'bg-blue-600/20 text-blue-400' :
                  'bg-purple-600/20 text-purple-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{activity.title}</p>
                  <p className="text-gray-400 text-xs">{activity.contact}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">{formatDate(activity.dueDate)}</p>
                  <div className={`w-2 h-2 rounded-full ${
                    activity.priority === 'high' ? 'bg-red-400' :
                    activity.priority === 'medium' ? 'bg-yellow-400' :
                    'bg-green-400'
                  }`}></div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => navigate('/crm')}
          className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600/20 border border-blue-600/50 rounded-lg hover:bg-blue-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ny Aktivitet</span>
        </button>
      </div>
    </div>
  );
};

export default CRMWidget;