import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API, { API_BASE_URL } from "../api/axios";
import { Document, Page, pdfjs } from "react-pdf";
import SignatureModal from "../components/SignatureModal";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SignPage() {
  const { token } = useParams();
  const [docInfo, setDocInfo] = useState(null);
  const [placeholders, setPlaceholders] = useState([]);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [selectedPlaceholderId, setSelectedPlaceholderId] = useState(null);

  const pdfWrapRef = useRef(null);

  useEffect(() => {
    // Validate the token and get document info
    API.get(`/signatures/sign/${token}`)
      .then(res => {
        setDocInfo(res.data);
        setPlaceholders(res.data.placeholders || []);
      })
      .catch(err => setError(err.response?.data?.message || "Invalid or expired link"));
  }, [token]);

  const handleSubmitSignature = async (signatureImage) => {
    try {
      if (selectedPlaceholderId) {
        await API.post(`/signatures/sign/${token}`, {
          signatureImage,
          signatureId: selectedPlaceholderId,
        });
      } else if (pendingCoords) {
        await API.post(`/signatures/sign/${token}`, {
          signatureImage,
          x: pendingCoords.x,
          y: pendingCoords.y,
          page: currentPage,
        });
      }
      setSubmitted(true);
    } catch (err) {
      alert("Failed to submit signature");
    } finally {
      setIsModalOpen(false);
    }
  };

  const handlePdfClick = (e) => {
    // If there are pre-placed placeholders, force the user to click those specifically
    if (placeholders.length > 0) return;

    const rect = pdfWrapRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) return;

    setPendingCoords({ x: xPercent, y: yPercent });
    setSelectedPlaceholderId(null);
    setIsModalOpen(true);
  };

  if (error) return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center p-8 max-w-md bg-slate-800 border border-slate-700/60 rounded-xl shadow-lg">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-xl font-bold text-rose-500 mt-4">Link verification failed</h2>
        <p className="text-slate-400 text-sm mt-2">{error}</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center p-8 max-w-md bg-slate-800 border border-slate-700/60 rounded-xl shadow-lg">
        <span className="text-5xl">✅</span>
        <h2 className="text-2xl font-bold text-emerald-400 mt-4">Document Signed!</h2>
        <p className="text-slate-400 text-sm mt-2">Thank you! Your signature has been submitted. You can now close this tab.</p>
      </div>
    </div>
  );

  if (!docInfo) return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Loading secure signature portal...</p>
      </div>
    </div>
  );

  const fileUrl = `${API_BASE_URL}${docInfo.fileUrl}`;
  const sigsOnPage = placeholders.filter((s) => s.page === currentPage);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-slate-950 border-b border-slate-800/80 py-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-lg">
            ✍️
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white">SignVault</h1>
            <p className="text-slate-500 text-xs font-medium -mt-1">Secure Sign Portal</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-white mb-1">Review & Sign Document</h2>
          <p className="text-slate-400 text-sm mb-4">
            Document name: <strong className="text-emerald-400 font-medium">{docInfo.filename}</strong>
          </p>
          <div className="bg-blue-950/40 border border-blue-900/60 text-blue-300 rounded-lg p-3 text-xs flex items-center gap-2">
            <span className="text-base">ℹ️</span>
            {placeholders.length > 0 ? (
              <span><strong>Click on any signature box</strong> (marked "Sign Here") on the document below to draw and place your signature.</span>
            ) : (
              <span><strong>Click anywhere on the document</strong> where you wish to place and draw your signature.</span>
            )}
          </div>
        </div>

        {/* PDF Wrapper */}
        <div className="flex justify-center">
          <div
            ref={pdfWrapRef}
            onClick={handlePdfClick}
            className="relative rounded-xl border border-slate-700 overflow-hidden shadow-2xl bg-white select-none"
            style={{ width: "720px", cursor: placeholders.length > 0 ? "default" : "crosshair" }}
          >
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
              loading={<div className="p-10 text-center text-slate-400">Loading PDF…</div>}
              error={<div className="p-10 text-center text-rose-400">Failed to load PDF.</div>}
            >
              <Page
                pageNumber={currentPage}
                width={720}
                onRenderSuccess={() => {
                  const el = pdfWrapRef.current;
                  if (el) setPdfSize({ width: el.offsetWidth, height: el.offsetHeight });
                }}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>

            {/* Signature placeholders rendered as absolute overlays */}
            {pdfSize.width > 0 &&
              sigsOnPage.map((sig) => {
                const isSigned = sig.status === "signed";
                const w = sig.width || 150;
                const h = sig.height || 50;
                const left = (sig.x / 100) * pdfSize.width;
                const top = (sig.y / 100) * pdfSize.height;

                return (
                  <div
                    key={sig._id}
                    onClick={(e) => {
                      if (!isSigned) {
                        e.stopPropagation();
                        setSelectedPlaceholderId(sig._id);
                        setIsModalOpen(true);
                      }
                    }}
                    style={{
                      position: "absolute",
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${w}px`,
                      height: `${h}px`,
                      background: isSigned ? "#F0FDF4" : "#EFF6FF",
                      border: isSigned ? "1.5px solid #22C55E" : "1.5px dashed #3B82F6",
                      borderRadius: "6px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isSigned ? "default" : "pointer",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
                      zIndex: 10,
                      userSelect: "none",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={e => {
                      if (!isSigned) {
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 3px 10px rgba(59,130,246,0.20)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSigned) {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.10)";
                      }
                    }}
                  >
                    {isSigned && sig.signatureImage ? (
                      <img
                        src={sig.signatureImage}
                        alt="Signature"
                        style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "6px" }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-1 text-center font-sans">
                        <span className="text-[11px] text-blue-600 font-bold tracking-wide">✍️ Sign Here</span>
                        <span className="text-[8px] text-slate-500 font-medium uppercase mt-0.5">Awaiting Signature</span>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Page navigation overlay (if multi-page) */}
            {totalPages && totalPages > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-800 rounded-full px-4 py-2 flex items-center gap-4 text-xs font-semibold shadow-lg text-white">
                <button
                  disabled={currentPage <= 1}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition"
                >
                  Prev
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-850 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <SignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSubmitSignature}
      />
    </div>
  );
}