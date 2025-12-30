import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Edit2, Trash2, Users, Wifi, X } from 'lucide-react';
import { packagesAPI } from '../api';
import toast from 'react-hot-toast';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    speed: '',
    price: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await packagesAPI.getAll();
      setPackages(data);
    } catch (error) {
      toast.error('Failed to fetch packages');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await packagesAPI.update(editingPackage.id, formData);
        toast.success('Package updated successfully!');
      } else {
        await packagesAPI.create(formData);
        toast.success('Package created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchPackages();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await packagesAPI.delete(id);
      toast.success('Package deleted successfully!');
      fetchPackages();
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      speed: pkg.speed,
      price: pkg.price,
      description: pkg.description || '',
      status: pkg.status
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      speed: '',
      price: '',
      description: '',
      status: 'active'
    });
    setEditingPackage(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Internet Packages</h1>
          <p className="text-slate-400 mt-1">Manage your service packages</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Package
        </motion.button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="card-hover group relative overflow-hidden"
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                        <Wifi size={20} className="text-white" />
                      </div>
                      <span className={`badge ${pkg.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {pkg.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
                    <p className="text-2xl font-bold gradient-text">{pkg.speed}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(pkg)}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      <Edit2 size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(pkg.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatPrice(pkg.price)}
                  </div>
                  <p className="text-sm text-slate-400">per bulan</p>
                </div>

                {pkg.description && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {pkg.description}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <Users size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-400">
                    {pkg.subscriber_count || 0} subscribers
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {packages.length === 0 && !loading && (
        <div className="text-center py-12 card">
          <Package size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No packages found</p>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">
                  {editingPackage ? 'Edit Package' : 'Add New Package'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Premium Package"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Speed *</label>
                  <input
                    type="text"
                    required
                    value={formData.speed}
                    onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
                    className="input"
                    placeholder="100 Mbps"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Price (IDR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                    placeholder="300000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Package description..."
                  />
                </div>

                {editingPackage && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Packages;
