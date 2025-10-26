'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Clock,
  Star,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Tag,
  ChefHat
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  preparationTime: number;
  rating: number;
  totalOrders: number;
  dietaryRestrictions: string[];
  ingredients: string[];
  calories?: number;
  createdAt: string;
  updatedAt: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  isActive: boolean;
}

const MenusPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: '1',
      name: 'Margherita Pizza',
      description: 'Classic pizza with fresh tomatoes, mozzarella, and basil',
      price: 18.99,
      category: 'Pizza',
      image: '/api/placeholder/300/200',
      isAvailable: true,
      preparationTime: 15,
      rating: 4.8,
      totalOrders: 156,
      dietaryRestrictions: ['vegetarian'],
      ingredients: ['tomato sauce', 'mozzarella', 'basil', 'olive oil'],
      calories: 280,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20'
    },
    {
      id: '2',
      name: 'Chicken Caesar Salad',
      description: 'Fresh romaine lettuce with grilled chicken, parmesan, and caesar dressing',
      price: 14.99,
      category: 'Salads',
      image: '/api/placeholder/300/200',
      isAvailable: true,
      preparationTime: 10,
      rating: 4.6,
      totalOrders: 89,
      dietaryRestrictions: ['gluten-free'],
      ingredients: ['romaine lettuce', 'grilled chicken', 'parmesan', 'caesar dressing'],
      calories: 320,
      createdAt: '2024-01-16',
      updatedAt: '2024-01-22'
    },
    {
      id: '3',
      name: 'Beef Burger Deluxe',
      description: 'Juicy beef patty with lettuce, tomato, cheese, and special sauce',
      price: 16.99,
      category: 'Burgers',
      image: '/api/placeholder/300/200',
      isAvailable: false,
      preparationTime: 12,
      rating: 4.7,
      totalOrders: 234,
      dietaryRestrictions: [],
      ingredients: ['beef patty', 'lettuce', 'tomato', 'cheese', 'special sauce', 'brioche bun'],
      calories: 580,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-25'
    },
    {
      id: '4',
      name: 'Pasta Carbonara',
      description: 'Traditional Italian pasta with eggs, cheese, pancetta, and black pepper',
      price: 19.99,
      category: 'Pasta',
      image: '/api/placeholder/300/200',
      isAvailable: true,
      preparationTime: 18,
      rating: 4.9,
      totalOrders: 178,
      dietaryRestrictions: [],
      ingredients: ['spaghetti', 'eggs', 'parmesan', 'pancetta', 'black pepper'],
      calories: 450,
      createdAt: '2024-01-12',
      updatedAt: '2024-01-18'
    }
  ]);

  const [categories, setCategories] = useState<MenuCategory[]>([
    { id: '1', name: 'Pizza', description: 'Wood-fired pizzas', itemCount: 8, isActive: true },
    { id: '2', name: 'Salads', description: 'Fresh and healthy salads', itemCount: 5, isActive: true },
    { id: '3', name: 'Burgers', description: 'Gourmet burgers', itemCount: 6, isActive: true },
    { id: '4', name: 'Pasta', description: 'Italian pasta dishes', itemCount: 7, isActive: true },
    { id: '5', name: 'Desserts', description: 'Sweet treats', itemCount: 4, isActive: true }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnavailable, setShowUnavailable] = useState(false);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAvailability = showUnavailable || item.isAvailable;
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const getDietaryBadgeColor = (restriction: string) => {
    switch (restriction) {
      case 'vegetarian': return 'bg-green-100 text-green-800';
      case 'vegan': return 'bg-green-200 text-green-900';
      case 'gluten-free': return 'bg-blue-100 text-blue-800';
      case 'dairy-free': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const MenuItemCard = ({ item }: { item: MenuItem }) => (
    <Card className={cn(
      "overflow-hidden hover:shadow-lg transition-shadow",
      !item.isAvailable && "opacity-60"
    )}>
      <div className="aspect-video relative bg-gray-100">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          {!item.isAvailable && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              Unavailable
            </span>
          )}
          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
            ${item.price}
          </span>
        </div>
        <div className="absolute bottom-2 left-2 flex space-x-1">
          {item.dietaryRestrictions.map((restriction) => (
            <span 
              key={restriction}
              className={cn(
                "px-2 py-1 text-xs rounded-full font-medium",
                getDietaryBadgeColor(restriction)
              )}
            >
              {restriction}
            </span>
          ))}
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {item.category}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{item.rating}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            <span>{item.preparationTime} min</span>
          </div>
          <div className="flex items-center">
            <ChefHat className="mr-1 h-4 w-4" />
            <span>{item.totalOrders} orders</span>
          </div>
          {item.calories && (
            <div className="flex items-center">
              <span>{item.calories} cal</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className={item.isAvailable ? "text-red-600" : "text-green-600"}
            >
              {item.isAvailable ? (
                <><EyeOff className="mr-2 h-4 w-4" />Hide</>
              ) : (
                <><Eye className="mr-2 h-4 w-4" />Show</>
              )}
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
        <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Tag className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>
              {category.name} ({category.itemCount})
            </option>
          ))}
        </select>
        <Button 
          variant={showUnavailable ? "default" : "outline"}
          onClick={() => setShowUnavailable(!showUnavailable)}
        >
          <Filter className="mr-2 h-4 w-4" />
          {showUnavailable ? 'Hide' : 'Show'} Unavailable
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuItems.length}</div>
            <p className="text-xs text-muted-foreground">
              {menuItems.filter(item => item.isAvailable).length} available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              {categories.filter(cat => cat.isActive).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(menuItems.reduce((acc, item) => acc + item.price, 0) / menuItems.length).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all items
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Rated</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...menuItems.map(item => item.rating)).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage your menu categories and organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <div 
                key={category.id}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-colors",
                  selectedCategory === category.name ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
                onClick={() => setSelectedCategory(category.name)}
              >
                <div className="font-medium">{category.name}</div>
                <div className="text-sm text-muted-foreground">{category.itemCount} items</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'all' ? 
              'No menu items found matching your criteria.' : 
              'No menu items found.'
            }
          </div>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Menu Item
          </Button>
        </div>
      )}
    </div>
  );
};

export default MenusPage;