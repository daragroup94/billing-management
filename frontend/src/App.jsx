import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Packages from './components/Packages';
import Invoices from './components/Invoices';
import Payments from './components/Payments';
import './App.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

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
          <li 
            className={activeMenu === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveMenu('dashboard')}
          >
            <span className="icon">📊</span>
            <span>Dashboard</span>
          </li>
          <li 
            className={activeMenu === 'customers' ? 'active' : ''}
            onClick={() => setActiveMenu('customers')}
          >
            <span className="icon">👥</span>
            <span>Pelanggan</span>
          </li>
          <li 
            className={activeMenu === 'packages' ? 'active' : ''}
            onClick={() => setActiveMenu('packages')}
          >
            <span className="icon">📦</span>
            <span>Paket Internet</span>
          </li>
          <li 
            className={activeMenu === 'invoices' ? 'active' : ''}
            onClick={() => setActiveMenu('invoices')}
          >
            <span className="icon">🧾</span>
            <span>Invoice</span>
          </li>
          <li 
            className={activeMenu === 'payments' ? 'active' : ''}
            onClick={() => setActiveMenu('payments')}
          >
            <span className="icon">💳</span>
            <span>Pembayaran</span>
          </li>
        </ul>
        <div className="sidebar-footer">
          <p>© 2024 ISP Billing</p>
          <p>v1.0.0</p>
        </div>
      </nav>
      <main className="main-content">
        <header className="header">
          <h1>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}</h1>
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
