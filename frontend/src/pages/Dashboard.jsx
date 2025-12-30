import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, FileText, Package, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { dashboardAPI, customersAPI, invoicesAPI } from '../api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    totalPackages: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [overdueCustomers, setOverdueCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chart data
  const [revenueData, setRevenueData] = useState([]);
  const [customerGrowthData, setCustomerGrowthData] = useState([]);
  const [packageDistData, setPackageDistData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activityData, revenueChart, customerGrowth, packageDist, invoicesData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivity(),
        dashboardAPI.getRevenueChart(),
        dashboardAPI.getCustomerGrowth(),
        dashboardAPI.getPackageDistribution(),
        invoicesAPI.getAll({ status: 'unpaid' })
      ]);
      
      setStats(statsData);
      setRecentActivity(activityData);
      setRevenueData(revenueChart);
      setCustomerGrowthData(customerGrowth);
      setPackageDistData(packageDist);
      
      // Filter overdue invoices
      const overdue = invoicesData.filter(inv => {
        const dueDate = new Date(inv.due_date);
        return dueDate < new Date();
      });
      setOverdueCustomers(overdue);
      
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

  const formatCompactPrice = (value) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}M`;
    }
    return `Rp ${(value / 1000).toFixed(0)}K`;
  };

  // Colors for charts
  const COLORS = ['#5865f2', '#8b5cf6', '#ec4899', '#f59e0b'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-blue-500/30 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-white font-semibold">
              {entry.name}: {entry.name.includes('Revenue') ? formatPrice(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
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

      {/* Charts Grid - Revenue & Customer Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5865f2" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#5865f2" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickFormatter={formatCompactPrice}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#5865f2" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Customer Growth */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="text-green-500" size={20} />
            Pertumbuhan Pelanggan
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customerGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="customers" 
                fill="#34d399"
                radius={[8, 8, 0, 0]}
                name="Customers"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Package Distribution & Overdue Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Package className="text-purple-500" size={20} />
            Distribusi Paket
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={packageDistData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name} (${count})`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {packageDistData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pelanggan Nunggak - REPLACEMENT FOR QUICK ACTIONS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            Pelanggan Nunggak ({overdueCustomers.length})
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {overdueCustomers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-3">✅</div>
                <p className="text-slate-400">Tidak ada pelanggan nunggak!</p>
                <p className="text-sm text-slate-500 mt-2">Semua pembayaran tepat waktu</p>
              </div>
            ) : (
              overdueCustomers.map((invoice, index) => {
                const daysOverdue = Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold">{invoice.customer_name}</p>
                        <p className="text-xs text-slate-400">{invoice.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                        {daysOverdue} hari
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-red-500/20">
                      <div className="text-xs text-slate-400">
                        <p>Invoice: {invoice.invoice_number}</p>
                        <p>Jatuh tempo: {new Date(invoice.due_date).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-400">
                          {formatPrice(invoice.amount)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card"
      >
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.slice(0, 5).map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
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
    </div>
  );
};

export default Dashboard;
