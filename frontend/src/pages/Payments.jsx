import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Search, Calendar, X, CheckCircle } from 'lucide-react';
import { paymentsAPI, invoicesAPI } from '../api';
import toast from 'react-hot-toast';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsData, invoicesData] = await Promise.all([
        paymentsAPI.getAll(),
        invoicesAPI.getAll({ status: 'unpaid' })
      ]);
      setPayments(paymentsData);
      setUnpaidInvoices(invoicesData);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await paymentsAPI.create(formData);
      toast.success('Payment recorded successfully!');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_id: '',
      amount: '',
      payment_method: 'cash',
      notes: ''
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const filteredPayments = payments.filter(payment =>
    payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

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
          <h1 className="text-3xl font-bold gradient-text">Payments</h1>
          <p className="text-slate-400 mt-1">Track and manage payments</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-success flex items-center gap-2"
        >
          <Plus size={20} />
          Record Payment
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
              <CreditCard className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Payments</p>
              <p className="text-2xl font-bold text-white">{payments.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
              <CheckCircle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Amount</p>
              <p className="text-2xl font-bold text-white">{formatPrice(totalPayments)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500">
              <Calendar className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Unpaid Invoices</p>
              <p className="text-2xl font-bold text-white">{unpaidInvoices.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-12"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-slate-400 font-semibold">Date</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Invoice #</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Customer</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Amount</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Method</th>
                <th className="text-left p-4 text-slate-400 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredPayments.map((payment, index) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="p-4">
                      <span className="text-sm text-slate-300">
                        {new Date(payment.payment_date).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm text-blue-400">{payment.invoice_number}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">{payment.customer_name}</p>
                        <p className="text-xs text-slate-400">{payment.customer_email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-green-400">{formatPrice(payment.amount)}</span>
                    </td>
                    <td className="p-4">
                      <span className="badge badge-info capitalize">{payment.payment_method}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-400">{payment.notes || '-'}</span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">No payments found</p>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
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
                <h2 className="text-2xl font-bold gradient-text">Record Payment</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Unpaid Invoice *</label>
                  <select
                    required
                    value={formData.invoice_id}
                    onChange={(e) => {
                      const invoice = unpaidInvoices.find(inv => inv.id === parseInt(e.target.value));
                      setFormData({ 
                        ...formData, 
                        invoice_id: e.target.value,
                        amount: invoice?.amount || ''
                      });
                    }}
                    className="input"
                  >
                    <option value="">Select Invoice</option>
                    {unpaidInvoices.map(invoice => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {invoice.customer_name} - {formatPrice(invoice.amount)}
                      </option>
                    ))}
                  </select>
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method *</label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="input"
                  >
                    <option value="cash">Cash</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="e-wallet">E-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Additional payment notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-success flex-1">
                    Record Payment
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

export default Payments;
