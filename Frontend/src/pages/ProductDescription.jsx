import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiHeart, FiShare2, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { products } from '../data/products';
import axios from 'axios';

const ProductDescription = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, cart, wishlist } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const fetchSimilarProducts = async (imageUrl) => {
    const encodedParams = new URLSearchParams();
    encodedParams.set('url', imageUrl);

    const options = {
      method: 'POST',
      url: 'https://similar-clothes-ai.p.rapidapi.com/',
      headers: {
        'x-rapidapi-key': '07fe85ef41msha707d181c6dfa9ep1e32a3jsne0216f14b61e',
        'x-rapidapi-host': 'similar-clothes-ai.p.rapidapi.com',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: encodedParams,
    };

    try {
      setLoadingSimilar(true);
      console.log('Fetching similar products for image:', imageUrl);
      const response = await axios.request(options);
      console.log('API Response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setSimilarProducts(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setSimilarProducts([]);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error.response || error);
      setSimilarProducts([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  useEffect(() => {
    const foundProduct = products.find(p => p.id === parseInt(id));
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedSize(foundProduct.size);
      // Fetch similar products when product is found
      fetchSimilarProducts(foundProduct.image);
    }
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Product not found</h2>
          <button
            onClick={() => navigate('/shop')}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
  };

  const handleAddToWishlist = () => {
    addToWishlist(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12"
    >
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-8"
        >
          <FiArrowLeft className="mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="relative"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-[600px] object-cover rounded-lg"
              />
              {product.tag && (
                <div className="absolute top-4 left-4 bg-white px-3 py-1 text-xs font-semibold rounded-full">
                  {product.tag}
                </div>
              )}
              {product.discount && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                  {product.discount}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex flex-col"
            >
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
              <p className="text-2xl font-semibold text-blue-500 mb-6">${product.price}</p>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Size</h3>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg ${
                        selectedSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-500'
                          : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

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
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-blue-400 to-purple-400 text-white py-3 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors flex items-center justify-center"
                >
                  <FiShoppingCart className="mr-2" />
                  Add to Cart
                </button>
                <button
                  onClick={handleAddToWishlist}
                  className={`p-3 rounded-lg border ${
                    wishlist.some(item => item.id === product.id)
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
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

       
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Similar Products</h2>
          {loadingSimilar ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : similarProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <img
                    src={similarProduct.image_url}
                    alt={similarProduct.title || 'Similar product'}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {similarProduct.title || 'Similar Product'}
                    </h3>
                    {similarProduct.price && (
                      <p className="text-blue-500 font-medium">${similarProduct.price}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center">No similar products found</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDescription; 