'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Navigation, Clock, MapPin, Users, Fuel, Save, RefreshCw, Route, Car, AlertTriangle } from 'lucide-react';

interface RouteStop {
  id: string;
  address: string;
  customer: string;
  jobType: 'kontorrenhold' | 'privat' | 'specialrengøring' | 'vinduespolering';
  estimatedDuration: number; // minutes
  timeWindow: { start: string; end: string };
  priority: 'high' | 'medium' | 'low';
  coordinates: { lat: number; lng: number };
  notes?: string;
}

interface OptimizedRoute {
  id: string;
  teamId: string;
  teamName: string;
  vehicle: string;
  stops: RouteStop[];
  totalDistance: number; // km
  totalDuration: number; // minutes
  estimatedFuelCost: number;
  efficiency: number; // percentage
  startTime: string;
  endTime: string;
}

interface RouteOptimizationProps {
  date?: Date;
  onSaveRoute?: (route: OptimizedRoute) => void;
}

export function RouteOptimization({ date = new Date(), onSaveRoute }: RouteOptimizationProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [optimizationMode, setOptimizationMode] = useState<'distance' | 'time' | 'fuel'>('distance');

  // Mock data for Danish cleaning routes in Copenhagen area
  const [unoptimizedStops] = useState<RouteStop[]>([
    {
      id: '1',
      address: 'Kongens Nytorv 15, 1050 København K',
      customer: 'Køpenhavns Advokatfirma',
      jobType: 'kontorrenhold',
      estimatedDuration: 120,
      timeWindow: { start: '08:00', end: '17:00' },
      priority: 'medium',
      coordinates: { lat: 55.6805, lng: 12.5851 },
      notes: 'Parkering i indre gård'
    },
    {
      id: '2',
      address: 'Strandvejen 45, 2900 Hellerup',
      customer: 'Caja og Torben Madsen',
      jobType: 'privat',
      estimatedDuration: 180,
      timeWindow: { start: '09:00', end: '15:00' },
      priority: 'high',
      coordinates: { lat: 55.7326, lng: 12.5735 },
      notes: 'Hund i hjemmet - ring på inden indgang'
    },
    {
      id: '3',
      address: 'Vesterbrogade 20, 1620 København V',
      customer: 'Design Bureau ApS',
      jobType: 'kontorrenhold',
      estimatedDuration: 90,
      timeWindow: { start: '10:00', end: '16:00' },
      priority: 'medium',
      coordinates: { lat: 55.6736, lng: 12.5481 },
    },
    {
      id: '4',
      address: 'Øster Allé 42, 2100 København Ø',
      customer: 'TechStart ApS',
      jobType: 'kontorrenhold',
      estimatedDuration: 60,
      timeWindow: { start: '14:00', end: '18:00' },
      priority: 'high',
      coordinates: { lat: 55.7031, lng: 12.5897 },
      notes: 'Vigtig kunde - perfekt udførelse'
    },
    {
      id: '5',
      address: 'Amagerbrogade 100, 2300 København S',
      customer: 'Café Luna',
      jobType: 'specialrengøring',
      estimatedDuration: 150,
      timeWindow: { start: '06:00', end: '10:00' },
      priority: 'high',
      coordinates: { lat: 55.6583, lng: 12.6186 },
      notes: 'Tidlig start - køkken skal være klar til åbning'
    },
    {
      id: '6',
      address: 'Nørrebrogade 66, 2200 København N',
      customer: 'Nørrebro Tandklinik',
      jobType: 'kontorrenhold',
      estimatedDuration: 75,
      timeWindow: { start: '17:00', end: '20:00' },
      priority: 'medium',
      coordinates: { lat: 55.6939, lng: 12.5530 },
      notes: 'Rengør efter lukketid'
    }
  ]);

  const optimizeRoutes = async () => {
    setIsOptimizing(true);
    
    // Simulate route optimization algorithm
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock optimized routes with realistic Danish data
    const optimizedRoutes: OptimizedRoute[] = [
      {
        id: 'route-1',
        teamId: 'team-1',
        teamName: 'Team København Centrum',
        vehicle: 'Renault Kangoo (EL85 123)',
        stops: [
          unoptimizedStops[4], // Café Luna (early morning)
          unoptimizedStops[0], // Advokatfirma
          unoptimizedStops[2], // Design Bureau
          unoptimizedStops[5], // Tandklinik
        ],
        totalDistance: 18.5,
        totalDuration: 425, // 7h 5min including travel
        estimatedFuelCost: 185,
        efficiency: 92,
        startTime: '06:00',
        endTime: '13:05'
      },
      {
        id: 'route-2',
        teamId: 'team-2',
        teamName: 'Team Nord/Øst',
        vehicle: 'Ford Transit Connect (BH42 876)',
        stops: [
          unoptimizedStops[1], // Hellerup
          unoptimizedStops[3], // TechStart
        ],
        totalDistance: 12.3,
        totalDuration: 260, // 4h 20min
        estimatedFuelCost: 123,
        efficiency: 88,
        startTime: '09:00',
        endTime: '13:20'
      }
    ];
    
    setRoutes(optimizedRoutes);
    setIsOptimizing(false);
  };

  const getJobTypeColor = (type: RouteStop['jobType']) => {
    switch (type) {
      case 'kontorrenhold': return 'bg-blue-500 text-white';
      case 'privat': return 'bg-green-500 text-white';
      case 'specialrengøring': return 'bg-purple-500 text-white';
      case 'vinduespolering': return 'bg-cyan-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority: RouteStop['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Rute Optimering</h2>
          <p className="text-gray-300">
            Optimer ruter for effektiv kørsel og maksimal kundetilfredshed
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={optimizationMode}
            onChange={(e) => setOptimizationMode(e.target.value as typeof optimizationMode)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="distance">Korteste afstand</option>
            <option value="time">Korteste tid</option>
            <option value="fuel">Laveste brændstofforbrug</option>
          </select>
          
          <Button
            onClick={optimizeRoutes}
            disabled={isOptimizing}
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Optimerer...
              </>
            ) : (
              <>
                <Route className="w-4 h-4 mr-2" />
                Optimer Ruter
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Optimization Status */}
      {isOptimizing && (
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
              <div className="flex-1">
                <p className="text-white font-medium">Optimerer ruter...</p>
                <p className="text-gray-300 text-sm">Analyserer {unoptimizedStops.length} stop og beregner optimale ruter</p>
                <Progress value={Math.random() * 100} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unoptimized Stops Overview */}
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Jobs til optimering ({unoptimizedStops.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unoptimizedStops.map((stop) => (
              <div
                key={stop.id}
                className={`p-3 rounded-lg bg-white/10 border-l-4 ${getPriorityColor(stop.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getJobTypeColor(stop.jobType)} size="sm">
                    {stop.jobType}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {stop.estimatedDuration}min
                  </span>
                </div>
                
                <h4 className="text-sm font-medium text-white mb-1">{stop.customer}</h4>
                <p className="text-xs text-gray-400 mb-2">{stop.address}</p>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {stop.timeWindow.start} - {stop.timeWindow.end}
                </div>
                
                {stop.notes && (
                  <div className="mt-2 text-xs text-yellow-300 bg-yellow-500/20 p-1 rounded">
                    {stop.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimized Routes */}
      {routes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Optimerede Ruter</h3>
          
          {routes.map((route) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Car className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white">{route.teamName}</CardTitle>
                        <p className="text-gray-400 text-sm">{route.vehicle}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-emerald-500 text-white">
                        {route.efficiency}% effektiv
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSaveRoute?.(route)}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Gem Rute
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Route Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                      <Navigation className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{route.totalDistance} km</p>
                      <p className="text-xs text-gray-400">Total afstand</p>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {Math.floor(route.totalDuration / 60)}t {route.totalDuration % 60}min
                      </p>
                      <p className="text-xs text-gray-400">Total tid</p>
                    </div>
                    
                    <div className="text-center p-3 bg-yellow-500/20 rounded-lg">
                      <Fuel className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{route.estimatedFuelCost} kr</p>
                      <p className="text-xs text-gray-400">Brændstof</p>
                    </div>
                    
                    <div className="text-center p-3 bg-green-500/20 rounded-lg">
                      <Users className="w-6 h-6 text-green-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{route.stops.length}</p>
                      <p className="text-xs text-gray-400">Stop</p>
                    </div>
                  </div>
                  
                  {/* Route Timeline */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-green-400 mb-4">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-3" />
                      <span className="font-medium">{route.startTime} - Start fra depot</span>
                    </div>
                    
                    {route.stops.map((stop, index) => {
                      const startTime = new Date(`2024-01-01 ${route.startTime}`);
                      startTime.setMinutes(startTime.getMinutes() + (index * 60) + (index * 15)); // Approx travel time
                      
                      return (
                        <div key={stop.id} className="flex items-start space-x-4 relative">
                          <div className="flex flex-col items-center">
                            <div className="w-4 h-4 bg-cyan-500 rounded-full" />
                            {index < route.stops.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-600 mt-2" />
                            )}
                          </div>
                          
                          <div className="flex-1 bg-white/5 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge className={getJobTypeColor(stop.jobType)} size="sm">
                                  {stop.jobType}
                                </Badge>
                                <span className="text-sm text-cyan-400">
                                  {startTime.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {stop.estimatedDuration} min
                              </span>
                            </div>
                            
                            <h4 className="text-white font-medium mb-1">{stop.customer}</h4>
                            <p className="text-gray-400 text-sm mb-2">{stop.address}</p>
                            
                            {stop.notes && (
                              <div className="flex items-start space-x-2 text-xs text-yellow-300 bg-yellow-500/20 p-2 rounded">
                                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{stop.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="flex items-center text-sm text-red-400 mt-4">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-3" />
                      <span className="font-medium">{route.endTime} - Retur til depot</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* No routes optimized yet */}
      {routes.length === 0 && !isOptimizing && (
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
          <CardContent className="p-8 text-center">
            <Route className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Ingen optimerede ruter endnu</h3>
            <p className="text-gray-400 mb-4">
              Klik på "Optimer Ruter" for at generere effektive ruter baseret på dagens jobs
            </p>
            <Button
              onClick={optimizeRoutes}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
            >
              <Route className="w-4 h-4 mr-2" />
              Start Optimering
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}