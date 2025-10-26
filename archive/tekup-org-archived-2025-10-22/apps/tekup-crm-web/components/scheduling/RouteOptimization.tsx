'use client';

import React, { useState, useMemo } from 'react';
import { mockCleaningJobs, mockTeamMembers } from '../../lib/types/mockData';
import { CleaningJob, TeamMember } from '../../lib/types/scheduling';

// Simple SVG icon components
const TruckIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21H19a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const MapIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalculatorIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const ChartBarIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// Interface for optimized route
interface OptimizedRoute {
  id: string;
  teamMember: TeamMember;
  jobs: CleaningJob[];
  totalDistance: number;
  totalDuration: number;
  estimatedFuelCost: number;
  efficiency: number;
}

// Interface for route optimization parameters
interface RouteOptimizationParams {
  date: Date;
  maxJobsPerRoute: number;
  maxDistancePerRoute: number;
  fuelCostPerKm: number;
  includeTrafficData: boolean;
  prioritizeEfficiency: boolean;
}

// Mock function to calculate distance between two addresses (in real implementation, would use Google Maps API)
const calculateDistance = (address1: string, address2: string): number => {
  // Mock distance calculation based on Danish geography
  const locations: Record<string, { lat: number; lng: number }> = {
    'København': { lat: 55.6761, lng: 12.5683 },
    'Aarhus': { lat: 56.1629, lng: 10.2039 },
    'Odense': { lat: 55.4038, lng: 10.4024 },
    'Aalborg': { lat: 57.0488, lng: 9.9217 },
    'Frederiksberg': { lat: 55.6736, lng: 12.5346 },
    'Hellerup': { lat: 55.7304, lng: 12.5784 },
    'Nørrebro': { lat: 55.6993, lng: 12.5522 },
    'Østerbro': { lat: 55.7058, lng: 12.5691 },
    'Amager': { lat: 55.6493, lng: 12.6034 }
  };

  // Extract city from address
  const getCity = (address: string) => {
    const cities = Object.keys(locations);
    return cities.find(city => address.includes(city)) || 'København';
  };

  const city1 = getCity(address1);
  const city2 = getCity(address2);
  
  const loc1 = locations[city1];
  const loc2 = locations[city2];

  // Calculate approximate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Optimize routes for teams
const optimizeRoutes = (
  jobs: CleaningJob[], 
  teams: TeamMember[], 
  params: RouteOptimizationParams
): OptimizedRoute[] => {
  const optimizedRoutes: OptimizedRoute[] = [];
  
  // Group jobs by location proximity and assign to teams
  teams.forEach((team, index) => {
    const teamJobs = jobs.filter((_, jobIndex) => jobIndex % teams.length === index);
    
    if (teamJobs.length === 0) return;

    // Sort jobs by proximity to minimize travel distance
    const sortedJobs = [...teamJobs].sort((a, b) => {
      if (teamJobs.indexOf(a) === 0) return -1;
      if (teamJobs.indexOf(b) === 0) return 1;
      
      const distanceA = calculateDistance(teamJobs[0].location.address, a.location.address);
      const distanceB = calculateDistance(teamJobs[0].location.address, b.location.address);
      return distanceA - distanceB;
    });

    // Calculate route metrics
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < sortedJobs.length; i++) {
      if (i > 0) {
        totalDistance += calculateDistance(
          sortedJobs[i-1].location.address,
          sortedJobs[i].location.address
        );
      }
      totalDuration += sortedJobs[i].estimatedDuration;
    }

    // Add travel time (assuming 30 km/h average speed in Danish cities)
    totalDuration += (totalDistance / 30) * 60; // minutes

    const estimatedFuelCost = totalDistance * params.fuelCostPerKm;
    const efficiency = sortedJobs.length > 0 ? totalDuration / sortedJobs.length : 0;

    optimizedRoutes.push({
      id: `route-${team.id}`,
      teamMember: team,
      jobs: sortedJobs,
      totalDistance,
      totalDuration,
      estimatedFuelCost,
      efficiency
    });
  });

  return optimizedRoutes;
};

