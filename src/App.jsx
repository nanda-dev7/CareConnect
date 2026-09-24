import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import ToastContainer from './components/common/Toast';
import NotificationsDrawer from './components/common/NotificationsDrawer';
import AuthModal from './components/auth/AuthModal';

import ExploreServices from './pages/ExploreServices';
import AiServiceBooking from './pages/AiServiceBooking';
import CustomerBookings from './pages/CustomerBookings';
import ProviderJobs from './pages/ProviderJobs';
import ProviderSchedule from './pages/ProviderSchedule';
import AdminDashboard from './pages/AdminDashboard';
import OperationsDashboard from './pages/OperationsDashboard';
import SupportDashboard from './pages/SupportDashboard';

function MainApp() {
  const [activeTab, setActiveTab] = useState('explore');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState(null);

  const handleOpenAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleBookCategory = (catId = null) => {
    setPreselectedCategory(catId);
    setActiveTab('ai-request');
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuthModal={handleOpenAuthModal}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'explore' && (
          <ExploreServices onBookCategory={handleBookCategory} />
        )}

        {activeTab === 'ai-request' && (
          <AiServiceBooking
            initialCategoryId={preselectedCategory}
            onOpenAuthModal={handleOpenAuthModal}
            onViewBookings={() => setActiveTab('customer-bookings')}
          />
        )}

        {activeTab === 'customer-bookings' && <CustomerBookings />}

        {(activeTab === 'provider-feed' || activeTab === 'provider-jobs') && (
          <ProviderJobs />
        )}

        {activeTab === 'provider-schedule' && <ProviderSchedule />}

        {(activeTab === 'admin-dashboard' || activeTab === 'admin-verifications' || activeTab === 'admin-audit') && (
          <AdminDashboard />
        )}

        {activeTab === 'operations-dashboard' && <OperationsDashboard />}

        {activeTab === 'support-dashboard' && <SupportDashboard />}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        marginTop: '40px'
      }}>
        © 2026 CareConnect Platform • AI-Enabled Home Services Booking & Operations
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
