import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, FileText, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { dashboardAPI } from '../api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    totalPackages: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivity()
      ]);
      setStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Pelanggan",
      value: stats.totalCustomers,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      trend: "up",
      trendValue: "+12%"
    },
    {
      title: "Revenue Bulan Ini",
      value: formatPrice(stats.monthlyRevenue),
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      trend: "up",
      trendValue: "+8%"
    },
    {
      title: "Invoice Pending",
      value: stats.pendingInvoices,
      icon: FileText,
      color: "from-yellow-500 to-orange-500",
      trend: stats.pendingInvoices > 20 ? "up" : "down",
      trendValue: stats.pendingInvoices > 20 ? "+5%" : "-5%"
    },
    {
      title: "Total Paket",
      value: stats.totalPackages,
      icon: Package,
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <Icon className="text-white" size={24} />
                </div>
                {stat.trend && (
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span>{stat.trendValue}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{activity.customer_name}</p>
                  <p className="text-xs text-slate-400">
                    {activity.type === 'payment' ? 'Payment received' : 'New customer'}
                  </p>
                </div>
                {activity.amount > 0 && (
                  <span className="text-sm font-semibold text-green-400">
                    {formatPrice(activity.amount)}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all text-left group">
              <Users size={24} className="text-blue-400 mb-2" />
              <p className="text-sm font-medium text-white">Add Customer</p>
            </button>
            <button className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 transition-all text-left group">
              <FileText size={24} className="text-green-400 mb-2" />
              <p className="text-sm font-medium text-white">New Invoice</p>
            </button>
            <button className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-all text-left group">
              <Package size={24} className="text-purple-400 mb-2" />
              <p className="text-sm font-medium text-white">Add Package</p>
            </button>
            <button className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all text-left group">
              <DollarSign size={24} className="text-yellow-400 mb-2" />
              <p className="text-sm font-medium text-white">Record Payment</p>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-2">Welcome to ISP Billing System! 🚀</h2>
            <p className="text-slate-400">
              Manage your internet service provider business with ease. Track customers, packages, invoices, and payments all in one place.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
