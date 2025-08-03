import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Product } from '../types';
import { productsAPI } from '../utils/api';
import { formatCurrency, getImageUrl, calculateDiscountPercentage } from '../utils/helpers';
import { useCart } from '../hooks/useCart';
import Button from '../components/common/Button';
import { ProductCardSkeleton } from '../components/common/Loading';
import ProductReviews from '../components/product/ProductReviews';
import { toast } from 'react-hot-toast';

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart, isLoading: cartLoading } = useCart();

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      if (slug) {
        // Use getById for slug-based requests (backend handles both ID and slug)
        const response = await productsAPI.getById(slug);
        
        // Extract the actual product data from the nested response structure
        const rawProductData = response.data.data || response.data;
        
        // Convert string values to numbers for proper display
        const productData = {
          ...rawProductData,
          price: parseFloat(rawProductData.price) || 0,
          salePrice: rawProductData.salePrice ? parseFloat(rawProductData.salePrice) : undefined,
          averageRating: parseFloat(rawProductData.averageRating) || 0,
          // Ensure images is properly formatted
          images: Array.isArray(rawProductData.images) ? rawProductData.images : []
        };
        setProduct(productData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        await addToCart(product.id, quantity);
        toast.success('Item added to cart');
      } catch (error) {
        console.error('Add to cart error:', error);
        toast.error('Failed to add item to cart');
      }
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist API call
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className={`h-5 w-5 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">{error || 'The product you are looking for does not exist.'}</p>
            <Button onClick={() => navigate('/products')}>Back to Products</Button>
          </div>
        </div>
      </div>
    );
  }

  const discountPercentage = product.salePrice
    ? calculateDiscountPercentage(product.price, product.salePrice)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-all duration-200 ease-out"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              className="aspect-square bg-white rounded-lg overflow-hidden shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <img
                src={getImageUrl(product.images?.[selectedImage] || '', 'large')}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ease-out transform hover:scale-105 ${
                      selectedImage === index
                        ? 'border-primary-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getImageUrl(image, 'small')}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            <p className="text-sm text-gray-500 uppercase tracking-wide">
              {product.category?.name || 'Uncategorized'}
            </p>

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex">{renderStars(product.averageRating || 0)}</div>
              <span className="text-sm text-gray-600">
                ({product.reviewCount || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(product.salePrice || product.price)}
              </span>
              {product.salePrice && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-semibold">
                    -{discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              {product.stock > 0 ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">
                    In Stock ({product.stock} available)
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition-all duration-200 ease-out transform hover:scale-105 disabled:hover:scale-100"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100 transition-all duration-200 ease-out transform hover:scale-105 disabled:hover:scale-100"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || cartLoading}
                  loading={cartLoading}
                  icon={<ShoppingCartIcon className="h-5 w-5" />}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
                <button
                  onClick={handleWishlistToggle}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 ease-out transform hover:scale-105"
                >
                  {isWishlisted ? (
                    <HeartSolidIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <TruckIcon className="h-6 w-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Free Shipping</p>
                    <p className="text-sm text-gray-600">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Secure Payment</p>
                    <p className="text-sm text-gray-600">100% secure payment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews Section */}
        <div className="mt-16">
          <ProductReviews
            productId={product.id}
            averageRating={product.averageRating || 0}
            reviewCount={product.reviewCount || 0}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;