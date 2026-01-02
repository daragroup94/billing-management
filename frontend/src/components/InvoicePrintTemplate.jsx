// ================================================
// FILE: frontend/src/components/InvoicePrintTemplate.jsx - FIXED VERSION
// Fixed: Null safety untuk customer_name dan data lainnya
// ================================================
import { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const InvoicePrintTemplate = ({ invoice, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Screen Overlay dengan Toolbar */}
      <div className="print:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">Preview Faktur</h3>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
              >
                <Download size={18} />
                Download PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
              >
                <Printer size={18} />
                Cetak
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-800">
            <div className="bg-white mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
              <div ref={printRef}>
                <PrintableInvoice invoice={invoice} formatPrice={formatPrice} formatDate={formatDate} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Print-only Version - Hidden on screen, visible on print */}
      <div className="printable-invoice-area">
        <PrintableInvoice invoice={invoice} formatPrice={formatPrice} formatDate={formatDate} />
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .printable-invoice-area,
          .printable-invoice-area * {
            visibility: visible;
          }
          
          .printable-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        
        @media screen {
          .printable-invoice-area {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

// Komponen Invoice yang akan di-print
const PrintableInvoice = ({ invoice, formatPrice, formatDate }) => {
  // ✅ FIXED: Null safety untuk semua data
  const safeInvoice = {
    customer_name: invoice?.customer_name || 'N/A',
    email: invoice?.email || 'N/A',
    customer_phone: invoice?.customer_phone || '',
    customer_address: invoice?.customer_address || '',
    invoice_number: invoice?.invoice_number || 'N/A',
    created_at: invoice?.created_at || new Date(),
    due_date: invoice?.due_date || new Date(),
    status: invoice?.status || 'unpaid',
    package_name: invoice?.package_name || 'Paket Standar',
    package_speed: invoice?.package_speed || 'N/A',
    amount: invoice?.amount || 0,
    discount: invoice?.discount || 0,
    discount_note: invoice?.discount_note || '',
    final_amount: invoice?.final_amount || (invoice?.amount - invoice?.discount) || 0
  };

  return (
    <div className="p-6 bg-white text-gray-900" style={{ maxWidth: '210mm', margin: '0 auto' }}>
      {/* Header dengan Gradient Background */}
      <div className="relative mb-6 pb-6 border-b-4 border-blue-600">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full opacity-20 -ml-24 -mb-24"></div>
        
        <div className="relative z-10 flex items-start justify-between">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  daranett
                </h1>
                <p className="text-xs text-gray-600 font-semibold">Penyedia Layanan Internet</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">daranett</p>
              <p>Desa Bacin, Ngempik</p>
              <p>Kec. Bae, Kab. Kudus, Jawa Tengah</p>
              <p>📞 +62 895 3274 49707</p>
              <p>✉️ groupdara45@gmail.com</p>
              <p>🌐 promo.access.daranett.com</p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="text-right">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg mb-4">
              <h2 className="text-2xl font-bold text-white">FAKTUR</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-gray-600 font-semibold">No Faktur:</span>
                <span className="font-bold text-blue-600">{safeInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-600 font-semibold">Tanggal:</span>
                <span className="font-semibold">{formatDate(safeInvoice.created_at)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-600 font-semibold">Jatuh Tempo:</span>
                <span className="font-semibold text-red-600">{formatDate(safeInvoice.due_date)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-gray-600 font-semibold">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  safeInvoice.status === 'paid' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {safeInvoice.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-blue-200">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </div>
          Tagihan Kepada
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xl font-bold text-gray-900 mb-1">{safeInvoice.customer_name}</p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Email:</span> {safeInvoice.email}
            </p>
            {safeInvoice.customer_phone && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Telepon:</span> {safeInvoice.customer_phone}
              </p>
            )}
          </div>
          {safeInvoice.customer_address && (
            <div className="text-right">
              <p className="text-xs text-gray-500 font-semibold mb-1">Alamat Pelanggan:</p>
              <p className="text-sm text-gray-700">{safeInvoice.customer_address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Details Table */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <th className="py-4 px-4 text-left font-bold">Deskripsi</th>
              <th className="py-4 px-4 text-center font-bold">Paket</th>
              <th className="py-4 px-4 text-center font-bold">Periode</th>
              <th className="py-4 px-4 text-right font-bold">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
              <td className="py-4 px-4">
                <p className="font-semibold text-gray-800">Langganan Layanan Internet</p>
                <p className="text-xs text-gray-500 mt-1">Biaya langganan bulanan</p>
              </td>
              <td className="py-4 px-4 text-center">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {safeInvoice.package_name}
                </span>
                {safeInvoice.package_speed && (
                  <p className="text-xs text-gray-500 mt-1">{safeInvoice.package_speed}</p>
                )}
              </td>
              <td className="py-4 px-4 text-center text-sm text-gray-600">
                1 Bulan
              </td>
              <td className="py-4 px-4 text-right font-bold text-gray-800">
                {formatPrice(safeInvoice.amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals with Discount */}
      <div className="flex justify-end mb-6">
        <div className="w-96">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600 py-2 border-b border-gray-200">
              <span className="font-semibold">Subtotal:</span>
              <span className="font-semibold">{formatPrice(safeInvoice.amount)}</span>
            </div>
            
            {/* Discount Row - Only show if discount exists */}
            {(safeInvoice.discount && parseFloat(safeInvoice.discount) > 0) && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <div>
                  <span className="font-semibold text-red-600">Diskon:</span>
                  {safeInvoice.discount_note && (
                    <p className="text-xs text-gray-500 mt-1">({safeInvoice.discount_note})</p>
                  )}
                </div>
                <span className="font-semibold text-red-600">-{formatPrice(safeInvoice.discount)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-gray-600 py-2 border-b border-gray-200">
              <span className="font-semibold">Pajak (0%):</span>
              <span className="font-semibold">{formatPrice(0)}</span>
            </div>
            
            {/* Final Total */}
            <div className="flex justify-between text-xl font-bold py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 rounded-lg shadow-lg">
              <span>TOTAL BAYAR:</span>
              <span>{formatPrice(safeInvoice.final_amount)}</span>
            </div>
            
            {/* Discount Info Badge */}
            {(safeInvoice.discount && parseFloat(safeInvoice.discount) > 0) && (
              <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                <p className="text-xs text-green-700 font-semibold">
                  ✓ Anda hemat {formatPrice(safeInvoice.discount)} untuk faktur ini!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </div>
          Informasi Pembayaran
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Transfer Bank:</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-semibold">Nama Rekening:</span> Rizky Ariyanti</p>
              <p><span className="font-semibold">BRI:</span> 340901038897531</p>
              <p><span className="font-semibold">Mandiri:</span> 1840000586717</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Konfirmasi Pembayaran:</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-semibold">WhatsApp:</span> +62 895 3274 49707</p>
              <p className="text-xs text-gray-500 mt-2">Kirim bukti transfer beserta nomor faktur</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Notes */}
      <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
        <h3 className="text-sm font-bold text-amber-800 mb-2">Syarat & Ketentuan Pembayaran:</h3>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          <li>Pembayaran harus diterima sebelum tanggal jatuh tempo untuk menghindari pemutusan layanan</li>
          <li>Harap cantumkan nomor faktur pada keterangan transfer</li>
          <li>Kirim bukti pembayaran via WhatsApp untuk konfirmasi lebih cepat</li>
          <li>Keterlambatan pembayaran dapat dikenakan biaya tambahan</li>
          <li>Untuk pertanyaan, silakan hubungi layanan pelanggan kami</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="flex justify-between items-end">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Faktur dibuat pada {formatDate(new Date())}</p>
            <p>Powered by Daranett Billing System v2.0</p>
            <p className="text-blue-600 font-semibold">Terima kasih telah memilih daranett!</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-4">Tanda Tangan</p>
            <div className="border-t-2 border-gray-800 w-48 pt-2">
              <p className="text-sm font-bold text-gray-800">Manajemen</p>
              <p className="text-xs text-gray-600">daranett</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer end - no decorative bar */}
    </div>
  );
};

export default InvoicePrintTemplate;
