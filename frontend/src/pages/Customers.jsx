// ================================================
// FILE: frontend/src/pages/Customers.jsx - COMPLETE FIXED VERSION
// ================================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit2, Trash2, Mail, Phone, MapPin, X, Package, Calendar, AlertCircle } from 'lucide-react';
import { customersAPI, packagesAPI } from '../api';
import toast from 'react-hot-toast';
import api from '../api/client';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [errors, setErrors] = useState({});
  
  // ✅ FIXED: Separated customer data and subscription data
  const [formData, setFormData] = useState({
    // Customer data only
    name: '',
    email: '',
    phone: '',
    address: '',
    installation_address: '',
    status: 'active'
  });

  // NEW: Subscription data (only for new customers)
  const [subscriptionData, setSubscriptionData] = useState({
    package_id: '',
    installation_date: '',
    payment_due_day: '1'
  });

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersData, packagesData] = await Promise.all([
        customersAPI.getAll({ search: searchTerm }),
        packagesAPI.getAll()
      ]);
      setCustomers(customersData.data || customersData);
      setPackages(packagesData);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ VALIDATION FUNCTION
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone) {
      const phoneRegex = /^[+]?[0-9]{10,15}$/;
      const cleanPhone = formData.phone.replace(/[\s-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Invalid phone number (10-15 digits)';
      }
    }

    // For new customers, validate subscription data
    if (!editingCustomer && subscriptionData.package_id) {
      if (!subscriptionData.installation_date) {
        newErrors.installation_date = 'Installation date is required when package is selected';
      }
      
      const dueDay = parseInt(subscriptionData.payment_due_day);
      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        newErrors.payment_due_day = 'Payment due day must be between 1-31';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    try {
      if (editingCustomer) {
        // ✅ UPDATE: Only update customer data
        await customersAPI.update(editingCustomer.id, formData);
        toast.success('Customer updated successfully!');
      } else {
        // ✅ CREATE: Use new endpoint if package is selected
        if (subscriptionData.package_id) {
          await api.post('/customers/with-subscription', {
            ...formData,
            ...subscriptionData
          });
          toast.success('Customer and subscription created successfully!');
        } else {
          // Create customer without subscription
          await customersAPI.create(formData);
          toast.success('Customer created successfully!');
        }
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Operation failed';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all related subscriptions and invoices.')) return;
    try {
      await customersAPI.delete(id);
      toast.success('Customer deleted successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      installation_address: customer.installation_address || '',
      status: customer.status
    });
    // Reset subscription data (can't edit subscription in customer form)
    setSubscriptionData({
      package_id: '',
      installation_date: '',
      payment_due_day: '1'
    });
    setErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      installation_address: '',
      status: 'active'
    });
    setSubscriptionData({
      package_id: '',
      installation_date: '',
      payment_due_day: '1'
    });
    setEditingCustomer(null);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleSubscriptionChange = (field, value) => {
    setSubscriptionData({ ...subscriptionData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
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
          <h1 className="text-3xl font-bold gradient-text">Customers</h1>
          <p className="text-slate-400 mt-1">Manage your customer database</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Customer
        </motion.button>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-4"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {customers.map((customer, index) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="card-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{customer.name}</h3>
                    <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {customer.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(customer)}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                  >
                    <Edit2 size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail size={16} />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={16} />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={16} />
                    <span className="line-clamp-1">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-500">
                Added {new Date(customer.created_at).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {customers.length === 0 && !loading && (
        <div className="text-center py-12 card">
          <Users size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No customers found</p>
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
              className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Customer Information Section */}
                <div className="pb-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Users size={18} />
                    Customer Information
                  </h3>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`input ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`input ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`input ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+62 812 3456 7890 or 081234567890"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.phone}
                    </p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">Format: +62xxx or 08xxx (10-15 digits)</p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="input min-h-[80px]"
                    placeholder="Customer billing address"
                  />
                </div>

                {/* Installation Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Installation Address
                  </label>
                  <textarea
                    value={formData.installation_address}
                    onChange={(e) => handleInputChange('installation_address', e.target.value)}
                    className="input min-h-[80px]"
                    placeholder="Service installation address (if different from billing address)"
                  />
                </div>

                {/* Status (only for editing) */}
                {editingCustomer && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}

                {/* Subscription Section (only for new customers) */}
                {!editingCustomer && (
                  <>
                    <div className="pt-4 border-t border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Package size={18} />
                        Subscription (Optional)
                      </h3>
                      <p className="text-slate-400 text-sm mb-4">
                        You can assign a package now or add it later
                      </p>
                    </div>

                    {/* Package Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Internet Package
                      </label>
                      <select
                        value={subscriptionData.package_id}
                        onChange={(e) => handleSubscriptionChange('package_id', e.target.value)}
                        className="input"
                      >
                        <option value="">No package (add later)</option>
                        {packages.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} - {pkg.speed} - Rp {pkg.price.toLocaleString('id-ID')}/month
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Show additional fields only if package is selected */}
                    {subscriptionData.package_id && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Installation Date <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="date"
                            value={subscriptionData.installation_date}
                            onChange={(e) => handleSubscriptionChange('installation_date', e.target.value)}
                            className={`input ${errors.installation_date ? 'border-red-500' : ''}`}
                            max={new Date().toISOString().split('T')[0]}
                          />
                          {errors.installation_date && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.installation_date}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Payment Due Day <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={subscriptionData.payment_due_day}
                            onChange={(e) => handleSubscriptionChange('payment_due_day', e.target.value)}
                            className={`input ${errors.payment_due_day ? 'border-red-500' : ''}`}
                            placeholder="1-31"
                          />
                          {errors.payment_due_day && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.payment_due_day}
                            </p>
                          )}
                          <p className="text-slate-500 text-xs mt-1">
                            Day of month when payment is due (1-31). Example: 1 = 1st of each month
                          </p>
                        </div>

                        {/* Info box */}
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <p className="text-blue-400 text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            A subscription and first invoice will be automatically created for this customer.
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
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

export default Customers;
