import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './search.module.css';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  type: 'documentation' | 'api' | 'tutorial' | 'component' | 'guide';
  category: string;
  tags: string[];
  relevanceScore: number;
  lastUpdated: Date;
}

interface UserPreferences {
  role: 'developer' | 'designer' | 'product-manager' | 'business-user';
  experience: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  recentSearches: string[];
  bookmarks: string[];
}

// Mock search data - in real implementation, this would come from a search index
const mockSearchData: SearchResult[] = [
  {
    id: '1',
    title: 'Getting Started with TekUp UI',
    description: 'Learn the basics of using TekUp UI components in your React application',
    content: 'TekUp UI is a comprehensive component library built for modern React applications. It provides a set of accessible, customizable components that follow design system principles.',
    url: '/docs/getting-started',
    type: 'documentation',
    category: 'Basics',
    tags: ['react', 'components', 'ui', 'getting-started'],
    relevanceScore: 0,
    lastUpdated: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Button Component API',
    description: 'Interactive button component with multiple variants and states',
    content: 'The Button component supports various variants including primary, secondary, outline, and ghost. It also supports different sizes and loading states.',
    url: '/api/components/button',
    type: 'api',
    category: 'Components',
    tags: ['button', 'component', 'api', 'interactive'],
    relevanceScore: 0,
    lastUpdated: new Date('2024-01-20')
  },
  {
    id: '3',
    title: 'Flow API Integration',
    description: 'Core backend API service for multi-tenant incident response',
    content: 'The Flow API provides endpoints for managing incidents, users, and tenant data. It supports real-time WebSocket connections and comprehensive authentication.',
    url: '/api/flow-api',
    type: 'api',
    category: 'Backend APIs',
    tags: ['api', 'backend', 'websocket', 'authentication'],
    relevanceScore: 0,
    lastUpdated: new Date('2024-01-18')
  },
  {
    id: '4',
    title: 'Building an API Integration Tutorial',
    description: 'Learn how to integrate TekUp APIs with your frontend application',
    content: 'This tutorial covers setting up API clients, handling authentication, fetching data, and displaying it using TekUp UI components.',
    url: '/tutorials/api-integration',
    type: 'tutorial',
    category: 'Integration',
    tags: ['tutorial', 'api', 'integration', 'frontend'],
    relevanceScore: 0,
    lastUpdated: new Date('2024-01-22')
  },
  {
    id: '5',
    title: 'Card Component Playground',
    description: 'Interactive playground for the Card component',
    content: 'Explore the Card component with live examples, modify props, and see real-time updates. The Card component is flexible and supports various layouts.',
    url: '/component-playground#card',
    type: 'component',
    category: 'Components',
    tags: ['card', 'component', 'playground', 'interactive'],
    relevanceScore: 0,
    lastUpdated: new Date('2024-01-25')
  },
  {
    id: '6',
    title: 'Deployment Guide',
    description: 'Deploy TekUp applications to production environments',
    content: 'Comprehensive guide for deploying TekUp applications using Docker, Kubernetes, and cloud platforms. Includes environment configuration and monitoring setup.',
    url: '/guides/deployment',
    type: 'guide',
    category: 'DevOps',
    tags: ['deployment', 'docker', 'kubernetes', 'production'],
    relevanceScore: 0,
    lastUpdated: new Date('2024-01-12')
  },
  {
    id: '7',
    title: 'Authentication Patterns',
    description: 'Implement secure authentication in TekUp applications',
    content: 'Learn about JWT tokens, API key authentication, OAuth flows, and session management. Includes examples for both frontend and backend implementation.',
    url: '/guides/authentication',
    type: 'guide',
    category: 'Security',
    tags: ['authentication', 'jwt', 'oauth', 'security'],
    relevanceScore: 0,
    lastUpdated: new Date('2024-01-28')
  },
  {
    id: '8',
    title: 'WebSocket Integration',
    description: 'Real-time communication using WebSocket connections',
    content: 'Implement real-time features using WebSocket connections. Covers connection management, message handling, and error recovery patterns.',
    url: '/docs/websocket-integration',
    type: 'documentation',
    category: 'Real-time',
    tags: ['websocket', 'real-time', 'communication', 'events'],
    relevanceScore: 0,
    lastUpdated: new Date('2024-01-30')
  }
];

