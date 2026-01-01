// ================================================
// FILE: frontend/src/pages/Invoices.jsx - FULL FIXED VERSION
// Fixed: Status dropdown null value warning
// ================================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Search, Calendar, X, Printer, Edit2, Tag } from 'lucide-react';
import { invoicesAPI, customersAPI, packagesAPI } from '../api';
import toast from 'react-hot-toast';
import InvoicePrintTemplate from '../components/InvoicePrintTemplate';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    package_id: '',
    invoice_number: '',
    amount: '',
    due_date: '',
    discount: '0',
    discount_note: ''
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
    
    // Validation
    const amount = parseFloat(formData.amount) || 0;
    const discount = parseFloat(formData.discount) || 0;
    
    if (discount > amount) {
      toast.error('Discount tidak boleh lebih besar dari amount!');
      return;
    }

    try {
      const selectedPackage = packages.find(p => p.id === parseInt(formData.package_id));
      const invoiceData = {
        ...formData,
        amount: formData.amount || selectedPackage?.price || 0,
        invoice_number: formData.invoice_number || generateInvoiceNumber(),
        discount: discount,
        discount_note: formData.discount_note || ''
      };
      
      if (editingInvoice) {
        await invoicesAPI.update(editingInvoice.id, invoiceData);
        toast.success('Invoice updated successfully!');
      } else {
        await invoicesAPI.create(invoiceData);
        toast.success('Invoice created successfully!');
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Operation failed');
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      customer_id: invoice.customer_id,
      package_id: invoice.subscription_id,
      invoice_number: invoice.invoice_number,
      amount: invoice.amount,
      due_date: invoice.due_date.split('T')[0],
      discount: invoice.discount || '0',
      discount_note: invoice.discount_note || ''
    });
    setShowModal(true);
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

  const handlePrint = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPrintModal(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      package_id: '',
      invoice_number: '',
      amount: '',
      due_date: '',
      discount: '0',
      discount_note: ''
    });
    setEditingInvoice(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateFinalAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const discount = parseFloat(formData.discount) || 0;
    return Math.max(0, amount - discount);
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
          <p className="text-slate-400 mt-1">Manage billing invoices with discount support</p>
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
                <th className="text-left p-4 text-slate-400 font-semibold">Discount</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Final</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Due Date</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Status</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredInvoices.map((invoice, index) => {
                  const finalAmount = (parseFloat(invoice.final_amount) || (parseFloat(invoice.amount) - parseFloat(invoice.discount || 0)));
                  return (
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
                        {invoice.discount > 0 ? (
                          <div>
                            <span className="font-semibold text-red-400">-{formatPrice(invoice.discount)}</span>
                            {invoice.discount_note && (
                              <p className="text-xs text-slate-500">{invoice.discount_note}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-green-400">{formatPrice(finalAmount)}</span>
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
                        {/* ✅ FIXED: Added fallback value */}
                        <select
                          value={invoice.status || 'unpaid'}
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
                        <div className="flex items-center gap-2">
                          {/* Print Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePrint(invoice)}
                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                            title="Print Invoice"
                          >
                            <Printer size={16} />
                          </motion.button>
                          
                          {/* Edit Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(invoice)}
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                            title="Edit Invoice"
                          >
                            <Edit2 size={16} />
                          </motion.button>
                          
                          {/* Delete Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(invoice.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            title="Delete Invoice"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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

      {/* Create/Edit Invoice Modal */}
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
                  {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Customer *</label>
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="input"
                      disabled={editingInvoice}
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
                      disabled={editingInvoice}
                    >
                      <option value="">Select Package</option>
                      {packages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} - {pkg.speed} - {formatPrice(pkg.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Invoice Number</label>
                    <input
                      type="text"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      className="input"
                      placeholder="Auto-generated if empty"
                      disabled={editingInvoice}
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
                </div>

                {/* Amount & Discount Section */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Tag size={18} className="text-blue-400" />
                    Amount & Discount
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Amount (IDR) *</label>
                      <input
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="input"
                        placeholder="300000"
                        min="0"
                      />
                      <p className="text-xs text-slate-500 mt-1">Original package price</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Discount (IDR)</label>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        className="input"
                        placeholder="0"
                        min="0"
                        max={formData.amount}
                      />
                      <p className="text-xs text-slate-500 mt-1">Fee sales, promo, etc.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Discount Note</label>
                    <input
                      type="text"
                      value={formData.discount_note}
                      onChange={(e) => setFormData({ ...formData, discount_note: e.target.value })}
                      className="input"
                      placeholder="e.g., Fee Sales, Promo Ramadan, Diskon Pelanggan Lama"
                    />
                    <p className="text-xs text-slate-500 mt-1">Alasan pemberian diskon</p>
                  </div>

                  {/* Final Amount Preview */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Amount to be Paid:</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatPrice(formData.amount || 0)} - {formatPrice(formData.discount || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Final Amount</p>
                        <p className="text-2xl font-bold text-green-400">
                          {formatPrice(calculateFinalAmount())}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
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

      {/* Print Modal */}
      <AnimatePresence>
        {showPrintModal && selectedInvoice && (
          <InvoicePrintTemplate
            invoice={selectedInvoice}
            onClose={() => {
              setShowPrintModal(false);
              setSelectedInvoice(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invoices;
