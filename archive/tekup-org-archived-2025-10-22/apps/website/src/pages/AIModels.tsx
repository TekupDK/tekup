import { AlertCircle, Brain, CheckCircle, Clock, Database, Download, Filter, Pause, Play, Search, Settings, TrendingUp, Upload } from "lucide-react";
import { useState } from "react";

const AIModels = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const modelCategories = [
    { id: 'all', label: 'Alle løsninger', count: 200 },
    { id: 'active', label: 'Aktive', count: 167 },
    { id: 'training', label: 'Under implementering', count: 15 },
    { id: 'ready', label: 'Klar til deployment', count: 18 },
    { id: 'archived', label: 'Arkiverede', count: 8 }
  ];

  const aiModels = [
    {
      id: 1,
      name: "Business Intelligence Platform",
      type: "Intelligent Dataanalyse",
      status: "active",
      accuracy: 94.5,
      lastTrained: "2 timer siden",
      dataSize: "2.3TB",
      performance: 847,
      description: "Intelligent beslutningsstøtte for ledelse"
    },
    {
      id: 2,
      name: "Kunde Analytics Engine",
      type: "Automatiseret Analyse",
      status: "training",
      accuracy: 89.2,
      lastTrained: "Kører nu",
      dataSize: "890GB",
      performance: 623,
      description: "Forudsiger kundeadfærd og markedstrends"
    },
    {
      id: 3,
      name: "Dokument Processor",
      type: "Intelligent Tekstanalyse",
      status: "ready",
      accuracy: 92.8,
      lastTrained: "6 timer siden",
      dataSize: "1.7TB",
      performance: 721,
      description: "Automatiseret dokumentbehandling og analyse"
    },
    {
      id: 4,
      name: "Kvalitetskontrol System",
      type: "Billede Analyse",
      status: "active",
      accuracy: 95.5,
      lastTrained: "1 dag siden",
      dataSize: "4.1TB",
      performance: 892,
      description: "Automatiseret kvalitetskontrol og fejldetektion"
    },
    {
      id: 5,
      name: "Fraud Detection Platform",
      type: "Sikkerhedsanalyse",
      status: "ready",
      accuracy: 94.3,
      lastTrained: "3 timer siden",
      dataSize: "650MB",
      performance: 567,
      description: "Opdager uregelmæssigheder og svindel i realtid"
    },
    {
      id: 6,
      name: "Personaliserings Engine",
      type: "Kunde Oplevelse",
      status: "active",
      accuracy: 88.7,
      lastTrained: "12 timer siden",
      dataSize: "1.2TB",
      performance: 445,
      description: "Skræddersyede brugeroplevelser og anbefalinger"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'training':
        return <Clock className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'ready':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'training':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'ready':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const filteredModels = selectedCategory === 'all' 
    ? aiModels 
    : aiModels.filter(model => model.status === selectedCategory);

  // Apply search filter
  const searchFilteredModels = filteredModels.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply sorting
  const sortedModels = [...searchFilteredModels].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'accuracy':
        return b.accuracy - a.accuracy;
      case 'performance':
        return b.performance - a.performance;
      case 'lastTrained':
        return a.lastTrained.localeCompare(b.lastTrained);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Business Intelligence</h1>
              <p className="text-gray-400">Administrer dine forretningsløsninger og overvåg performance</p>
            </div>
            <div className="flex space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <Upload className="w-4 h-4" />
                <span>Upload model</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                <Brain className="w-4 h-4" />
                <span>Ny model</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Søg i modeller, typer eller beskrivelser..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="name">Sorter efter navn</option>
                <option value="accuracy">Sorter efter nøjagtighed</option>
                <option value="performance">Sorter efter performance</option>
                <option value="lastTrained">Sorter efter træning</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {modelCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                  : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-800/70'
              }`}
            >
              <span className="font-medium">{category.label}</span>
              <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">{category.count}</span>
            </button>
          ))}
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <div key={model.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300 group">
              
              {/* Model Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {model.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">{model.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs border ${getStatusColor(model.status)}`}>
                      {getStatusIcon(model.status)}
                      <span className="capitalize">{model.status === 'active' ? 'Aktiv' : model.status === 'training' ? 'Træner' : model.status === 'ready' ? 'Klar' : model.status}</span>
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-md">{model.type}</span>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Nøjagtighed</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${model.accuracy}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-white">{model.accuracy}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Performance</span>
                  <span className="text-sm font-medium text-white">{model.performance} ops/sek</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Datasæt</span>
                  <span className="text-sm font-medium text-white">{model.dataSize}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Sidst trænet</span>
                  <span className="text-sm font-medium text-white">{model.lastTrained}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {model.status === 'active' ? (
                    <button className="flex items-center space-x-1 px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors">
                      <Pause className="w-4 h-4" />
                      <span className="text-xs">Pause</span>
                    </button>
                  ) : (
                    <button className="flex items-center space-x-1 px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors">
                      <Play className="w-4 h-4" />
                      <span className="text-xs">Start</span>
                    </button>
                  )}
                  <button className="flex items-center space-x-1 px-3 py-2 bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    <span className="text-xs">Config</span>
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="mt-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Performance oversigt</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mx-auto mb-4">
                <Database className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-2">12.7TB</div>
              <div className="text-sm text-gray-400">Total data processeret</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-2">96.8%</div>
              <div className="text-sm text-gray-400">Gennemsnitlig nøjagtighed</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-2">2.3M</div>
              <div className="text-sm text-gray-400">Forudsigelser i dag</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModels;