import React, { useState, useEffect } from 'react';
import { FiSearch, FiShoppingCart, FiHeart, FiFilter, FiChevronDown, FiChevronUp, FiX, FiShare2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { products as initialProducts } from '../data/products';
import Chatbot from '../components/Chatbot';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  getPersonalizedRecommendations, 
  getTrendingProducts,
  updateUserPreferences 
} from '../services/RecommendationService';

const Shop = () => {
  const navigate = useNavigate();
  const { addToCart, addToWishlist, cart, wishlist, user } = useAuth();
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceRange: 'all',
    size: 'all',
    category: 'all',
    sortBy: 'featured'
  });
  // Add pending state for filters and search
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [pendingSearchQuery, setPendingSearchQuery] = useState(searchQuery);
  const [showChatbot, setShowChatbot] = useState(true);
  const [highlightedProducts, setHighlightedProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [viewStartTime, setViewStartTime] = useState(null);

  // Update filteredProducts to use filters/searchQuery (not pending)
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPrice = filters.priceRange === 'all' || 
        (filters.priceRange === 'under50' && product.price < 50) ||
        (filters.priceRange === '50to100' && product.price >= 50 && product.price <= 100) ||
        (filters.priceRange === 'over100' && product.price > 100);
      const matchesSize = filters.size === 'all' || product.size === filters.size;
      const matchesCategory = filters.category === 'all' || product.category === filters.category;
      const matchesHighlighted = !showOnlyHighlighted || highlightedProducts.includes(product.id);
      
      return matchesSearch && matchesPrice && matchesSize && matchesCategory && matchesHighlighted;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  useEffect(() => {
    // Load initial recommendations
    setRecommendedProducts(getPersonalizedRecommendations(4));
    setTrendingProducts(getTrendingProducts(4));
  }, []);

  // Track product view duration
  useEffect(() => {
    if (selectedProduct) {
      setViewStartTime(Date.now());
      updateUserPreferences(selectedProduct, 'view');
    } else if (viewStartTime) {
      const duration = (Date.now() - viewStartTime) / 1000;
      if (selectedProduct) {
        updateUserPreferences(selectedProduct, 'view', duration);
      }
    }
  }, [selectedProduct]);

  const handleProductRecommendation = (products) => {
    setHighlightedProducts(products);
    setShowOnlyHighlighted(true);
    // Update recommendations based on chatbot interaction
    setRecommendedProducts(getPersonalizedRecommendations(4));
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    updateUserPreferences(product, 'addToCart');
    // Update recommendations after user action
    setRecommendedProducts(getPersonalizedRecommendations(4));
  };

  const handleAddToWishlist = (product) => {
    addToWishlist(product);
    updateUserPreferences(product, 'addToWishlist');
    // Update recommendations after user action
    setRecommendedProducts(getPersonalizedRecommendations(4));
  };

  const getProductCount = (category) => {
    return products.filter(p => p.category === category).length;
  };

  const clearFilters = () => {
    setFilters({
      priceRange: 'all',
      size: 'all',
      category: 'all',
      sortBy: 'featured'
    });
    setSearchQuery('');
    setPendingFilters({
      priceRange: 'all',
      size: 'all',
      category: 'all',
      sortBy: 'featured'
    });
    setPendingSearchQuery('');
    setShowOnlyHighlighted(false);
    setHighlightedProducts([]);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    updateUserPreferences(product, 'view');
  };

  const handleCloseProductModal = () => {
    setSelectedProduct(null);
  };

  // Add a new section for personalized recommendations
  const renderRecommendedSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h2 className="text-2xl font-bold mb-4">Recommended for You</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recommendedProducts.map((product) => (
          <motion.div
            key={product.id}
            className="relative group"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transform transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddToCart(product)}
                  className="p-2 bg-white rounded-full text-gray-800 hover:text-blue-600"
                >
                  <FiShoppingCart />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddToWishlist(product)}
                  className="p-2 bg-white rounded-full text-gray-800 hover:text-red-600"
                >
                  <FiHeart />
                </motion.button>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              <p className="text-gray-500">${product.price}</p>
              {product.score && (
                <div className="mt-1 flex items-center">
                  <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, product.score * 20)}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {Math.round(product.score * 20)}% match
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Add a new section for trending products
  const renderTrendingSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {trendingProducts.map((product) => (
          <motion.div
            key={product.id}
            className="relative group"
            whileHover={{ scale: 1.02 }}
          >
            {/* Similar structure to recommended products */}
            <div className="relative aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transform transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddToCart(product)}
                  className="p-2 bg-white rounded-full text-gray-800 hover:text-blue-600"
                >
                  <FiShoppingCart />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAddToWishlist(product)}
                  className="p-2 bg-white rounded-full text-gray-800 hover:text-red-600"
                >
                  <FiHeart />
                </motion.button>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              <p className="text-gray-500">${product.price}</p>
              {product.trendScore && (
                <div className="mt-1 flex items-center">
                  <span className="text-sm text-orange-600 font-medium">
                    🔥 Trending
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50"
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md shadow-md sticky top-16 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <motion.div 
              className="relative flex-1"
              whileHover={{ scale: 1.01 }}
            >
              <input
                type="text"
                value={pendingSearchQuery}
                onChange={e => setPendingSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring-blue-400 bg-white/50 backdrop-blur-sm px-4 py-2 mb-4"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </motion.div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/80 transition-colors border border-gray-200"
              >
                <FiFilter />
                <span>Filters</span>
                {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChatbot(!showChatbot)}
                className="px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors shadow-lg"
              >
                Chat with Assistant
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/tryon')}
                className="px-4 py-2 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-lg hover:from-pink-500 hover:to-red-500 transition-colors shadow-lg"
              >
                Virtual Try-On
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="md:w-64 bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold flex items-center text-gray-800">
                    <FiFilter className="mr-2" />
                    Filters
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearFilters}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Clear All
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      className="w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring-blue-400 bg-white/50 backdrop-blur-sm"
                      value={pendingFilters.sortBy}
                      onChange={(e) => setPendingFilters(f => ({ ...f, sortBy: e.target.value }))}
                    >
                      <option value="featured">Featured</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <select
                      className="w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring-blue-400 bg-white/50 backdrop-blur-sm"
                      value={pendingFilters.priceRange}
                      onChange={(e) => setPendingFilters(f => ({ ...f, priceRange: e.target.value }))}
                    >
                      <option value="all">All Prices</option>
                      <option value="under50">Under $50</option>
                      <option value="50to100">$50 - $100</option>
                      <option value="over100">Over $100</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                    <select
                      className="w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring-blue-400 bg-white/50 backdrop-blur-sm"
                      value={pendingFilters.size}
                      onChange={(e) => setPendingFilters(f => ({ ...f, size: e.target.value }))}
                    >
                      <option value="all">All Sizes</option>
                      <option value="S">Small</option>
                      <option value="M">Medium</option>
                      <option value="L">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      className="w-full rounded-md border-gray-200 shadow-sm focus:border-blue-400 focus:ring-blue-400 bg-white/50 backdrop-blur-sm"
                      value={pendingFilters.category}
                      onChange={(e) => setPendingFilters(f => ({ ...f, category: e.target.value }))}
                    >
                      <option value="all">All Categories ({products.length})</option>
                      <option value="Dresses">Dresses ({getProductCount('Dresses')})</option>
                      <option value="Tops">Tops ({getProductCount('Tops')})</option>
                      <option value="Bottoms">Bottoms ({getProductCount('Bottoms')})</option>
                      <option value="Outerwear">Outerwear ({getProductCount('Outerwear')})</option>
                    </select>
                  </div>

                  {highlightedProducts.length > 0 && (
                    <div className="pt-4 border-t">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showOnlyHighlighted}
                          onChange={(e) => setShowOnlyHighlighted(e.target.checked)}
                          className="rounded text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Show only recommended items</span>
                      </label>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setFilters(pendingFilters);
                      setSearchQuery(pendingSearchQuery);
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    disabled={JSON.stringify(filters) === JSON.stringify(pendingFilters) && searchQuery === pendingSearchQuery}
                  >
                    Apply Filters
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1">
            <AnimatePresence>
              {highlightedProducts.length > 0 && showOnlyHighlighted && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-4 p-4 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-lg flex items-center justify-between backdrop-blur-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <span className="text-blue-600 font-medium">Showing recommended items</span>
                    <span className="ml-2 text-sm text-gray-500">({filteredProducts.length} items)</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowOnlyHighlighted(false)}
                    className="text-blue-500 hover:text-blue-600 flex items-center"
                  >
                    <FiX className="mr-1" />
                    Clear
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add recommendation sections before the main product grid */}
            {!showOnlyHighlighted && (
              <>
                {renderRecommendedSection()}
                {renderTrendingSection()}
              </>
            )}

            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden transition-all duration-300 border border-gray-200 ${
                      highlightedProducts.includes(product.id)
                        ? 'ring-2 ring-blue-400 transform scale-105'
                        : 'hover:shadow-lg'
                    }`}
                    onClick={() => handleProductClick(product)}
                  >
                    <motion.div 
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-64 object-cover"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToWishlist(product);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full ${
                          wishlist.some(item => item.id === product.id)
                            ? 'bg-red-400 text-white'
                            : 'bg-white/80 text-gray-700 hover:bg-red-400 hover:text-white'
                        } transition-colors`}
                      >
                        <FiHeart />
                      </motion.button>
                    </motion.div>
                    <motion.div 
                      className="p-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                      <p className="text-blue-500 font-medium">${product.price}</p>
                      <p className="text-sm text-gray-600">Size: {product.size}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                      <motion.div 
                        className="mt-4 flex space-x-2"
                        whileHover={{ scale: 1.02 }}
                      >
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className="flex-1 bg-gradient-to-r from-blue-400 to-purple-400 text-white py-2 rounded hover:from-blue-500 hover:to-purple-500 transition-colors shadow-lg"
                        >
                          Add to Cart
                        </motion.button>
                      </motion.div>
                      <motion.div 
                        className="mt-2 flex flex-wrap gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {product.tags.map((tag, index) => (
                          <motion.span
                            key={`${product.id}-tag-${index}-${tag}`}
                            className="px-2 py-1 bg-gray-100/50 backdrop-blur-sm text-gray-600 text-xs rounded-full border border-gray-200"
                            whileHover={{ scale: 1.1 }}
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Product Description Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseProductModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                <div className="relative">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-[500px] object-cover rounded-lg"
                  />
                  {selectedProduct.tag && (
                    <div className="absolute top-4 left-4 bg-white px-3 py-1 text-xs font-semibold rounded-full">
                      {selectedProduct.tag}
                    </div>
                  )}
                  {selectedProduct.discount && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                      {selectedProduct.discount}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h2>
                  <p className="text-2xl font-semibold text-blue-500 mb-4">${selectedProduct.price}</p>
                  <p className="text-gray-600 mb-6">{selectedProduct.description}</p>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Size</h3>
                    <div className="flex gap-2">
                      {['S', 'M', 'L', 'XL'].map((size) => (
                        <button
                          key={size}
                          className={`px-4 py-2 border rounded-lg ${
                            selectedProduct.size === size
                              ? 'border-blue-500 bg-blue-50 text-blue-500'
                              : 'border-gray-200 hover:border-blue-500'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                        {/* too much hassle */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Quantity</h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="text-lg font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <button
                      onClick={() => {
                        handleAddToCart({ ...selectedProduct, quantity });
                        handleCloseProductModal();
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-400 to-purple-400 text-white py-3 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors flex items-center justify-center"
                    >
                      <FiShoppingCart className="mr-2" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        handleAddToWishlist(selectedProduct);
                        handleCloseProductModal();
                      }}
                      className={`p-3 rounded-lg border ${
                        wishlist.some(item => item.id === selectedProduct.id)
                          ? 'border-red-500 text-red-500'
                          : 'border-gray-200 hover:border-red-500 hover:text-red-500'
                      }`}
                    >
                      <FiHeart />
                    </button>
                    <button className="p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:text-blue-500">
                      <FiShare2 />
                    </button>
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tags.map((tag, index) => (
                        <span
                          key={`${selectedProduct.id}-tag-${index}-${tag}`}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showChatbot && (
        <Chatbot
          products={products}
          onProductRecommend={handleProductRecommendation}
          cartItems={cart}
          wishlistItems={wishlist}
          userProfile={user}
          handlers={{
            onAddToCart: handleAddToCart,
            onAddToWishlist: handleAddToWishlist
          }}
        />
      )}
    </motion.div>
  );
};

export default Shop;