// Learning paths based on user roles and experience
const learningPaths = {
  'developer-beginner': [
    'Getting Started with TekUp UI',
    'Button Component API',
    'Building an API Integration Tutorial',
    'Authentication Patterns'
  ],
  'developer-intermediate': [
    'Flow API Integration',
    'WebSocket Integration',
    'Deployment Guide',
    'Authentication Patterns'
  ],
  'developer-advanced': [
    'WebSocket Integration',
    'Deployment Guide',
    'Authentication Patterns',
    'Flow API Integration'
  ],
  'designer-beginner': [
    'Getting Started with TekUp UI',
    'Card Component Playground',
    'Button Component API'
  ],
  'product-manager-beginner': [
    'Getting Started with TekUp UI',
    'Flow API Integration',
    'Deployment Guide'
  ]
};

export default function Search(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    type: string[];
    category: string[];
    tags: string[];
  }>({
    type: [],
    category: [],
    tags: []
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    role: 'developer',
    experience: 'intermediate',
    interests: [],
    recentSearches: [],
    bookmarks: []
  });
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Semantic search simulation - in real implementation, this would use AI embeddings
  const performSemanticSearch = useCallback((query: string, data: SearchResult[]): SearchResult[] => {
    if (!query.trim()) return [];

    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    return data.map(item => {
      let score = 0;
      const searchableText = `${item.title} ${item.description} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
      
      // Exact phrase matching (highest score)
      if (searchableText.includes(query.toLowerCase())) {
        score += 100;
      }
      
      // Individual word matching
      queryWords.forEach(word => {
        if (searchableText.includes(word)) {
          score += 10;
        }
        
        // Title matching gets higher score
        if (item.title.toLowerCase().includes(word)) {
          score += 20;
        }
        
        // Tag matching gets higher score
        if (item.tags.some(tag => tag.toLowerCase().includes(word))) {
          score += 15;
        }
      });
      
      // Boost based on user preferences
      if (userPreferences.interests.some(interest => 
        searchableText.includes(interest.toLowerCase())
      )) {
        score += 25;
      }
      
      // Boost based on content type preference
      if (userPreferences.role === 'developer' && (item.type === 'api' || item.type === 'tutorial')) {
        score += 10;
      } else if (userPreferences.role === 'designer' && item.type === 'component') {
        score += 10;
      }
      
      // Recency boost
      const daysSinceUpdate = (Date.now() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) {
        score += 5;
      }
      
      return { ...item, relevanceScore: score };
    }).filter(item => item.relevanceScore > 0);
  }, [userPreferences]);

  // Perform search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let results = performSemanticSearch(query, mockSearchData);
    
    // Apply filters
    if (selectedFilters.type.length > 0) {
      results = results.filter(item => selectedFilters.type.includes(item.type));
    }
    if (selectedFilters.category.length > 0) {
      results = results.filter(item => selectedFilters.category.includes(item.category));
    }
    if (selectedFilters.tags.length > 0) {
      results = results.filter(item => 
        item.tags.some(tag => selectedFilters.tags.includes(tag))
      );
    }
    
    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'date':
          return b.lastUpdated.getTime() - a.lastUpdated.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });
    
    setSearchResults(results);
    setIsSearching(false);
    
    // Add to search history
    if (query && !searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    }
  }, [performSemanticSearch, selectedFilters, sortBy, searchHistory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const types = [...new Set(mockSearchData.map(item => item.type))];
    const categories = [...new Set(mockSearchData.map(item => item.category))];
    const tags = [...new Set(mockSearchData.flatMap(item => item.tags))];
    
    return { types, categories, tags };
  }, []);

  // Get personalized recommendations
  const personalizedRecommendations = useMemo(() => {
    const pathKey = `${userPreferences.role}-${userPreferences.experience}` as keyof typeof learningPaths;
    const recommendedTitles = learningPaths[pathKey] || [];
    
    return mockSearchData.filter(item => 
      recommendedTitles.includes(item.title)
    ).slice(0, 4);
  }, [userPreferences]);

  const toggleFilter = (filterType: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({ type: [], category: [], tags: [] });
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <Layout
      title="Advanced Search"
      description="Intelligent search with semantic capabilities, personalized recommendations, and advanced filtering">
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <h1>🔍 Advanced Search</h1>
            <p className="lead">
              Intelligent search with semantic understanding, personalized recommendations, 
              and role-based content filtering.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="row margin-top--lg">
          <div className="col col--12">
            <div className="card">
              <div className="card__body">
                <div className={styles.searchContainer}>
                  <div className={styles.searchInputWrapper}>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search documentation, APIs, tutorials, and more..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {isSearching && <div className={styles.searchSpinner}>⏳</div>}
                  </div>
                  
                  <button
                    className="button button--outline button--sm margin-left--sm"
                    onClick={() => setShowPersonalization(!showPersonalization)}>
                    ⚙️ Personalize
                  </button>
                </div>

                {/* Search History */}
                {searchHistory.length > 0 && !searchQuery && (
                  <div className="margin-top--md">
                    <small className="text--secondary">Recent searches:</small>
                    <div className={styles.searchHistory}>
                      {searchHistory.map((query, index) => (
                        <button
                          key={index}
                          className="button button--outline button--sm margin-right--sm margin-top--sm"
                          onClick={() => setSearchQuery(query)}>
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personalization Panel */}
        {showPersonalization && (
          <div className="row margin-top--md">
            <div className="col col--12">
              <div className="card">
                <div className="card__header">
                  <h4>🎯 Personalization Settings</h4>
                </div>
                <div className="card__body">
                  <div className="row">
                    <div className="col col--4">
                      <label className="margin-bottom--sm">
                        <strong>Your Role</strong>
                      </label>
                      <select
                        className={styles.selectInput}
                        value={userPreferences.role}
                        onChange={(e) => setUserPreferences(prev => ({
                          ...prev,
                          role: e.target.value as UserPreferences['role']
                        }))}>
                        <option value="developer">Developer</option>
                        <option value="designer">Designer</option>
                        <option value="product-manager">Product Manager</option>
                        <option value="business-user">Business User</option>
                      </select>
                    </div>
                    <div className="col col--4">
                      <label className="margin-bottom--sm">
                        <strong>Experience Level</strong>
                      </label>
                      <select
                        className={styles.selectInput}
                        value={userPreferences.experience}
                        onChange={(e) => setUserPreferences(prev => ({
                          ...prev,
                          experience: e.target.value as UserPreferences['experience']
                        }))}>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="col col--4">
                      <label className="margin-bottom--sm">
                        <strong>Interests</strong>
                      </label>
                      <div className={styles.interestTags}>
                        {['React', 'APIs', 'UI/UX', 'DevOps', 'Security', 'Testing'].map(interest => (
                          <button
                            key={interest}
                            className={`button button--sm ${
                              userPreferences.interests.includes(interest) 
                                ? 'button--primary' 
                                : 'button--outline'
                            }`}
                            onClick={() => setUserPreferences(prev => ({
                              ...prev,
                              interests: prev.interests.includes(interest)
                                ? prev.interests.filter(i => i !== interest)
                                : [...prev.interests, interest]
                            }))}>
                            {interest}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row margin-top--lg">
          {/* Filters Sidebar */}
          <div className="col col--3">
            <div className="card">
              <div className="card__header">
                <div className="row">
                  <div className="col col--8">
                    <h4>Filters</h4>
                  </div>
                  <div className="col col--4 text--right">
                    <button
                      className="button button--outline button--sm"
                      onClick={clearFilters}>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              <div className="card__body">
                {/* Content Type Filter */}
                <div className="margin-bottom--md">
                  <h5>Content Type</h5>
                  {filterOptions.types.map(type => (
                    <label key={type} className={styles.filterCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedFilters.type.includes(type)}
                        onChange={() => toggleFilter('type', type)}
                      />
                      <span className="margin-left--sm">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Category Filter */}
                <div className="margin-bottom--md">
                  <h5>Category</h5>
                  {filterOptions.categories.map(category => (
                    <label key={category} className={styles.filterCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedFilters.category.includes(category)}
                        onChange={() => toggleFilter('category', category)}
                      />
                      <span className="margin-left--sm">{category}</span>
                    </label>
                  ))}
                </div>

                {/* Tags Filter */}
                <div className="margin-bottom--md">
                  <h5>Tags</h5>
                  <div className={styles.tagFilter}>
                    {filterOptions.tags.slice(0, 10).map(tag => (
                      <button
                        key={tag}
                        className={`button button--sm ${
                          selectedFilters.tags.includes(tag) 
                            ? 'button--primary' 
                            : 'button--outline'
                        }`}
                        onClick={() => toggleFilter('tags', tag)}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <h5>Sort By</h5>
                  <select
                    className={styles.selectInput}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                    <option value="relevance">Relevance</option>
                    <option value="date">Last Updated</option>
                    <option value="title">Title</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="col col--9">
            {!searchQuery && personalizedRecommendations.length > 0 && (
              <div className="card margin-bottom--lg">
                <div className="card__header">
                  <h4>🎯 Recommended for You</h4>
                  <p className="text--secondary margin-bottom--none">
                    Based on your role ({userPreferences.role}) and experience level ({userPreferences.experience})
                  </p>
                </div>
                <div className="card__body">
                  <div className="row">
                    {personalizedRecommendations.map(item => (
                      <div key={item.id} className="col col--6 margin-bottom--md">
                        <div className={styles.recommendationCard}>
                          <h6>
                            <a href={item.url}>{item.title}</a>
                          </h6>
                          <p className="text--secondary">{item.description}</p>
                          <div className={styles.itemMeta}>
                            <span className={`badge badge--${
                              item.type === 'documentation' ? 'primary' :
                              item.type === 'api' ? 'success' :
                              item.type === 'tutorial' ? 'warning' :
                              item.type === 'component' ? 'info' : 'secondary'
                            }`}>
                              {item.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {searchQuery && (
              <div className="card">
                <div className="card__header">
                  <div className="row">
                    <div className="col col--8">
                      <h4>
                        Search Results
                        {searchResults.length > 0 && (
                          <span className="text--secondary"> ({searchResults.length} found)</span>
                        )}
                      </h4>
                    </div>
                    <div className="col col--4 text--right">
                      {searchQuery && (
                        <small className="text--secondary">
                          Search for: "{searchQuery}"
                        </small>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card__body">
                  {isSearching ? (
                    <div className="text--center padding--lg">
                      <div className={styles.loadingSpinner}></div>
                      <p className="text--secondary">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className={styles.searchResults}>
                      {searchResults.map(result => (
                        <div key={result.id} className={styles.searchResult}>
                          <div className="row">
                            <div className="col col--8">
                              <h5>
                                <a href={result.url}>
                                  <span dangerouslySetInnerHTML={{
                                    __html: highlightText(result.title, searchQuery)
                                  }} />
                                </a>
                              </h5>
                              <p className="text--secondary">
                                <span dangerouslySetInnerHTML={{
                                  __html: highlightText(result.description, searchQuery)
                                }} />
                              </p>
                              <div className={styles.itemMeta}>
                                <span className={`badge badge--${
                                  result.type === 'documentation' ? 'primary' :
                                  result.type === 'api' ? 'success' :
                                  result.type === 'tutorial' ? 'warning' :
                                  result.type === 'component' ? 'info' : 'secondary'
                                }`}>
                                  {result.type}
                                </span>
                                <span className="text--secondary margin-left--sm">
                                  {result.category}
                                </span>
                                <span className="text--secondary margin-left--sm">
                                  Updated {result.lastUpdated.toLocaleDateString()}
                                </span>
                              </div>
                              <div className={styles.tags}>
                                {result.tags.slice(0, 4).map(tag => (
                                  <span key={tag} className={styles.tag}>
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="col col--4 text--right">
                              <div className={styles.relevanceScore}>
                                Relevance: {Math.round(result.relevanceScore)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text--center padding--lg">
                      <h5>No results found</h5>
                      <p className="text--secondary">
                        Try adjusting your search terms or filters
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="row margin-top--lg">
          <div className="col col--12">
            <div className="alert alert--info">
              <h4>🔍 Advanced Search Features</h4>
              <ul>
                <li><strong>🧠 Semantic Search:</strong> Understands context and meaning, not just keywords</li>
                <li><strong>🎯 Personalized Results:</strong> Tailored recommendations based on your role and experience</li>
                <li><strong>🏷️ Smart Filtering:</strong> Filter by content type, category, and tags</li>
                <li><strong>📊 Relevance Scoring:</strong> Results ranked by relevance and recency</li>
                <li><strong>🔗 Cross-References:</strong> Find related content across documentation types</li>
                <li><strong>📚 Learning Paths:</strong> Curated content sequences for different skill levels</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}