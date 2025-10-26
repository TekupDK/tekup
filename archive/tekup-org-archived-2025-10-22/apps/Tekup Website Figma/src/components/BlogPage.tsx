'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Tag,
  ArrowRight,
  TrendingUp,
  Brain,
  Shield,
  Zap,
  Users,
  BarChart3,
  Globe,
  BookOpen,
  Filter,
  ChevronRight,
  Star,
  Share2,
  Bookmark,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', label: 'Alle artikler', count: 24 },
    { id: 'ai', label: 'AI & Automation', count: 8 },
    { id: 'crm', label: 'CRM Tips', count: 6 },
    { id: 'business', label: 'Business Growth', count: 5 },
    { id: 'tech', label: 'Tech Updates', count: 5 }
  ];

  const featuredPost = {
    id: 1,
    title: 'Sådan øger AI din CRM effektivitet med 300%',
    excerpt: 'Lær hvordan intelligent automatisering kan transformere din salgsproces og frigive tid til det der virkelig tæller - byggede relationer.',
    content: 'Moderne virksomheder står overfor en kritisk udfordring: hvordan maksimerer man salgseffektiviteten uden at gå på kompromis med kundeoplevelsen? Svaret ligger i intelligent AI-integration...',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHRlY2hub2xvZ3klMjBkYXRhfGVufDF8fHx8MTc1Nzc4NDY2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    author: {
      name: 'Maria Andersen',
      role: 'CTO, Tekup',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b367?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHdvbWFuJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc1Nzc4NDYwOXww&ixlib=rb-4.1.0&q=80&w=1080'
    },
    category: 'AI & Automation',
    readTime: '8 min',
    publishedAt: '15. januar 2024',
    likes: 156,
    comments: 23,
    tags: ['AI', 'CRM', 'Automation', 'Sales']
  };

  const blogPosts = [
    {
      id: 2,
      title: 'Lead Scoring: Fra manual proces til AI-drevet automatisering',
      excerpt: 'Moderne lead scoring teknikker der kan øge din konverteringsrate markant.',
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080',
      author: {
        name: 'Lars Hansen',
        role: 'CEO, Tekup',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080'
      },
      category: 'CRM Tips',
      readTime: '6 min',
      publishedAt: '12. januar 2024',
      likes: 89,
      comments: 15,
      tags: ['Lead Scoring', 'AI', 'Sales']
    },
    {
      id: 3,
      title: 'GDPR & AI: Sådan sikrer du compliance i 2024',
      excerpt: 'Praktisk guide til at navigere GDPR krav når du implementerer AI-løsninger.',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080',
      author: {
        name: 'Emma Sørensen',
        role: 'Legal & Compliance',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080'
      },
      category: 'Business Growth',
      readTime: '10 min',
      publishedAt: '10. januar 2024',
      likes: 234,
      comments: 42,
      tags: ['GDPR', 'Compliance', 'AI', 'Legal']
    },
    {
      id: 4,
      title: 'SMB Skalering: 5 automatiseringsstrategier der virker',
      excerpt: 'Lær de mest effektive metoder til at skalere din SMB uden at ansætte flere.',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080',
      author: {
        name: 'Mikkel Jensen',
        role: 'VP of Product',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080'
      },
      category: 'Business Growth',
      readTime: '7 min',
      publishedAt: '8. januar 2024',
      likes: 167,
      comments: 28,
      tags: ['SMB', 'Scaling', 'Automation']
    },
    {
      id: 5,
      title: 'Jarvis AI Update: Nye funktioner i version 2.4',
      excerpt: 'Overblik over de seneste AI-capabilities og hvordan de kan optimere din workflow.',
      image: 'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080',
      author: {
        name: 'Andreas Nielsen',
        role: 'AI Research Lead',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080'
      },
      category: 'Tech Updates',
      readTime: '5 min',
      publishedAt: '5. januar 2024',
      likes: 201,
      comments: 37,
      tags: ['Jarvis AI', 'Updates', 'Features']
    },
    {
      id: 6,
      title: 'Customer Success Stories: Hvordan TechStart ApS øgede efficiency 400%',
      excerpt: 'En dybdegående case study af hvordan intelligent automation transformerede en dansk startup.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080',
      author: {
        name: 'Sophie Larsen',
        role: 'Customer Success',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fA&ixlib=rb-4.1.0&q=80&w=1080'
      },
      category: 'Business Growth',
      readTime: '12 min',
      publishedAt: '3. januar 2024',
      likes: 312,
      comments: 56,
      tags: ['Case Study', 'Customer Success', 'ROI']
    }
  ];

  const trendingTopics = [
    'AI Automation',
    'Lead Scoring',
    'GDPR Compliance',
    'Customer Success',
    'SMB Growth',
    'Tech Updates'
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || 
      post.category.toLowerCase().includes(selectedCategory) ||
      post.tags.some(tag => tag.toLowerCase().includes(selectedCategory));
    
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      
      {/* Floating orbs */}
      <motion.div 
        className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <section className="pt-32 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-6"
            >
              <Badge className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/30 text-purple-300 backdrop-blur-sm px-6 py-3">
                <BookOpen className="w-4 h-4 mr-2" />
                Tekup Blog & Insights
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Ekspert indsigter om
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  AI og automation
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Dybdegående artikler, case studies og praktiske guides fra vores team af AI-eksperter, 
                produktspecialister og brancheledere.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Søg artikler, guides og case studies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm rounded-xl text-lg"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                    } backdrop-blur-sm rounded-lg px-4 py-2`}
                  >
                    {category.label}
                    <Badge className="ml-2 bg-white/20 text-current border-0">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Trending Topics */}
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-3">Populære emner:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {trendingTopics.map((topic) => (
                    <Badge
                      key={topic}
                      variant="outline"
                      className="bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 cursor-pointer transition-colors"
                      onClick={() => setSearchTerm(topic)}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl hover-lift smooth-3d">
                <div className="grid lg:grid-cols-2">
                  <div className="relative h-64 lg:h-auto">
                    <ImageWithFallback
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 backdrop-blur-sm">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-8 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          {featuredPost.category}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-400 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {featuredPost.publishedAt}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {featuredPost.readTime}
                          </div>
                        </div>
                      </div>
                      
                      <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                        {featuredPost.title}
                      </h2>
                      
                      <p className="text-gray-300 leading-relaxed">
                        {featuredPost.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {featuredPost.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="bg-white/5 border-white/20 text-gray-400">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={featuredPost.author.avatar} alt={featuredPost.author.name} />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                              {featuredPost.author.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-white">{featuredPost.author.name}</div>
                            <div className="text-sm text-gray-400">{featuredPost.author.role}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {featuredPost.likes}
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {featuredPost.comments}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                          <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25">
                            Læs artikel
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </motion.div>
                        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <Bookmark className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Seneste artikler
                  {filteredPosts.length > 0 && (
                    <span className="text-gray-400 ml-2">({filteredPosts.length})</span>
                  )}
                </h2>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Filter className="w-4 h-4 mr-2" />
                  Sorter
                </Button>
              </div>
            </motion.div>

            {filteredPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 h-full hover-lift smooth-3d group cursor-pointer">
                      <div className="relative overflow-hidden">
                        <ImageWithFallback
                          src={post.image}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                            {post.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center text-sm text-gray-400 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {post.publishedAt}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {post.readTime}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white leading-tight group-hover:text-cyan-400 transition-colors">
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="bg-white/5 border-white/20 text-gray-400 text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-400 text-xs">
                              +{post.tags.length - 3}
                            </Badge>
                          )}
                        </div>

                        <Separator className="bg-white/10" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={post.author.avatar} alt={post.author.name} />
                              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                                {post.author.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-xs text-gray-400">{post.author.name}</div>
                          </div>

                          <div className="flex items-center space-x-3 text-xs text-gray-400">
                            <div className="flex items-center">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              {post.likes}
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              {post.comments}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ingen artikler fundet</h3>
                <p className="text-gray-400 mb-6">Prøv at justere dine søge- eller filtermuligheder</p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                >
                  Ryd filtre
                </Button>
              </motion.div>
            )}

            {/* Load More */}
            {filteredPosts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center mt-12"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm px-8"
                >
                  Indlæs flere artikler
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-8 h-8 text-cyan-400" />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white">
                      Hold dig opdateret
                    </h2>
                    
                    <p className="text-gray-300 leading-relaxed">
                      Få de seneste insights om AI, automation og SMB-vækst direkte i din indbakke. 
                      Ingen spam - kun værdifuldt indhold.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                      <Input
                        type="email"
                        placeholder="Din email adresse"
                        className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:ring-cyan-500 focus:border-cyan-500 backdrop-blur-sm"
                      />
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 px-6 whitespace-nowrap">
                        Tilmeld
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      Vi respekterer din privatliv. Afmeld når som helst.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}