import { Bell, Database, Globe, Key, Lock, Mail, Monitor, Moon, Palette, Phone, RefreshCw, Save, Shield, Sun, User } from "lucide-react";
import { useState } from "react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    reports: true
  });
  const [profile, setProfile] = useState({
    name: "Jonas Abde",
    email: "jonas@tekup.dk",
    role: "AI Administrator",
    company: "TekUp.dk",
    phone: "+45 XX XX XX XX"
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sikkerhed', icon: Shield },
    { id: 'notifications', label: 'Notifikationer', icon: Bell },
    { id: 'data', label: 'Data & Privatliv', icon: Database },
    { id: 'appearance', label: 'Udseende', icon: Palette },
    { id: 'system', label: 'System', icon: Globe }
  ];

  const handleNotificationChange = (type: string) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Profil information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fulde navn</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rolle</label>
                  <select
                    value={profile.role}
                    onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="AI Administrator">AI Administrator</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="ML Engineer">ML Engineer</option>
                    <option value="System Administrator">System Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Virksomhed</label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Profilbillede</h3>
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mr-3">
                    Upload nyt billede
                  </button>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                    Fjern billede
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Login & Sikkerhed</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">To-faktor autentifikation</div>
                      <div className="text-sm text-gray-400">Ekstra sikkerhed for din konto</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                    Aktiveret
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="text-white font-medium">API Nøgler</div>
                      <div className="text-sm text-gray-400">Administrer dine API-adgangsnøgler</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Administrer
                  </button>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-3">Skift adgangskode</h4>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Nuværende adgangskode"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Ny adgangskode"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Bekræft ny adgangskode"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                      Opdater adgangskode
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Notifikation indstillinger</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">Email notifikationer</div>
                      <div className="text-sm text-gray-400">Modtag updates via email</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('email')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.email ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.email ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-white font-medium">Push notifikationer</div>
                      <div className="text-sm text-gray-400">Browser notifikationer</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('push')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.push ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.push ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="text-white font-medium">SMS notifikationer</div>
                      <div className="text-sm text-gray-400">Kritiske alerts via SMS</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('sms')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.sms ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.sms ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Data & Privatliv</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-2">Data eksport</h4>
                  <p className="text-sm text-gray-400 mb-3">Download alle dine data i maskinlæsbart format</p>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Anmod om data eksport
                  </button>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-2">Slet konto</h4>
                  <p className="text-sm text-gray-400 mb-3">Permanent sletning af din konto og alle tilknyttede data</p>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    Slet konto
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Udseende & Tilgængelighed</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-3">Tema</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-lg border transition-all ${
                        theme === 'dark' 
                          ? 'bg-gray-900 border-blue-500' 
                          : 'bg-gray-700 border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-center">
                        <Moon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <span className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-gray-300'}`}>
                          Mørk {theme === 'dark' && '(Aktiv)'}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-lg border transition-all ${
                        theme === 'light' 
                          ? 'bg-gray-900 border-blue-500' 
                          : 'bg-gray-700 border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-center">
                        <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                        <span className={`text-sm ${theme === 'light' ? 'text-blue-400' : 'text-gray-300'}`}>
                          Lys {theme === 'light' && '(Aktiv)'}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setTheme('auto')}
                      className={`p-4 rounded-lg border transition-all ${
                        theme === 'auto' 
                          ? 'bg-gray-900 border-blue-500' 
                          : 'bg-gray-700 border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      <div className="text-center">
                        <Monitor className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                        <span className={`text-sm ${theme === 'auto' ? 'text-blue-400' : 'text-gray-300'}`}>
                          Auto {theme === 'auto' && '(Aktiv)'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-3">Skriftstørrelse</h4>
                  <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none">
                    <option value="small">Lille</option>
                    <option value="medium" selected>Medium</option>
                    <option value="large">Stor</option>
                    <option value="extra-large">Ekstra stor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">System indstillinger</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-3">Sprog & Region</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Sprog</label>
                      <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none">
                        <option value="da">Dansk</option>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                        <option value="sv">Svenska</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tidszone</label>
                      <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none">
                        <option value="Europe/Copenhagen">Copenhagen (CET)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="America/New_York">New York (EST)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-white font-medium mb-3">Performance</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Auto-refresh dashboard</span>
                      <select className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                        <option value="5">5 sekunder</option>
                        <option value="10" selected>10 sekunder</option>
                        <option value="30">30 sekunder</option>
                        <option value="60">1 minut</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Vis animationer</span>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Vælg en kategori</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Indstillinger</h1>
              <p className="text-gray-400">Tilpas din TekUp.dk oplevelse</p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>Nulstil</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                <Save className="w-4 h-4" />
                <span>Gem ændringer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;