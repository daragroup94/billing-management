import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'from-blue-500 to-purple-500',
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="card-hover group relative overflow-hidden"
    >
      {/* Background Gradient Effect */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} 
                      opacity-10 rounded-full blur-3xl group-hover:opacity-20 
                      transition-opacity duration-500`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-white mt-2">
              {value}
            </h3>
          </div>
          
          {Icon && (
            <div className={`p-3 rounded-xl bg-gradient-to-br ${color} 
                          shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-semibold ${
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {trendValue}
            </span>
            <span className="text-sm text-slate-500">vs last month</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
