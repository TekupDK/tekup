import {
  LayoutDashboard,
  Briefcase,
  Settings,
  Wrench,
  Users,
  Mail,
  Calendar,
  FileText,
  Activity,
  Bot,
  Database,
  Server,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  category?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Lead Management', icon: Users, category: 'Business Operations' },
  { id: 'invoices', label: 'Invoicing', icon: FileText, category: 'Business Operations' },
  { id: 'email', label: 'Email Automation', icon: Mail, category: 'Business Operations' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, category: 'Business Operations' },
  { id: 'system-health', label: 'System Health', icon: Activity, category: 'Technical Operations' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: Database, category: 'Technical Operations' },
  { id: 'agents', label: 'Agent Monitoring', icon: Bot, category: 'Technical Operations' },
  { id: 'logs', label: 'Logs', icon: Server, category: 'Technical Operations' },
  { id: 'tenants', label: 'Tenant Management', icon: Briefcase, category: 'Administration' },
  { id: 'users', label: 'Users', icon: Users, category: 'Administration' },
  { id: 'apis', label: 'API Integrations', icon: Settings, category: 'Administration' },
  { id: 'performance', label: 'Performance', icon: BarChart3, category: 'Administration' },
];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, currentPage, setCurrentPage } = useApp();

  const groupedItems = navItems.reduce((acc, item) => {
    const category = item.category || 'main';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">TekUp</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-6">
              {!sidebarCollapsed && category !== 'main' && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {category}
                </h3>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                      className={`w-full flex items-center ${
                        sidebarCollapsed ? 'justify-center' : 'justify-start'
                      } px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="ml-3 text-sm font-medium">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
