// App.js

import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Pages/Login/Login';
import { initAuth, getCurrentUser } from './utils/auth';

import Sidebar from './layout/Sidebar';
import Navbar from './layout/Navbar';
import DIDs from './Pages/DIDs/DIDs';
import IVRs from './Pages/DIDs/IVRs';
import DIDDestination from './Pages/DIDs/DIDDestination';
import DIDsUse from './Pages/DIDs/DIDsUse';
import QueuesMembres from './Pages/DIDs/QueuesMembres';
import QueuesDashboard from './Pages/DIDs/QueuesDashboard';
import Sda from './Pages/titleside/Sda';
import Clients from './Pages/clients/clients';
import Reports from './Pages/Reports/Reports';
import CallerID from './Pages/clients/CallerID';
import Users from './Pages/clients/Users';
import UserHistory from './Pages/clients/UserHistory';
import LiveCalls from './Pages/titleside/LiveCalls';
import SipUser from './Pages/clients/SipUser';
import Iax from './Pages/clients/Iax';
import SummaryPerDay from './Pages/Reports/SummaryPerDay';
import CDR from './Pages/Reports/CDR';
import CDRFailed from './Pages/Reports/CDRFailed';
import SummaryPerMonth from './Pages/Reports/SummaryPerMonth';
import SummaryMonthUser from './Pages/Reports/SummaryMonthUser';
import SummaryDayUser from './Pages/Reports/SummaryDayUser';
import SummaryPerTrunk from './Pages/Reports/SummaryMonthTrunk';
import SummaryMonthTrunk from './Pages/Reports/SummaryPerTrunk';
import SummaryDayTrunk from './Pages/Reports/SummaryDayTrunk';
import ReportsDestination from './Pages/Reports/ReportsDestination';
import InboundReports from './Pages/Reports/InboundReports';
import SummaryPerUser from './Pages/Reports/SummaryPerUser';
import CallArchive from './Pages/Reports/CallArchive';
import ActivityDash from './Pages/Dashboard/ActivityDash';
import RechargeHistory from './Pages/Dashboard/RechargeHistory';
import Profile from './components/UserProfile/profile';
import RestrictNumber from './Pages/clients/RestrictNumber';
import DIDHistory from './Pages/DIDs/DIDHistory';
import Refills from './Pages/Billing/Refills';
import PaymentMethods from './Pages/Billing/PaymentMethods';
import Voucher from './Pages/Billing/Voucher';
import RefillProviders from './Pages/Billing/RefillProviders';
import Plans from './Pages/Rates/Plans';
import Tariffs from './Pages/Rates/Tariffs';
import Prefixes from './Pages/Rates/Prefixes';
import UserCustomRates from './Pages/Rates/UserCustomRates';
import Offers from './Pages/Rates/offers';
import OfferCDR from './Pages/Rates/OffersCDR';
import OfferUse from './Pages/Rates/OfferUse';
import Providers from './Pages/Routes/Providers';
import TrunkGroups from './Pages/Routes/TrunkGroups';
import ProviderRates from './Pages/Routes/ProviderRates';
import Servers from './Pages/Routes/Servers';
import Trunks from './Pages/Routes/Trunks';
import TrunkErrors from './Pages/Routes/TrunkErrors';
import Queues from './Pages/DIDs/Queues';
import Dashboard from './Pages/Dashboard/Dashboard';

