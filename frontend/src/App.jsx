import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Packages from './components/Packages';
import Invoices from './components/Invoices';
import Payments from './components/Payments';
import './App.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [hoveredMenu, setHoveredMenu] = useState(null);

  const menuItems = [
    { 
      id: 'dashboard', 
      icon: '📊', 
      label: 'Dashboard',
      description: 'Lihat statistik dan grafik bisnis'
    },
    { 
      id: 'customers', 
      icon: '👥', 
      label: 'Pelanggan',
      description: 'Kelola data pelanggan'
    },
    { 
      id: 'packages', 
      icon: '📦', 
      label: 'Paket Internet',
      description: 'Kelola paket layanan'
    },
    { 
      id: 'invoices', 
      icon: '🧾', 
      label: 'Invoice',
      description: 'Buat dan kelola tagihan'
    },
    { 
      id: 'payments', 
      icon: '💳', 
      label: 'Pembayaran',
      description: 'Catat pembayaran pelanggan'
    }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <Customers />;
      case 'packages':
        return <Packages />;
      case 'invoices':
        return <Invoices />;
      case 'payments':
        return <Payments />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">
          <h2>🌐 ISP Billing</h2>
          <p>Management System</p>
        </div>
        <ul className="menu">
          {menuItems.map((item) => (
            <li 
              key={item.id}
              className={activeMenu === item.id ? 'active' : ''}
              onClick={() => setActiveMenu(item.id)}
              onMouseEnter={() => setHoveredMenu(item.id)}
              onMouseLeave={() => setHoveredMenu(null)}
              style={{ position: 'relative' }}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
              
              {/* Tooltip */}
              {hoveredMenu === item.id && activeMenu !== item.id && (
                <div style={{
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  marginLeft: '12px',
                  padding: '8px 12px',
                  background: 'rgba(17, 24, 39, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(88, 101, 242, 0.3)',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  zIndex: 1000,
                  pointerEvents: 'none',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  {item.description}
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <p>© 2024 ISP Billing</p>
          <p>v1.0.0</p>
        </div>
      </nav>
      <main className="main-content">
        <header className="header">
          <h1>{menuItems.find(m => m.id === activeMenu)?.label || 'Dashboard'}</h1>
          <div className="user-info">
            <span>Admin User</span>
            <div className="avatar">A</div>
          </div>
        </header>
        <div className="content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
