import { motion } from 'framer-motion';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card text-center py-16"
    >
      {Icon && (
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 
                        flex items-center justify-center border border-white/10">
            <Icon className="w-12 h-12 text-slate-400" />
          </div>
        </motion.div>
      )}
      
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 mb-8 max-w-md mx-auto">{description}</p>
      
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action}
          className="btn-primary"
        >
          {actionLabel || 'Get Started'}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