// Layout component to wrap authenticated pages
const Layout = ({ children, user }) => {
  return (
    <div className="d-flex flex-column vh-100">
      <Navbar username={user.username} email={user.email} />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <div className="p-4 flex-grow-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// AppContent component that uses the useNavigate hook
function AppContent() {
  const navigate = useNavigate();
  
  // Use state for authentication and user data
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  
  const [user, setUser] = useState(
    getCurrentUser() || {
      username: 'Admin',
      email: 'admin@example.com'
    }
  );
  
  // State for storing backend data
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for authentication changes
  useEffect(() => {
    // Function to handle storage events (when localStorage changes)
    const handleStorageChange = () => {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      setIsAuthenticated(authStatus);
      
      if (authStatus) {
        const updatedUser = getCurrentUser();
        if (updatedUser) {
          setUser(updatedUser);
        }
      } else {
        // If authentication status is false, redirect to login page
        navigate('/login');
      }
    };
    
    // Check auth status on mount
    handleStorageChange();
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for auth changes within the same window
    window.addEventListener('auth-change', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, [navigate]);

  // useEffect to fetch data from the backend on component mount
  useEffect(() => {
    // Skip API call if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    // Use the correct API endpoint based on the API config
    const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:5000/api';
    
    // Temporarily disable data fetching to prevent 404 errors
    setData([]);
    setLoading(false);
    
    // Uncomment this when your API endpoint is ready
    /*
    axios.get(`${apiUrl}/data`)
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data', error);
        setError('Error fetching data');
        setLoading(false);
      });
    */
  }, [isAuthenticated]);

  // Set default authorization header if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Ensure all components are properly loaded before rendering
  if (!Profile || !DIDs) {
    return <div className="container mt-5">Loading components...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <Login /> : <Navigate to="/" replace />
      } />
      
      {/* Protected routes */}
      <Route path="/" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Dashboard />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/profile" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Profile username={user.username} email={user.email} />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/Sda" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Sda />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/clients" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Clients />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/clients/caller-id" element={
        isAuthenticated ? (
          <Layout user={user}>
            <CallerID />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/clients/live-calls" element={
        isAuthenticated ? (
          <Layout user={user}>
            <LiveCalls />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/clients/Users" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Users />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/clients/RestrictNumber" element={
        isAuthenticated ? (
          <Layout user={user}>
            <RestrictNumber />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/clients/SipUser" element={
        isAuthenticated ? (
          <Layout user={user}>
            <SipUser />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/clients/Iax" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Iax />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/reports" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Reports />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/reports/summary-day" element={
        isAuthenticated ? (
          <Layout user={user}>
            <SummaryPerDay />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/reports/summaryperuser" element={
        isAuthenticated ? (
          <Layout user={user}>
            <SummaryPerUser />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      {/* <Route path="/reports/summarypertrunk" element={
        isAuthenticated ? (
          <Layout user={user}>
            <SummaryPerTrunk />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } /> */}
      
      <Route path="/reports/CDR" element={
        isAuthenticated ? (
          <Layout user={user}>
            <CDR />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/reports/CDRFailed" element={
        isAuthenticated ? (
          <Layout user={user}>
            <CDRFailed />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      {/* <Route path="/reports/summaryMonthTrunk" element={
        isAuthenticated ? (
          <Layout user={user}>
            <SummaryMonthTrunk />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } /> */}
      
      <Route path="/DIDs" element={
        isAuthenticated ? (
          <Layout user={user}>
            <DIDs />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/DIDs/IVRs" element={
        isAuthenticated ? (
          <Layout user={user}>
            <IVRs />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/DIDs/DIDDestination" element={
        isAuthenticated ? (
          <Layout user={user}>
            <DIDDestination />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/DIDs/DIDsUse" element={
        isAuthenticated ? (
          <Layout user={user}>
            <DIDsUse />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/DIDs/Queues" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Queues/>
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/DIDs/QueuesMembres" element={
        isAuthenticated ? (
          <Layout user={user}>
            <QueuesMembres />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Billing/Refills" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Refills />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Billing/PaymentMethods" element={
        isAuthenticated ? (
          <Layout user={user}>
            <PaymentMethods />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Billing/Voucher" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Voucher />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Billing/RefillProviders" element={
        isAuthenticated ? (
          <Layout user={user}>
            <RefillProviders />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Rates/Plans" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Plans />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Rates/Tariffs" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Tariffs />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Rates/Prefixes" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Prefixes />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Rates/UserCustomRates" element={
        isAuthenticated ? (
          <Layout user={user}>
            <UserCustomRates />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/reports/summary-month" element={
        isAuthenticated ? (
          <Layout user={user}>
            <SummaryPerMonth />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />


<Route path="/reports/SummarymonthUser" element={
        isAuthenticated ? (
          <Layout user={user}>
            <SummaryMonthUser />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/reports/SummaryDayUser" element={
        isAuthenticated ? (
          <Layout user={user}>
            <SummaryDayUser />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Routes/Providers" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Providers />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Routes/Trunks" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Trunks />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Routes/TrunkGroups" element={
        isAuthenticated ? (
          <Layout user={user}>
            <TrunkGroups />
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Routes/ProviderRates" element={
        isAuthenticated ? (
          <Layout user={user}>
            <ProviderRates/>
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

<Route path="/Routes/Servers" element={
        isAuthenticated ? (
          <Layout user={user}>
            <Servers/>
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      


      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

    
  );
}

// Main App component
function App() {
  // Initialize authentication state
  initAuth();
  
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
