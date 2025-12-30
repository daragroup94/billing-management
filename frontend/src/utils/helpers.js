// Format Rupiah
export const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format Date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Format DateTime
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get Status Color
export const getStatusColor = (status) => {
  const colors = {
    active: 'from-green-500 to-emerald-500',
    inactive: 'from-red-500 to-rose-500',
    paid: 'from-green-500 to-emerald-500',
    unpaid: 'from-yellow-500 to-orange-500',
  };
  return colors[status] || 'from-gray-500 to-slate-500';
};
