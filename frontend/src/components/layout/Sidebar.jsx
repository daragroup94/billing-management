import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  CreditCard,
  Settings,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Sidebar({ activeMenu, setActiveMenu, sidebarOpen }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      toast.success('Logged out successfully');
    }
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: sidebarOpen ? 0 : -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 z-40"
    >
      <div className="flex flex-col h-full p-6">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold gradient-text">ISP Billing</h1>
          <p className="text-sm text-slate-400 mt-1">Management System</p>
        </div>

        {/* User Info */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.full_name || user?.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield size={12} className="text-blue-400" />
                <p className="text-xs text-slate-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMenu(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-300 text-left
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom Section - Settings & Logout */}
        <div className="space-y-2 pt-6 border-t border-white/10">
          {/* Settings Button */}
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveMenu('settings')}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-300 text-left
              ${activeMenu === 'settings'
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </motion.button>

          {/* Logout Button */}
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </motion.button>
        </div>

        {/* Version Info */}
        <div className="mt-4 text-center text-xs text-slate-500">
          <p>ISP Billing v2.0</p>
          <p className="mt-1">© 2025 All Rights Reserved</p>
        </div>
      </div>
    </motion.aside>
  );
}
