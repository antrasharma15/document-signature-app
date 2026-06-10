import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up the PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // States
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false); // keep loading false for empty table state
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [activeTab, setActiveTab] = useState('Overview');

  const fileInputRef = useRef(null);

  // Reset page number and total pages on preview change
  useEffect(() => {
    if (previewDoc) {
      setPageNumber(1);
      setNumPages(null);
    }
  }, [previewDoc]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Optional: We can leave API fetch commented out or simple to keep document list empty as requested
  // useEffect(() => {
  //   fetchDocuments();
  // }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await API.get('/docs/');
      setDocuments(res.data.documents);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);

    setUploading(true);
    try {
      await API.post('/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Optionally fetch documents or set local success
      fetchDocuments();
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Dynamic date string
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sidebarNavItems = [
    { name: 'Overview' },
    { name: 'Documents' },
    { name: 'Signature Requests' },
    { name: 'Audit Logs' },
    { name: 'Notifications' },
    { name: 'Profile' },
  ];

  const stats = [
    { label: 'Total Documents', value: 0, iconColor: 'text-pink-400', borderColor: 'border-pink-500/20' },
    { label: 'Pending', value: 0, iconColor: 'text-orange-400', borderColor: 'border-yellow-500/30' },
    { label: 'Signed', value: 0, iconColor: 'text-pink-400', borderColor: 'border-pink-500/20' },
    { label: 'Rejected', value: 0, iconColor: 'text-red-400', borderColor: 'border-red-500/30' },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans flex">
      {/* Background Glow Effect */}
      <div className="fixed left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-pink-500/10 blur-[150px] pointer-events-none z-0" />

      {/* Sidebar navigation */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed left-0 top-0 h-screen w-64 bg-zinc-900/90 backdrop-blur-lg border-r border-pink-500/10 flex flex-col justify-between py-6 px-4 z-20"
      >
        <div className="flex flex-col">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 px-4 py-3 mb-8">
            <span className="text-xl">📄</span>
            <span className="text-pink-400 font-bold text-xl tracking-tight">DocSign</span>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {sidebarNavItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={
                    isActive
                      ? 'w-full bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl px-4 py-3 flex items-center gap-3 font-medium transition text-left cursor-pointer'
                      : 'w-full text-gray-400 hover:text-white hover:bg-zinc-800/50 rounded-xl px-4 py-3 flex items-center gap-3 transition text-left cursor-pointer'
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="px-2">
          <button
            onClick={handleLogout}
            className="w-full border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded-xl px-4 py-2.5 transition flex items-center justify-center gap-2 cursor-pointer font-semibold text-sm"
          >
            <span> </span> Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="ml-64 flex-1 min-h-screen relative z-10 p-8 flex flex-col"
      >
        {/* Top bar */}
        <header className="flex justify-between items-center pb-6 border-b border-zinc-800 bg-transparent mb-8">
          <div>
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              Good morning, {user?.name || 'User'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{formattedDate}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Hidden PDF Upload input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept="application/pdf"
              className="hidden"
              disabled={uploading}
            />
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="bg-pink-500 hover:bg-pink-400 text-black font-semibold rounded-xl px-4 py-2.5 transition cursor-pointer text-sm shadow-lg shadow-pink-500/10 flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>+</span> Upload Document
                </>
              )}
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-zinc-900/80 backdrop-blur-lg border ${stat.borderColor} rounded-2xl p-6 flex flex-col justify-between hover:border-pink-500/40 transition duration-300 relative overflow-hidden group`}
            >
              <div className={`${stat.iconColor} text-2xl mb-3`}>{stat.icon}</div>
              <div className="text-white text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </section>

        {/* Recent Documents Table Section */}
        <section className="flex-1">
          <div className="bg-zinc-900/80 backdrop-blur-lg border border-pink-500/20 rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-semibold text-base mb-4">Recent Documents</h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="animate-spin h-8 w-8 text-pink-400 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-400 text-sm">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-gray-500 text-sm font-semibold">No documents uploaded yet</p>
                <p className="text-zinc-600 text-xs mt-1">Get started by clicking the button in the top right.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                      <th className="pb-3 font-semibold">Document Name</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => {
                      // Status pill colors mapping
                      let statusStyle = 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400';
                      if (doc.status === 'signed') {
                        statusStyle = 'bg-pink-500/10 border border-pink-500/30 text-pink-400';
                      } else if (doc.status === 'rejected') {
                        statusStyle = 'bg-red-500/10 border border-red-500/30 text-red-400';
                      }

                      return (
                        <tr key={doc._id} className="text-white text-sm border-b border-zinc-800/50 hover:bg-zinc-800/50 transition">
                          <td className="py-4 font-medium max-w-[200px] truncate">
                            <span className="mr-2">📄</span>
                            {doc.originalName}
                          </td>
                          <td className="py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusStyle}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 text-gray-400">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="text-gray-400 hover:text-pink-400 transition p-1.5 rounded-lg hover:bg-zinc-800/50"
                                title="View"
                              >
                                👁️
                              </button>
                              <button
                                className="text-gray-400 hover:text-pink-400 transition p-1.5 rounded-lg hover:bg-zinc-800/50"
                                title="Send"
                              >
                                📤
                              </button>
                              <a
                                href={`http://localhost:5000/uploads/${doc.fileName}`}
                                download={doc.originalName}
                                className="text-gray-400 hover:text-pink-400 transition p-1.5 rounded-lg hover:bg-zinc-800/50 inline-block"
                                title="Download"
                              >
                                ⬇️
                              </a>
                              <button
                                className="text-gray-400 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-zinc-800/50"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </motion.main>

      {/* PDF Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-pink-500/20 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <h3 className="font-semibold text-white text-sm truncate max-w-[400px]">
                  {previewDoc.originalName}
                </h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-red-400 hover:bg-zinc-800/50 p-1.5 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-zinc-950/20">
              <div className="shadow-lg border border-zinc-800 rounded-lg overflow-hidden bg-white max-w-full">
                <Document
                  file={`http://localhost:5000/uploads/${previewDoc.fileName}`}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(err) => console.error('PDF load error:', err)}
                  loading={
                    <div className="flex flex-col items-center justify-center p-12 gap-3 min-w-[500px] bg-zinc-900 text-white">
                      <svg className="animate-spin h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm text-gray-400 font-medium">Loading document...</span>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center p-12 text-center text-red-400 bg-zinc-900 min-w-[500px]">
                      <span className="text-3xl mb-2">⚠️</span>
                      <p className="font-semibold text-sm text-white">Failed to load PDF file.</p>
                      <p className="text-xs text-gray-400 mt-1">Please make sure the server is running and the file is valid.</p>
                    </div>
                  }
                >
                  <Page pageNumber={pageNumber} width={560} />
                </Document>
              </div>
            </div>

            {/* Modal controls */}
            {numPages && numPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-800 bg-zinc-950/50">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                  className="px-4 py-2 text-xs font-semibold text-white bg-transparent border border-white/20 rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  ← Previous
                </button>
                <span className="text-xs font-medium text-gray-400">
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
                  className="px-4 py-2 text-xs font-semibold text-white bg-transparent border border-white/20 rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;