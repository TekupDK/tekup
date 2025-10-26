import { Injectable, Logger } from '@nestjs/common';

export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'event' | 'market' | 'street' | 'private';
  estimatedCustomers?: number;
  averageRevenue?: number;
  permits?: string[];
}

export interface TimeSlot {
  start: Date;
  end: Date;
  location: Location;
  estimatedRevenue: number;
  travelTime?: number;
  setupTime?: number;
}

export interface RouteOptimization {
  date: Date;
  timeSlots: TimeSlot[];
  totalRevenue: number;
  totalDistance: number;
  totalTravelTime: number;
  efficiency: number; // Revenue per hour
  recommendations: string[];
}

@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);

  async optimizeRoute(
    date: Date,
    availableLocations: Location[],
    workingHours: { start: number; end: number },
    truckCapacity: number,
  ): Promise<RouteOptimization> {
    this.logger.log(`Optimizing route for ${date.toDateString()}`);

    // Filter locations by permits and availability
    const validLocations = availableLocations.filter(location => 
      this.isLocationAvailable(location, date)
    );

    // Calculate travel times between locations
    const travelMatrix = await this.calculateTravelMatrix(validLocations);
    
    // Optimize route using greedy algorithm with revenue optimization
    const optimizedSlots = this.optimizeTimeSlots(
      validLocations,
      travelMatrix,
      workingHours,
      date
    );

    // Calculate metrics
    const totalRevenue = optimizedSlots.reduce((sum, slot) => sum + slot.estimatedRevenue, 0);
    const totalDistance = this.calculateTotalDistance(optimizedSlots, travelMatrix);
    const totalTravelTime = this.calculateTotalTravelTime(optimizedSlots, travelMatrix);
    const workingTime = (workingHours.end - workingHours.start);
    const efficiency = totalRevenue / workingTime;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      optimizedSlots,
      totalRevenue,
      efficiency,
      validLocations
    );

    return {
      date,
      timeSlots: optimizedSlots,
      totalRevenue,
      totalDistance,
      totalTravelTime,
      efficiency,
      recommendations,
    };
  }

  private isLocationAvailable(location: Location, date: Date): boolean {
    // Check if location requires permits and if they're valid
    if (location.permits && location.permits.length > 0) {
      // Simulate permit validation
      return true; // In real implementation, check permit database
    }

    // Check if location is open on this day
    const dayOfWeek = date.getDay();
    
    // Different rules for different location types
    switch (location.type) {
      case 'market':
        // Markets typically operate on specific days
        return dayOfWeek === 6 || dayOfWeek === 0; // Saturday or Sunday
      case 'event':
        // Events need to be checked against event calendar
        return true; // In real implementation, check event database
      case 'street':
        // Street locations available most days
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      case 'private':
        // Private events by appointment
        return true;
      default:
        return true;
    }
  }

  private async calculateTravelMatrix(locations: Location[]): Promise<number[][]> {
    // Simulate travel time calculation using Google Maps API
    const matrix: number[][] = [];
    
    for (let i = 0; i < locations.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < locations.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          // Simulate travel time calculation
          const distance = this.calculateDistance(
            locations[i].coordinates,
            locations[j].coordinates
          );
          matrix[i][j] = Math.max(distance * 2, 15); // Minimum 15 minutes between locations
        }
      }
    }
    
    return matrix;
  }

  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lng - coord1.lng);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coord1.lat)) * Math.cos(this.deg2rad(coord2.lat)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private optimizeTimeSlots(
    locations: Location[],
    travelMatrix: number[][],
    workingHours: { start: number; end: number },
    date: Date,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const usedLocations = new Set<number>();
    
    let currentTime = workingHours.start;
    let currentLocationIndex = -1;

    while (currentTime < workingHours.end && usedLocations.size < locations.length) {
      // Find best next location based on revenue per hour and travel time
      let bestLocationIndex = -1;
      let bestScore = -1;
      
      for (let i = 0; i < locations.length; i++) {
        if (usedLocations.has(i)) continue;
        
        const location = locations[i];
        const travelTime = currentLocationIndex >= 0 ? travelMatrix[currentLocationIndex][i] : 0;
        const setupTime = 30; // 30 minutes setup time
        const serviceTime = 120; // 2 hours service time
        const totalTime = travelTime + setupTime + serviceTime;
        
        if (currentTime + totalTime / 60 > workingHours.end) continue;
        
        const estimatedRevenue = location.averageRevenue || this.estimateLocationRevenue(location);
        const revenuePerHour = estimatedRevenue / (totalTime / 60);
        
        // Score considers revenue efficiency and travel optimization
        const score = revenuePerHour - (travelTime * 2); // Penalize long travel times
        
        if (score > bestScore) {
          bestScore = score;
          bestLocationIndex = i;
        }
      }

      if (bestLocationIndex === -1) break; // No more viable locations

      // Add time slot
      const location = locations[bestLocationIndex];
      const travelTime = currentLocationIndex >= 0 ? travelMatrix[currentLocationIndex][bestLocationIndex] : 0;
      const setupTime = 30;
      const serviceTime = 120;
      
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(currentTime), (currentTime % 1) * 60);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + setupTime + serviceTime);

      slots.push({
        start: slotStart,
        end: slotEnd,
        location,
        estimatedRevenue: location.averageRevenue || this.estimateLocationRevenue(location),
        travelTime,
        setupTime,
      });

      usedLocations.add(bestLocationIndex);
      currentLocationIndex = bestLocationIndex;
      currentTime += (travelTime + setupTime + serviceTime) / 60;
    }

    return slots;
  }

  private estimateLocationRevenue(location: Location): number {
    // Revenue estimation based on location type and estimated customers
    const baseRevenues = {
      event: 3000,
      market: 2500,
      street: 1500,
      private: 2000,
    };

    let baseRevenue = baseRevenues[location.type] || 1500;
    
    if (location.estimatedCustomers) {
      // Adjust based on customer count (average 50 DKK per customer)
      baseRevenue = location.estimatedCustomers * 50;
    }

    return baseRevenue;
  }

  private calculateTotalDistance(slots: TimeSlot[], travelMatrix: number[][]): number {
    // Calculate total distance for the route
    let totalDistance = 0;
    
    for (let i = 1; i < slots.length; i++) {
      // Find location indices and add distance
      // This is simplified - in real implementation would use proper location mapping
      totalDistance += 10; // Placeholder distance
    }
    
    return totalDistance;
  }

  private calculateTotalTravelTime(slots: TimeSlot[], travelMatrix: number[][]): number {
    return slots.reduce((total, slot) => total + (slot.travelTime || 0), 0);
  }

  private generateRecommendations(
    slots: TimeSlot[],
    totalRevenue: number,
    efficiency: number,
    allLocations: Location[],
  ): string[] {
    const recommendations: string[] = [];

    if (efficiency < 800) {
      recommendations.push('Consider focusing on higher-revenue locations to improve efficiency');
    }

    if (slots.length < 3) {
      recommendations.push('Route has capacity for additional stops - consider shorter service times');
    }

    const unusedHighValueLocations = allLocations.filter(loc => 
      !slots.some(slot => slot.location.id === loc.id) && 
      (loc.averageRevenue || this.estimateLocationRevenue(loc)) > 2000
    );

    if (unusedHighValueLocations.length > 0) {
      recommendations.push(`High-value locations available: ${unusedHighValueLocations.map(l => l.name).join(', ')}`);
    }

    if (totalRevenue > 8000) {
      recommendations.push('Excellent revenue potential - consider extending working hours');
    }

    return recommendations;
  }
}