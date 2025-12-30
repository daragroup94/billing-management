import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Search, Filter, Calendar, X } from 'lucide-react';
import { invoicesAPI, customersAPI, packagesAPI } from '../api';
import toast from 'react-hot-toast';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    package_id: '',
    invoice_number: '',
    amount: '',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesData, customersData, packagesData] = await Promise.all([
        invoicesAPI.getAll(filterStatus !== 'all' ? { status: filterStatus } : {}),
        customersAPI.getAll(),
        packagesAPI.getAll()
      ]);
      setInvoices(invoicesData);
      setCustomers(customersData.data || customersData);
      setPackages(packagesData);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedPackage = packages.find(p => p.id === parseInt(formData.package_id));
      const invoiceData = {
        ...formData,
        amount: formData.amount || selectedPackage?.price || 0,
        invoice_number: formData.invoice_number || generateInvoiceNumber()
      };
      
      await invoicesAPI.create(invoiceData);
      toast.success('Invoice created successfully!');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoicesAPI.delete(id);
      toast.success('Invoice deleted successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await invoicesAPI.updateStatus(id, status);
      toast.success('Invoice status updated!');
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Status update failed');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      package_id: '',
      invoice_number: '',
      amount: '',
      due_date: ''
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold gradient-text">Invoices</h1>
          <p className="text-slate-400 mt-1">Manage billing invoices</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Create Invoice
        </motion.button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-slate-400 font-semibold">Invoice #</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Customer</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Package</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Amount</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Due Date</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Status</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm text-blue-400">{invoice.invoice_number}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">{invoice.customer_name}</p>
                        <p className="text-xs text-slate-400">{invoice.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300">{invoice.package_name || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-white">{formatPrice(invoice.amount)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-sm">
                          {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                        className={`badge cursor-pointer ${
                          invoice.status === 'paid' ? 'badge-success' :
                          invoice.status === 'unpaid' ? 'badge-warning' :
                          'badge-danger'
                        }`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(invoice.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">No invoices found</p>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
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
                <h2 className="text-2xl font-bold gradient-text">Create New Invoice</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Customer *</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Package *</label>
                  <select
                    required
                    value={formData.package_id}
                    onChange={(e) => {
                      const pkg = packages.find(p => p.id === parseInt(e.target.value));
                      setFormData({ 
                        ...formData, 
                        package_id: e.target.value,
                        amount: pkg?.price || ''
                      });
                    }}
                    className="input"
                  >
                    <option value="">Select Package</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.speed} - {formatPrice(pkg.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Invoice Number</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="input"
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount (IDR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                    placeholder="300000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Invoice
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

export default Invoices;
