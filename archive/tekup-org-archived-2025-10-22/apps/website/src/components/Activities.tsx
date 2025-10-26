import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Circle,
    Clock,
    Mail,
    MessageSquare,
    Phone,
    Plus,
    Star,
    Users
} from 'lucide-react';
import { useState } from 'react';

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  title: string;
  description: string;
  contactId: string;
  contactName: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'call',
      title: 'Opfølgning på AI-platform demo',
      description: 'Ring til Lars Andersen vedr. feedback på den demo vi gav sidste uge',
      contactId: '1',
      contactName: 'Lars Andersen - Nordea Bank',
      dueDate: '2024-09-15T10:00:00',
      completed: false,
      priority: 'high',
      createdAt: '2024-09-12T09:00:00'
    },
    {
      id: '2',
      type: 'email',
      title: 'Send teknisk dokumentation',
      description: 'Maria Hansen ønsker detaljeret teknisk specifikation for AI-løsningen',
      contactId: '2',
      contactName: 'Maria Hansen - TDC Group',
      dueDate: '2024-09-16T14:00:00',
      completed: false,
      priority: 'medium',
      createdAt: '2024-09-13T11:30:00'
    },
    {
      id: '3',
      type: 'meeting',
      title: 'Præsentation for LEGO leadership team',
      description: 'Demo af AI-løsninger til produktudvikling og kvalitetskontrol',
      contactId: '3',
      contactName: 'Thomas Nielsen - LEGO Group',
      dueDate: '2024-09-18T13:00:00',
      completed: false,
      priority: 'high',
      createdAt: '2024-09-14T08:00:00'
    },
    {
      id: '4',
      type: 'task',
      title: 'Forbered ROI analyse for Vestas',
      description: 'Udarbejd business case med forventede besparelser på maintenance costs',
      contactId: '4',
      contactName: 'Sofie Larsen - Vestas',
      dueDate: '2024-09-17T16:00:00',
      completed: true,
      priority: 'medium',
      createdAt: '2024-09-10T14:20:00'
    },
    {
      id: '5',
      type: 'note',
      title: 'Konkurrent analyse færdig',
      description: 'Analyseret konkurrenternes AI-tilbud til energisektoren. Vestas ser meget positive ud.',
      contactId: '4',
      contactName: 'Sofie Larsen - Vestas',
      dueDate: '2024-09-14T12:00:00',
      completed: true,
      priority: 'low',
      createdAt: '2024-09-14T12:00:00'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | Activity['type']>('all');

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Users;
      case 'task': return CheckCircle;
      case 'note': return MessageSquare;
      default: return Circle;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'call': return 'text-green-400';
      case 'email': return 'text-blue-400';
      case 'meeting': return 'text-purple-400';
      case 'task': return 'text-yellow-400';
      case 'note': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: Activity['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const statusMatch = filter === 'all' || 
      (filter === 'pending' && !activity.completed) ||
      (filter === 'completed' && activity.completed);
    
    const typeMatch = typeFilter === 'all' || activity.type === typeFilter;
    
    return statusMatch && typeMatch;
  });

  const toggleActivityComplete = (id: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, completed: !activity.completed } : activity
    ));
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !activities.find(a => a.dueDate === dueDate)?.completed;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'I dag';
    if (diffDays === 1) return 'I morgen';
    if (diffDays === -1) return 'I går';
    if (diffDays < 0) return `${Math.abs(diffDays)} dage siden`;
    if (diffDays <= 7) return `Om ${diffDays} dage`;
    
    return date.toLocaleDateString('da-DK', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Aktiviteter</h2>
          <p className="text-gray-400">Administrer opgaver, møder og opfølgninger</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>Ny Aktivitet</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex space-x-1">
          {['all', 'pending', 'completed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {filterOption === 'all' && 'Alle'}
              {filterOption === 'pending' && 'Afventende'}
              {filterOption === 'completed' && 'Færdige'}
            </button>
          ))}
        </div>

        <div className="flex space-x-1">
          {['all', 'call', 'email', 'meeting', 'task', 'note'].map((typeOption) => {
            const Icon = typeOption === 'all' ? Star : getActivityIcon(typeOption as Activity['type']);
            return (
              <button
                key={typeOption}
                onClick={() => setTypeFilter(typeOption as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  typeFilter === typeOption
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize">
                  {typeOption === 'all' ? 'Alle' : 
                   typeOption === 'call' ? 'Opkald' :
                   typeOption === 'email' ? 'Email' :
                   typeOption === 'meeting' ? 'Møder' :
                   typeOption === 'task' ? 'Opgaver' :
                   typeOption === 'note' ? 'Noter' : typeOption}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Ingen aktiviteter</h3>
            <p className="text-gray-400">Tilføj en ny aktivitet for at komme i gang</p>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const isTaskOverdue = isOverdue(activity.dueDate);
            
            return (
              <div
                key={activity.id}
                className={`bg-gray-700/50 backdrop-blur-sm border rounded-xl p-6 transition-colors ${
                  activity.completed ? 'border-gray-600 opacity-75' : 
                  isTaskOverdue ? 'border-red-500/50 bg-red-900/10' : 'border-gray-600 hover:bg-gray-700/70'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Activity Type Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.completed ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    <Icon className={`w-5 h-5 ${activity.completed ? 'text-white' : getActivityColor(activity.type)}`} />
                  </div>

                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className={`text-lg font-semibold ${
                          activity.completed ? 'text-gray-400 line-through' : 'text-white'
                        }`}>
                          {activity.title}
                        </h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                          {activity.priority === 'high' ? 'Høj' : 
                           activity.priority === 'medium' ? 'Medium' : 'Lav'}
                        </div>
                        {isTaskOverdue && !activity.completed && (
                          <div className="flex items-center space-x-1 text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Forsinket</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleActivityComplete(activity.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          activity.completed 
                            ? 'text-green-400 hover:text-green-300' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {activity.completed ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <p className={`mt-2 ${
                      activity.completed ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                      {activity.description}
                    </p>

                    {/* Contact and Date */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-4">
                        <span className={`text-sm ${
                          activity.completed ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {activity.contactName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(activity.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">I dag</p>
              <p className="text-xl font-bold text-white">
                {activities.filter(a => {
                  const today = new Date().toDateString();
                  return new Date(a.dueDate).toDateString() === today && !a.completed;
                }).length}
              </p>
            </div>
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Forfaldne</p>
              <p className="text-xl font-bold text-red-400">
                {activities.filter(a => isOverdue(a.dueDate)).length}
              </p>
            </div>
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Denne uge</p>
              <p className="text-xl font-bold text-white">
                {activities.filter(a => {
                  const weekFromNow = new Date();
                  weekFromNow.setDate(weekFromNow.getDate() + 7);
                  return new Date(a.dueDate) <= weekFromNow && !a.completed;
                }).length}
              </p>
            </div>
            <Clock className="w-6 h-6 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Færdige</p>
              <p className="text-xl font-bold text-green-400">
                {activities.filter(a => a.completed).length}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activities;