import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { AdminAuthProvider, useAdminAuth } from './hooks/useAdminAuth';

import { CartProvider } from './hooks/useCart';
import { WishlistProvider } from './hooks/useWishlist';
import { useMaintenanceMode } from './hooks/useMaintenanceMode';
import { useFavicon } from './hooks/useFavicon';
import MaintenanceMode from './components/MaintenanceMode';
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';
import ScrollToTop from './components/common/ScrollToTop';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';

import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Search from './pages/Search';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';

import AdminCategories from './pages/admin/Categories';
import AdminReviews from './pages/admin/Reviews';
import AdminContacts from './pages/admin/Contacts';
import AdminNewsletter from './pages/admin/Newsletter';
import AdminSettings from './pages/admin/Settings';
import AdminLogin from './pages/AdminLogin';
import AdminForgotPassword from './pages/AdminForgotPassword';
import AdminResetPassword from './pages/AdminResetPassword';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

import Returns from './pages/Returns';
import RefundPolicy from './pages/RefundPolicy';



import NotFound from './pages/NotFound';

import './index.css';

function AppContent() {
  const { admin } = useAdminAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Initialize favicon loading
  useFavicon();
  
  // Add debugging for admin status
  console.log('[App] Admin status check:', {
    admin: !!admin,
    isAdminRoute,
    pathname: location.pathname,
    port: window.location.port,
    adminToken: !!localStorage.getItem('adminToken'),
    timestamp: new Date().toISOString()
  });
  
  const { isMaintenanceMode, isLoading, retryCheck } = useMaintenanceMode(!!admin || isAdminRoute);

  // Show loading while checking maintenance mode
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show maintenance mode if enabled (but not for admin routes)
  if (isMaintenanceMode && !isAdminRoute) {
    return <MaintenanceMode onRetry={retryCheck} />;
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <>
      <ScrollToTop />
      <Routes>
        {/* Admin Login Routes - Outside of AdminLayout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        

        
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/products" element={<AdminProducts />} />
              <Route path="/orders" element={<AdminOrders />} />
              <Route path="/users" element={<AdminUsers />} />

              <Route path="/categories" element={<AdminCategories />} />
              <Route path="/reviews" element={<AdminReviews />} />
              <Route path="/contacts" element={<AdminContacts />} />
              <Route path="/newsletter" element={<AdminNewsletter />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Routes>
          </AdminLayout>
        } />
        
        {/* Public Routes */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/search" element={<Search />} />
              {/* Category routes - these will show filtered products */}
              <Route path="/categories/:slug" element={<Products />} />
              {/* Information Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />

              <Route path="/returns" element={<Returns />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/refund" element={<RefundPolicy />} />
              

              {/* Catch-all route for 404 errors */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        } />
        </Routes>
      </>
      </WishlistProvider>
    </CartProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>

          <Router>
            <AppContent />
          <Toaster
            position="top-right"
            containerStyle={{
              top: 20,
              right: 20,
              zIndex: 9999,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                maxWidth: '350px',
                zIndex: 9999,
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          </Router>

      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;