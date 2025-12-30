import { motion } from 'framer-motion';
import { Bell, Search, Settings, User, Menu } from 'lucide-react';

const Header = ({ activeMenu, sidebarOpen, setSidebarOpen }) => {
  const menuTitles = {
    dashboard: 'Dashboard',
    customers: 'Data Pelanggan',
    packages: 'Paket Internet',
    invoices: 'Invoice',
    payments: 'Pembayaran'
  };

  return (
    <header className="sticky top-0 z-40 glass backdrop-blur-2xl border-b border-white/10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 
                       text-slate-400 hover:text-white transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title */}
            <div>
              <motion.h1
                key={activeMenu}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold gradient-text"
              >
                {menuTitles[activeMenu]}
              </motion.h1>
              <p className="text-sm text-slate-400 mt-1">
                {new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Search - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl
                          bg-white/5 border border-white/10 hover:border-white/20
                          transition-all duration-300 group">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-white
                         placeholder-slate-500 w-40 lg:w-64"
              />
              <kbd className="hidden lg:inline-block px-2 py-1 text-xs font-semibold text-slate-400 
                           bg-white/5 border border-white/10 rounded">
                ⌘K
              </kbd>
            </div>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10
                       text-slate-400 hover:text-white transition-all duration-300
                       border border-white/10 hover:border-white/20"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full
                             animate-pulse shadow-lg shadow-red-500/50" />
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10
                       text-slate-400 hover:text-white transition-all duration-300
                       border border-white/10 hover:border-white/20"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* User Profile */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl
                       bg-gradient-to-r from-blue-500/10 to-purple-500/10
                       border border-white/10 hover:border-white/20
                       cursor-pointer transition-all duration-300 group"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500
                            flex items-center justify-center text-white font-bold shadow-lg">
                A
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-white">Admin User</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
              <User className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
