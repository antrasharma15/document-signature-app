/**
 * DAY 5 — SignaturePlacer.jsx
 * 
 * Renders a PDF page and shows saved signature placeholders on top of it.
 * Clicking on the PDF adds a NEW signature placeholder and POSTs it to the backend.
 * 
 * Props:
 *   fileId  — MongoDB _id of the Document
 *   fileUrl — URL to the uploaded PDF (e.g. http://localhost:5000/uploads/file.pdf)
 */

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import API from "../api/axios";
import SignatureModal from "./SignatureModal";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Required: point pdfjs worker at the CDN build
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── tiny helpers ────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  pending:  { bg: "#EFF6FF", border: "#3B82F6", text: "#1D4ED8", dot: "#3B82F6" },
  signed:   { bg: "#F0FDF4", border: "#22C55E", text: "#15803D", dot: "#22C55E" },
  rejected: { bg: "#FFF1F2", border: "#F43F5E", text: "#BE123C", dot: "#F43F5E" },
};

const STATUS_LABEL = {
  pending:  "Awaiting Signature",
  signed:   "Signed",
  rejected: "Rejected",
};

// ─── SignatureBadge ───────────────────────────────────────────────────────────
// A single floating placeholder rendered on top of the PDF

function SignatureBadge({ sig, containerWidth, containerHeight, onRemove, onSign }) {
  const s = STATUS_STYLE[sig.status] || STATUS_STYLE.pending;
  const w = sig.width  || 150;
  const h = sig.height || 50;

  // Convert % coordinates back to absolute px
  const left = (sig.x / 100) * containerWidth;
  const top  = (sig.y / 100) * containerHeight;

  return (
    <div
      onClick={(e) => {
        if (sig.status === "pending" && onSign) {
          e.stopPropagation();
          onSign(sig);
        }
      }}
      style={{
        position: "absolute",
        left: `${left}px`,
        top:  `${top}px`,
        width: `${w}px`,
        height: `${h}px`,
        background: s.bg,
        border: sig.status === "signed" ? "none" : `1.5px dashed ${s.border}`,
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: sig.status === "pending" ? "pointer" : "default",
        boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
        userSelect: "none",
        zIndex: 10,
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={e => {
        if (sig.status === "pending") {
          e.currentTarget.style.transform = "scale(1.02)";
          e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={e => {
        if (sig.status === "pending") {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.10)";
        }
      }}
      title={`Signer: ${sig.signer?.name || "You"} • Status: ${sig.status}`}
    >
      {sig.status === "signed" && sig.signatureImage ? (
        <img
          src={sig.signatureImage}
          alt="Signature"
          style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "6px" }}
        />
      ) : (
        <>
          {/* Dot + label row */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 7, height: 7,
              borderRadius: "50%",
              background: s.dot,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: s.text, letterSpacing: 0.2 }}>
              {STATUS_LABEL[sig.status]}
            </span>
          </div>

          {/* Signer name */}
          <span style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>
            ✍ {sig.signer?.name || "You"}
          </span>
        </>
      )}

      {/* Remove button — only for pending */}
      {sig.status === "pending" && onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(sig._id); }}
          title="Remove placeholder"
          style={{
            position: "absolute",
            top: -8, right: -8,
            width: 18, height: 18,
            borderRadius: "50%",
            background: "#F43F5E",
            border: "none",
            color: "#fff",
            fontSize: 11,
            lineHeight: "18px",
            textAlign: "center",
            cursor: "pointer",
            padding: 0,
            zIndex: 20,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignaturePlacer({ fileId, fileUrl }) {
  const [signatures, setSignatures]     = useState([]);
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(null);
  const [pdfSize, setPdfSize]           = useState({ width: 0, height: 0 });
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);
  const [placingMode, setPlacingMode]   = useState(false); // click-to-place toggle
  const [toast, setToast]               = useState(null);
  const [signingSig, setSigningSig]     = useState(null); // placeholder being signed

  const pdfWrapRef = useRef(null);

  // ── fetch existing signatures from backend ──────────────────────────────────
  const fetchSignatures = () => {
    if (!fileId) return;
    setLoading(true);
    API
      .get(`/signatures/${fileId}`)
      .then((res) => setSignatures(res.data.signatures || []))
      .catch(() => setError("Could not load signatures."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSignatures();
  }, [fileId]);

  // ── handle click on PDF to place a new signature ────────────────────────────
  const handlePdfClick = async (e) => {
    if (!placingMode) return;
    const rect = pdfWrapRef.current.getBoundingClientRect();

    // Convert absolute mouse position → percentage of the PDF container
    const xPercent = ((e.clientX - rect.left)  / rect.width)  * 100;
    const yPercent = ((e.clientY - rect.top)   / rect.height) * 100;

    // Guard: don't place outside the page
    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) return;

    setSaving(true);
    try {
      const res = await API.post(
        "/signatures",
        { fileId, x: xPercent, y: yPercent, page: currentPage, width: 150, height: 50 }
      );
      setSignatures((prev) => [...prev, res.data.signature]);
      showToast("Signature placeholder added ✓");
      setPlacingMode(false); // exit placing mode after one placement
    } catch {
      showToast("Failed to save position.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── remove a placeholder ────────────────────────────────────────────────────
  const handleRemove = async (sigId) => {
    try {
      await API.delete(`/signatures/${sigId}`);
      setSignatures((prev) => prev.filter((s) => s._id !== sigId));
      showToast("Placeholder removed.");
    } catch {
      showToast("Could not remove placeholder.", "error");
    }
  };

  // ── handle signature confirmation ───────────────────────────────────────────
  const handleSignConfirm = async (signatureImage, saveForFuture) => {
    if (!signingSig) return;
    setSaving(true);
    try {
      const res = await API.put(`/signatures/${signingSig._id}/sign`, {
        signatureImage
      });
      // Update local state with the signed signature object
      setSignatures((prev) =>
        prev.map((s) => (s._id === signingSig._id ? res.data.signature : s))
      );
      showToast("Document signed successfully ✓");
      setSigningSig(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to sign placeholder.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── filter signatures for the current page ──────────────────────────────────
  const sigsOnPage = signatures.filter((s) => s.page === currentPage);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyvalue: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
            Signature Placement
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>
            Click "Place Signature" then click anywhere on the document to mark where a signature goes.
          </p>
        </div>

        <button
          onClick={() => setPlacingMode((v) => !v)}
          disabled={saving}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 13,
            background: placingMode ? "#F43F5E" : "#2563EB",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: placingMode
              ? "0 2px 8px rgba(244,63,94,0.35)"
              : "0 2px 8px rgba(37,99,235,0.30)",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          {placingMode ? (
            <><span>✕</span> Cancel Placing</>
          ) : (
            <><span>✍</span> Place Signature</>
          )}
        </button>
      </div>

      {/* ── Placing mode banner ── */}
      {placingMode && (
        <div style={{
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 12,
          fontSize: 13,
          color: "#1D4ED8",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>👆</span>
          <span><strong>Click anywhere on the PDF</strong> to drop a signature placeholder there.</span>
        </div>
      )}

      {/* ── Error state ── */}
      {error && (
        <div style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#BE123C" }}>
          {error}
        </div>
      )}

      {/* ── PDF + Overlay wrapper ── */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          cursor: placingMode ? "crosshair" : "default",
          background: "#F9FAFB",
        }}
        ref={pdfWrapRef}
        onClick={handlePdfClick}
      >
        {/* react-pdf Document */}
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
          loading={
            <div style={{ padding: 40, color: "#9CA3AF", fontSize: 14 }}>Loading PDF…</div>
          }
          error={
            <div style={{ padding: 40, color: "#F43F5E", fontSize: 14 }}>Failed to load PDF.</div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={760}
            onRenderSuccess={(page) => {
              // Capture rendered page dimensions for accurate % → px conversion
              const el = pdfWrapRef.current;
              if (el) setPdfSize({ width: el.offsetWidth, height: el.offsetHeight });
            }}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>

        {/* Signature placeholders rendered as absolute overlays */}
        {pdfSize.width > 0 &&
          sigsOnPage.map((sig) => (
            <SignatureBadge
              key={sig._id}
              sig={sig}
              containerWidth={pdfSize.width}
              containerHeight={pdfSize.height}
              onRemove={handleRemove}
              onSign={setSigningSig}
            />
          ))}

        {/* Saving spinner overlay */}
        {saving && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(255,255,255,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "#2563EB", fontWeight: 600,
            zIndex: 100,
          }}>
            Saving…
          </div>
        )}
      </div>

      {/* ── Page navigation ── */}
      {totalPages && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={navBtnStyle(currentPage <= 1)}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: "#6B7280" }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={navBtnStyle(currentPage >= totalPages)}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Signature list summary ── */}
      {signatures.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Placeholders on this document ({signatures.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {signatures.map((sig) => {
              const s = STATUS_STYLE[sig.status] || STATUS_STYLE.pending;
              return (
                <div key={sig._id} style={{
                  display: "flex", alignItems: "center", justifyvalue: "space-between",
                  background: "#fff", border: "1px solid #E5E7EB",
                  borderRadius: 8, padding: "8px 12px", fontSize: 13,
                }}>
                  <span style={{ color: "#374151" }}>
                    Page {sig.page} — ({Math.round(sig.x)}%, {Math.round(sig.y)}%)
                  </span>
                  <span style={{
                    background: s.bg, color: s.text,
                    border: `1px solid ${s.border}`,
                    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
                  }}>
                    {STATUS_LABEL[sig.status]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Signature Creator Modal ── */}
      <SignatureModal
        isOpen={!!signingSig}
        onClose={() => setSigningSig(null)}
        onConfirm={handleSignConfirm}
      />

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: toast.type === "error" ? "#F43F5E" : "#22C55E",
          color: "#fff", borderRadius: 8, padding: "10px 18px",
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          zIndex: 9999,
          animation: "fadeIn 0.2s ease",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── tiny style helper ─────────────────────────────────────────────────────────
function navBtnStyle(disabled) {
  return {
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid #E5E7EB",
    background: disabled ? "#F3F4F6" : "#fff",
    color: disabled ? "#9CA3AF" : "#374151",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
    fontWeight: 500,
  };
}
