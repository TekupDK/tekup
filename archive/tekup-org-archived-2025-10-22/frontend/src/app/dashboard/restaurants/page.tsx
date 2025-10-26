'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Clock,
  Star,
  Users,
  Camera,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  cuisine: string;
  rating: number;
  totalReviews: number;
  openingHours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  image: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

const RestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {
      id: '1',
      name: 'Bella Vista Italian',
      description: 'Authentic Italian cuisine with a modern twist. Fresh ingredients and traditional recipes.',
      address: '123 Main Street, Downtown, City 12345',
      phone: '+1 (555) 123-4567',
      email: 'info@bellavista.com',
      cuisine: 'Italian',
      rating: 4.8,
      totalReviews: 156,
      openingHours: {
        monday: { open: '11:00', close: '22:00' },
        tuesday: { open: '11:00', close: '22:00' },
        wednesday: { open: '11:00', close: '22:00' },
        thursday: { open: '11:00', close: '22:00' },
        friday: { open: '11:00', close: '23:00' },
        saturday: { open: '11:00', close: '23:00' },
        sunday: { open: '12:00', close: '21:00' }
      },
      image: '/api/placeholder/400/300',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Spice Garden',
      description: 'Exotic spices and flavors from around the world. Vegetarian and vegan options available.',
      address: '456 Oak Avenue, Midtown, City 12345',
      phone: '+1 (555) 987-6543',
      email: 'hello@spicegarden.com',
      cuisine: 'Asian Fusion',
      rating: 4.6,
      totalReviews: 89,
      openingHours: {
        monday: { open: '12:00', close: '21:00' },
        tuesday: { open: '12:00', close: '21:00' },
        wednesday: { open: '12:00', close: '21:00' },
        thursday: { open: '12:00', close: '21:00' },
        friday: { open: '12:00', close: '22:00' },
        saturday: { open: '12:00', close: '22:00' },
        sunday: { closed: true, open: '', close: '' }
      },
      image: '/api/placeholder/400/300',
      status: 'active',
      createdAt: '2024-02-01'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatOpeningHours = (hours: Restaurant['openingHours']) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return days.map((day, index) => {
      const dayHours = hours[day];
      if (dayHours.closed) {
        return `${dayNames[index]}: Closed`;
      }
      return `${dayNames[index]}: ${dayHours.open} - ${dayHours.close}`;
    }).join(' • ');
  };

  const RestaurantCard = ({ restaurant }: { restaurant: Restaurant }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative bg-gray-100">
        <img 
          src={restaurant.image} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium capitalize',
            getStatusColor(restaurant.status)
          )}>
            {restaurant.status}
          </span>
        </div>
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{restaurant.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {restaurant.cuisine}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{restaurant.rating}</span>
            <span className="text-xs text-muted-foreground">({restaurant.totalReviews})</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {restaurant.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span className="truncate">{restaurant.address}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="mr-2 h-4 w-4" />
            <span>{restaurant.phone}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span className="truncate">{formatOpeningHours(restaurant.openingHours)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Restaurants</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Restaurant
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search restaurants by name or cuisine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button variant="outline">
          Filter
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurants.length}</div>
            <p className="text-xs text-muted-foreground">
              {restaurants.filter(r => r.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(restaurants.reduce((acc, r) => acc + r.rating, 0) / restaurants.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all restaurants
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restaurants.reduce((acc, r) => acc + r.totalReviews, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer reviews
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuisines</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(restaurants.map(r => r.cuisine)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Different cuisines
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Restaurants Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRestaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchTerm ? 'No restaurants found matching your search.' : 'No restaurants found.'}
          </div>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Restaurant
          </Button>
        </div>
      )}
    </div>
  );
};

export default RestaurantsPage;