export default function RouteOptimization() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [optimizationParams, setOptimizationParams] = useState<RouteOptimizationParams>({
    date: new Date(),
    maxJobsPerRoute: 6,
    maxDistancePerRoute: 150, // km
    fuelCostPerKm: 2.5, // DKK
    includeTrafficData: true,
    prioritizeEfficiency: true
  });

  // Filter jobs for selected date
  const dayJobs = useMemo(() => {
    return mockCleaningJobs.filter(job => {
      const jobDate = new Date(job.scheduledDate);
      return jobDate.toDateString() === selectedDate.toDateString();
    });
  }, [selectedDate]);

  // Calculate optimized routes
  const optimizedRoutes = useMemo(() => {
    return optimizeRoutes(dayJobs, mockTeamMembers, optimizationParams);
  }, [dayJobs, optimizationParams]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalJobs = optimizedRoutes.reduce((sum, route) => sum + route.jobs.length, 0);
    const totalDistance = optimizedRoutes.reduce((sum, route) => sum + route.totalDistance, 0);
    const totalFuelCost = optimizedRoutes.reduce((sum, route) => sum + route.estimatedFuelCost, 0);
    const averageEfficiency = optimizedRoutes.length > 0 
      ? optimizedRoutes.reduce((sum, route) => sum + route.efficiency, 0) / optimizedRoutes.length 
      : 0;

    return {
      totalJobs,
      totalDistance: Math.round(totalDistance),
      totalFuelCost: Math.round(totalFuelCost),
      averageEfficiency: Math.round(averageEfficiency),
      activeTeams: optimizedRoutes.filter(route => route.jobs.length > 0).length
    };
  }, [optimizedRoutes]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('da-DK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}t ${mins}m`;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rute Optimering
          </h1>
          <p className="text-gray-600">
            Optimer rejseruter for rengøringsteams og reducer omkostninger
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vælg dato
              </label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Jobs Per Route */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max jobs pr. rute
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={optimizationParams.maxJobsPerRoute}
                onChange={(e) => setOptimizationParams(prev => ({
                  ...prev,
                  maxJobsPerRoute: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fuel Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brændstofpris (DKK/km)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={optimizationParams.fuelCostPerKm}
                onChange={(e) => setOptimizationParams(prev => ({
                  ...prev,
                  fuelCostPerKm: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationParams.includeTrafficData}
                onChange={(e) => setOptimizationParams(prev => ({
                  ...prev,
                  includeTrafficData: e.target.checked
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Inkluder trafikdata</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationParams.prioritizeEfficiency}
                onChange={(e) => setOptimizationParams(prev => ({
                  ...prev,
                  prioritizeEfficiency: e.target.checked
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Prioriter effektivitet</span>
            </label>
          </div>
        </div>

        {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Aktive teams</p>
                <p className="text-2xl font-semibold text-gray-900">{overallStats.activeTeams}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{overallStats.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <MapIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total distance</p>
                <p className="text-2xl font-semibold text-gray-900">{overallStats.totalDistance} km</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CalculatorIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Brændstofomkostninger</p>
                <p className="text-2xl font-semibold text-gray-900">{overallStats.totalFuelCost} DKK</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Ø effektivitet</p>
                <p className="text-2xl font-semibold text-gray-900">{overallStats.averageEfficiency}m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Date Display */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ruter for {formatDate(selectedDate)}
          </h2>
          <p className="text-gray-600">
            {optimizedRoutes.filter(route => route.jobs.length > 0).length} aktive ruter fundet
          </p>
        </div>

        {/* Optimized Routes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {optimizedRoutes.filter(route => route.jobs.length > 0).map((route) => (
            <div key={route.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Route Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {route.teamMember.name}
                    </h3>
                    <p className="text-blue-100">
                      {route.teamMember.role} • {route.jobs.length} jobs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {Math.round(route.totalDistance)} km
                    </p>
                    <p className="text-blue-100 text-sm">
                      {formatDuration(route.totalDuration)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Route Metrics */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Brændstof</p>
                    <p className="font-semibold text-gray-900">
                      {Math.round(route.estimatedFuelCost)} DKK
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Effektivitet</p>
                    <p className="font-semibold text-gray-900">
                      {Math.round(route.efficiency)}m/job
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tilgængelighed</p>
                    <p className="font-semibold text-green-600">
                      Aktiv
                    </p>
                  </div>
                </div>
              </div>

              {/* Job List */}
              <div className="px-6 py-4">
                <h4 className="font-medium text-gray-900 mb-3">Rute detaljer:</h4>
                <div className="space-y-3">
                  {route.jobs.map((job, index) => (
                    <div key={job.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {job.customer.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDuration(job.estimatedDuration)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {job.location.address}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {job.jobType === 'kontorrenhold' && 'Kontorrenhold'}
                            {job.jobType === 'privatrenhold' && 'Privatrenhold'}
                            {job.jobType === 'flytterenhold' && 'Flytterenhold'}
                            {job.jobType === 'byggerenhold' && 'Byggerenhold'}
                            {job.jobType === 'vinduespudsning' && 'Vinduespudsning'}
                            {job.jobType === 'dybrengøring' && 'Dybrengøring'}
                          </span>
                          <span className="ml-2 text-xs text-green-600 font-medium">
                            {job.cost.total} DKK
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Route Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t">
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                    Eksporter rute
                  </button>
                  <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                    Send til GPS
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {optimizedRoutes.filter(route => route.jobs.length > 0).length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <TruckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ingen jobs planlagt
            </h3>
            <p className="text-gray-500">
              Der er ingen rengøringsjobs planlagt for {formatDate(selectedDate)}.
              Vælg en anden dato eller tilføj jobs til kalenderen.
            </p>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Vælg dagens dato
            </button>
          </div>
        )}
      </div>
    </div>
  );
}