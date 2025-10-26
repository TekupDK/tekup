import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Mail, Palette, Database, Shield, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettings {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  cvr: string;
  website: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  newLeads: boolean;
  bookingReminders: boolean;
  quoteUpdates: boolean;
  customerMessages: boolean;
  systemUpdates: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: string;
  loginNotifications: boolean;
}

interface Tab {
  id: string;
  name: string;
  icon: typeof User;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Mock settings data
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    cvr: '',
    website: ''
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    newLeads: true,
    bookingReminders: true,
    quoteUpdates: true,
    customerMessages: true,
    systemUpdates: false
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: '30',
    loginNotifications: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would fetch these settings from your API
        // For now, we'll simulate a network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProfileSettings({
          companyName: 'TekUp Renos',
          email: 'kontakt@renos.dk',
          phone: '+45 12 34 56 78',
          address: 'Hovedgade 123, 2100 København Ø',
          cvr: '12345678',
          website: 'https://www.renos.dk'
        });
        setNotificationSettings({
          emailNotifications: true,
          newLeads: true,
          bookingReminders: true,
          quoteUpdates: true,
          customerMessages: true,
          systemUpdates: false
        });
        setSecuritySettings({
          twoFactorAuth: false,
          sessionTimeout: '30',
          loginNotifications: true
        });
      } catch (error) {
        console.error("Failed to fetch settings", error);
        toast.error('Kunne ikke indlæse indstillinger.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);


  const tabs: Tab[] = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'notifications', name: 'Notifikationer', icon: Bell },
    { id: 'security', name: 'Sikkerhed', icon: Shield },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'appearance', name: 'Udseende', icon: Palette },
    { id: 'system', name: 'System', icon: Database }
  ];

  const handleProfileUpdate = (field: keyof ProfileSettings, value: string) => {
    setProfileSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (field: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSecurityUpdate = (field: keyof SecuritySettings, value: string | boolean) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async (settingsType: string) => {
    setIsSaving(true);
    toast.info(`Gemmer ${settingsType} indstillinger...`);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In a real app, you would send the updated settings to your API
      // await fetch(`${API_URL}/settings`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ profileSettings, notificationSettings, securitySettings }),
      // });
      toast.success(`${settingsType} indstillinger er gemt!`);
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error(`Fejl ved gemning af ${settingsType} indstillinger.`);
    } finally {
      setIsSaving(false);
    }
  };


  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Virksomhedsoplysninger</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Virksomhedsnavn
            </label>
            <input
              type="text"
              value={profileSettings.companyName}
              onChange={(e) => handleProfileUpdate('companyName', e.target.value)}
              className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              CVR-nummer
            </label>
            <input
              type="text"
              value={profileSettings.cvr}
              onChange={(e) => handleProfileUpdate('cvr', e.target.value)}
              className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={profileSettings.email}
              onChange={(e) => handleProfileUpdate('email', e.target.value)}
              className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={profileSettings.phone}
              onChange={(e) => handleProfileUpdate('phone', e.target.value)}
              className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={profileSettings.address}
              onChange={(e) => handleProfileUpdate('address', e.target.value)}
              className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Website
            </label>
            <input
              type="url"
              value={profileSettings.website}
              onChange={(e) => handleProfileUpdate('website', e.target.value)}
              className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button className="glass glass-hover rounded-lg px-6 py-3 border text-foreground transition-all duration-300">
          Annuller
        </button>
        <button
          onClick={() => handleSaveSettings('Profil')}
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          Gem Ændringer
        </button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Notifikationspræferencer</h3>
        <div className="space-y-4">
          <div className="glass rounded-lg p-4 border flex items-center justify-between hover:border-primary/50 transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifikationer</p>
              <p className="text-xs text-muted-foreground">Modtag notifikationer via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={() => handleNotificationToggle('emailNotifications')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="glass rounded-lg p-4 border flex items-center justify-between hover:border-primary/50 transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-foreground">Nye Leads</p>
              <p className="text-xs text-muted-foreground">Notifikation når nye leads ankommer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.newLeads}
                onChange={() => handleNotificationToggle('newLeads')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="glass rounded-lg p-4 border flex items-center justify-between hover:border-primary/50 transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-foreground">Booking Påmindelser</p>
              <p className="text-xs text-muted-foreground">Påmindelser om kommende bookinger</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.bookingReminders}
                onChange={() => handleNotificationToggle('bookingReminders')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="glass rounded-lg p-4 border flex items-center justify-between hover:border-primary/50 transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-foreground">Tilbud Opdateringer</p>
              <p className="text-xs text-muted-foreground">Notifikationer om tilbuds status ændringer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.quoteUpdates}
                onChange={() => handleNotificationToggle('quoteUpdates')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="glass rounded-lg p-4 border flex items-center justify-between hover:border-primary/50 transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-foreground">Kunde Beskeder</p>
              <p className="text-xs text-muted-foreground">Notifikationer om nye kunde beskeder</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.customerMessages}
                onChange={() => handleNotificationToggle('customerMessages')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="glass rounded-lg p-4 border flex items-center justify-between hover:border-primary/50 transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-foreground">System Opdateringer</p>
              <p className="text-xs text-muted-foreground">Vigtige opdateringer om systemet</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.systemUpdates}
                onChange={() => handleNotificationToggle('systemUpdates')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button
          onClick={() => handleSaveSettings('Notifikationer')}
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          Gem Ændringer
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Sikkerhedsindstillinger</h3>
        <div className="space-y-4">
          <div className="glass rounded-lg p-4 border flex items-center justify-between hover:border-primary/50 transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-foreground">To-faktor Godkendelse (2FA)</p>
              <p className="text-xs text-muted-foreground">Forøg sikkerheden med et ekstra bekræftelsestrin</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.twoFactorAuth}
                onChange={() => handleSecurityUpdate('twoFactorAuth', !securitySettings.twoFactorAuth)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="glass rounded-lg p-4 border flex items-center justify-between hover:border-primary/50 transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-foreground">Login Notifikationer</p>
              <p className="text-xs text-muted-foreground">Modtag notifikation ved login fra nye enheder</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.loginNotifications}
                onChange={() => handleSecurityUpdate('loginNotifications', !securitySettings.loginNotifications)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-input peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="glass rounded-lg p-4 border hover:border-primary/50 transition-all duration-300">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Session Timeout (minutter)
            </label>
            <input
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) => handleSecurityUpdate('sessionTimeout', e.target.value)}
              className="w-full px-4 py-3 text-sm input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
              placeholder="f.eks. 30"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button
          onClick={() => handleSaveSettings('Sikkerhed')}
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          Gem Ændringer
        </button>
      </div>
    </div>
  );

  const renderEmptyTab = (title: string) => (
    <div className="text-center py-20">
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground mt-2">Denne sektion er under udvikling.</p>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      case 'email':
        return renderEmptyTab('Email Indstillinger');
      case 'appearance':
        return renderEmptyTab('Udseende Indstillinger');
      case 'system':
        return renderEmptyTab('System Indstillinger');
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="stat-icon-wrapper" style={{ width: '3rem', height: '3rem', background: 'rgba(0, 212, 255, 0.1)', borderColor: 'rgba(0, 212, 255, 0.2)' }}>
            <SettingsIcon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-info))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Indstillinger</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Administrer dine profil-, notifikations- og sikkerhedsindstillinger.</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-1/4 lg:w-1/5">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-primary/10 text-primary neon-glow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <div className="glass p-6 sm:p-8 rounded-xl border">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
