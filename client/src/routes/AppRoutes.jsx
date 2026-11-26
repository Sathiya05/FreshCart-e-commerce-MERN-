import { lazy, Suspense } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import AdminRoute from '../layouts/AdminRoute.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import CustomerLayout from '../layouts/CustomerLayout.jsx'
import ProtectedRoute from '../layouts/ProtectedRoute.jsx'

const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage.jsx'))
const AdminCouponsPage = lazy(() => import('../pages/admin/AdminCouponsPage.jsx'))
const AdminCustomersPage = lazy(() => import('../pages/admin/AdminCustomersPage.jsx'))
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage.jsx'))
const AdminInventoryPage = lazy(() => import('../pages/admin/AdminInventoryPage.jsx'))
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage.jsx'))
const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage.jsx'))
const AdminReviewsPage = lazy(() => import('../pages/admin/AdminReviewsPage.jsx'))
const AdminSalesReportsPage = lazy(() => import('../pages/admin/AdminSalesReportsPage.jsx'))
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage.jsx'))
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx'
import LoginPage from '../pages/auth/LoginPage.jsx'
import RegisterPage from '../pages/auth/RegisterPage.jsx'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx'
import AboutUsPage from '../pages/customer/AboutUsPage.jsx'
import CartPage from '../pages/customer/CartPage.jsx'
import CategoriesPage from '../pages/customer/CategoriesPage.jsx'
import CategoryProductsPage from '../pages/customer/CategoryProductsPage.jsx'
import CheckoutPage from '../pages/customer/CheckoutPage.jsx'
import ContactUsPage from '../pages/customer/ContactUsPage.jsx'
import FAQPage from '../pages/customer/FAQPage.jsx'
import HomePage from '../pages/customer/HomePage.jsx'
import ManageAddressesPage from '../pages/customer/ManageAddressesPage.jsx'
import MyOrdersPage from '../pages/customer/MyOrdersPage.jsx'
import MyProfilePage from '../pages/customer/MyProfilePage.jsx'
import NotFoundPage from '../pages/customer/NotFoundPage.jsx'
import OrderConfirmationPage from '../pages/customer/OrderConfirmationPage.jsx'
import OrderDetailsPage from '../pages/customer/OrderDetailsPage.jsx'
import OrderTrackingPage from '../pages/customer/OrderTrackingPage.jsx'
import PaymentFailurePage from '../pages/customer/PaymentFailurePage.jsx'
import PaymentSuccessPage from '../pages/customer/PaymentSuccessPage.jsx'
import PrivacyPolicyPage from '../pages/customer/PrivacyPolicyPage.jsx'
import ProductDetailsPage from '../pages/customer/ProductDetailsPage.jsx'
import SearchResultsPage from '../pages/customer/SearchResultsPage.jsx'
import ShopPage from '../pages/customer/ShopPage.jsx'
import TermsConditionsPage from '../pages/customer/TermsConditionsPage.jsx'
import WishlistPage from '../pages/customer/WishlistPage.jsx'

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-app-background text-text-secondary" role="status">
          <LoaderCircle className="mr-2 animate-spin text-brand-primary" size={20} aria-hidden="true" />
          Loading…
        </div>
      }
    >
      <ErrorBoundary>
        <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/:slug" element={<CategoryProductsPage />} />
        <Route path="search" element={<SearchResultsPage />} />
        <Route path="products/:id" element={<ProductDetailsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route
          path="checkout"
          element={
            <ProtectedRoute roles={['customer']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payment/success"
          element={
            <ProtectedRoute roles={['customer']}>
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payment/failure"
          element={
            <ProtectedRoute roles={['customer']}>
              <PaymentFailurePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="order-confirmation/:id"
          element={
            <ProtectedRoute roles={['customer']}>
              <OrderConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route path="about" element={<AboutUsPage />} />
        <Route path="contact" element={<ContactUsPage />} />
        <Route path="faq" element={<FAQPage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsConditionsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      <Route
        path="account"
        element={
          <ProtectedRoute roles={['customer']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/account/profile" replace />} />
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="addresses" element={<ManageAddressesPage />} />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="orders/:id/track" element={<OrderTrackingPage />} />
      </Route>

      <Route
        path="admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="reports" element={<AdminSalesReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
        </Routes>
      </ErrorBoundary>
    </Suspense>
  )
}
