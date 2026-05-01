import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Truck, LayoutDashboard, PlusCircle, Search, Bell, LogOut, Settings, BarChart2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SalesPage from './pages/SalesPage';
import WarehousePage from './pages/WarehousePage';
import DispatchPage from './pages/DispatchPage';
import AdminDashboard from './pages/AdminDashboard';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import JourneyModal from './components/JourneyModal';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPOJourney, setSelectedPOJourney] = useState(null);
  const [journeyData, setJourneyData] = useState(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const poNo = searchQuery.trim();
      setSelectedPOJourney(poNo);
      setJourneyLoading(true);
      try {
        const { data } = await axios.get(`http://localhost:5000/api/orders/journey/${poNo}`);
        setJourneyData(data);
      } catch (error) {
        console.error('Error fetching PO journey', error);
        setJourneyData(null);
      } finally {
        setJourneyLoading(false);
      }
    }
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const getDefaultRoute = () => {
    switch(user.role) {
      case 'Admin': return '/admin';
      case 'Sales': return '/sales';
      case 'Warehouse': return '/warehouse';
      case 'Dispatch': return '/dispatch';
      default: return '/login';
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="flex items-center gap-sm">
            <div style={{ padding: '2px' }}>
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" rx="20" fill="#5E17EB" />
                <path d="M35 30H50C63.8071 30 75 41.1929 75 55C75 68.8071 63.8071 80 50 80H35V30Z" stroke="white" strokeWidth="8" />
                <circle cx="50" cy="55" r="8" fill="white" fillOpacity="0.5" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Derma Touch</h2>
              <p style={{ fontSize: '0.7rem', opacity: 0.8, margin: 0 }}>{user.role} Portal</p>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {user.role === 'Admin' && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
          )}
          {(user.role === 'Admin' || user.role === 'Sales') && (
            <NavLink to="/sales" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <PlusCircle size={20} /> Sales
            </NavLink>
          )}
          {(user.role === 'Admin' || user.role === 'Warehouse') && (
            <NavLink to="/warehouse" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Package size={20} /> Warehouse
            </NavLink>
          )}
          {(user.role === 'Admin' || user.role === 'Dispatch') && (
            <NavLink to="/dispatch" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Truck size={20} /> Dispatch
            </NavLink>
          )}
          {user.role === 'Admin' && (
            <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <BarChart2 size={20} /> Reports
            </NavLink>
          )}
        </nav>
        
        <div className="sidebar-footer">
          <a href="#" className="nav-item" style={{ padding: '8px 0' }}><Settings size={18} /> Settings</a>
          <button onClick={logout} className="nav-item logout-btn" style={{ padding: '8px 0', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <div className="header-left">
            <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: 'var(--primary-color)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
                  <path d="M35 30H50C63.8071 30 75 41.1929 75 55C75 68.8071 63.8071 80 50 80H35V30Z" stroke="white" strokeWidth="12" />
                </svg>
              </div>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.02em' }}>Derma Touch</span>
            </div>
            <div className="search-bar" style={{ display: window.innerWidth < 768 ? 'none' : 'flex' }}>
              <Search size={18} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search orders..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>
          
          <div className="header-right">
            <div style={{ position: 'relative' }}>
              <button 
                className="icon-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ 
                  padding: '10px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <Bell size={20} color="#64748b" />
                <span style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '8px', 
                  width: '10px', 
                  height: '10px', 
                  backgroundColor: '#f1416c', 
                  borderRadius: '50%', 
                  border: '2px solid white',
                }}></span>
              </button>
              
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '10px',
                  width: '280px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  border: '1px solid #f1f5f9',
                  padding: '16px',
                  zIndex: 1000
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>Notifications</h4>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>
                    No new notifications
                  </div>
                </div>
              )}
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 8px' }}></div>
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 8px' }}>
               <div style={{ textAlign: 'right' }}>
                 <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>{user.role}</span>
               </div>
               <div className="profile-pic" style={{ 
                 width: '36px', 
                 height: '36px', 
                 borderRadius: '10px', 
                 backgroundColor: 'var(--primary-color)', 
                 color: 'white', 
                 fontSize: '0.9rem', 
                 fontWeight: 700,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
               }}>
                 {user.role.charAt(0)}
               </div>
            </div>
          </div>
        </header>
        
        <main className="page-container">
          <Routes>
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute allowedRoles={['Admin', 'Sales']}><SalesPage /></ProtectedRoute>} />
            <Route path="/warehouse" element={<ProtectedRoute allowedRoles={['Admin', 'Warehouse']}><WarehousePage /></ProtectedRoute>} />
            <Route path="/dispatch" element={<ProtectedRoute allowedRoles={['Admin', 'Dispatch']}><DispatchPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['Admin']}><ReportsPage /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
            <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
          </Routes>
        </main>
      </div>

      <JourneyModal 
        selectedPOJourney={selectedPOJourney}
        journeyData={journeyData}
        journeyLoading={journeyLoading}
        onClose={() => { setSelectedPOJourney(null); setJourneyData(null); }}
      />

      <nav className="mobile-nav">
        {user.role === 'Admin' && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <LayoutDashboard size={20} />
            <span>Dash</span>
          </NavLink>
        )}
        {(user.role === 'Admin' || user.role === 'Sales') && (
          <NavLink to="/sales" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <PlusCircle size={20} />
            <span>Sales</span>
          </NavLink>
        )}
        {(user.role === 'Admin' || user.role === 'Warehouse') && (
          <NavLink to="/warehouse" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <Package size={20} />
            <span>Stock</span>
          </NavLink>
        )}
        {(user.role === 'Admin' || user.role === 'Dispatch') && (
          <NavLink to="/dispatch" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <Truck size={20} />
            <span>Ship</span>
          </NavLink>
        )}
        {user.role === 'Admin' && (
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <BarChart2 size={20} />
            <span>Stats</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
