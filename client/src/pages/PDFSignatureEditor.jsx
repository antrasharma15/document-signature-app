/**
 * DAY 6 — PDFSignatureEditor.jsx
 *
 * Full PDF editor with drag-and-drop signature field placement.
 *
 * Features:
 *  - Drag a "Signature Field" token from the sidebar onto the PDF
 *  - Drag existing placed fields to reposition them
 *  - Resize fields via a corner handle
 *  - Coordinates stored as % so they survive zoom / screen changes
 *  - POST /api/signatures to persist; DELETE to remove
 *  - Multi-page support with per-page field filtering
 *
 * Props:
 *   fileId  — MongoDB _id of the Document
 *   fileUrl — URL to the uploaded PDF
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useParams } from "react-router-dom";
import API, { API_BASE_URL } from "../api/axios";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import AuditTrail from "../components/AuditTrail";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Constants ────────────────────────────────────────────────────────────────

const PDF_WIDTH     = 720;   // rendered PDF width in px
const FIELD_W_INIT  = 180;   // default signature field width  (px)
const FIELD_H_INIT  =  52;   // default signature field height (px)

const TOKEN = () => localStorage.getItem("token");

const authHeader = () => ({ Authorization: `Bearer ${TOKEN()}` });

// ─── Colour tokens ────────────────────────────────────────────────────────────

const C = {
  blue:       "#2563EB",
  blueLight:  "#EFF6FF",
  blueBorder: "#BFDBFE",
  green:      "#16A34A",
  greenLight: "#F0FDF4",
  red:        "#DC2626",
  redLight:   "#FFF1F2",
  ink:        "#111827",
  muted:      "#6B7280",
  border:     "#E5E7EB",
  surface:    "#FFFFFF",
  canvas:     "#F3F4F6",
};

// ─── Utility: px → % relative to a container rect ────────────────────────────

function toPercent(px, containerPx) {
  return (px / containerPx) * 100;
}

function fromPercent(pct, containerPx) {
  return (pct / 100) * containerPx;
}

// ─── SignatureField ───────────────────────────────────────────────────────────
// A single draggable / resizable field rendered on the PDF overlay

function SignatureField({ field, containerRect, onMoveEnd, onResizeEnd, onDelete, selected, onSelect }) {
  const fieldRef    = useRef(null);
  const dragStart   = useRef(null); // { mouseX, mouseY, origXpct, origYpct }
  const resizeStart = useRef(null); // { mouseX, mouseY, origWpx, origHpx }

  const left   = fromPercent(field.x,      containerRect.width);
  const top    = fromPercent(field.y,      containerRect.height);
  const width  = field.widthPx  || FIELD_W_INIT;
  const height = field.heightPx || FIELD_H_INIT;

  const isSigned = field.status === "signed";

  // ── drag to move ────────────────────────────────────────────────────────────

  const onMouseDownField = (e) => {
    if (isSigned) return; // Locked if signed
    if (e.target.dataset.role === "resize") return; // let resize handle own it
    e.preventDefault();
    e.stopPropagation();
    onSelect(field.id);

    dragStart.current = {
      mouseX:   e.clientX,
      mouseY:   e.clientY,
      origXpct: field.x,
      origYpct: field.y,
    };

    const onMove = (mv) => {
      if (!dragStart.current || !containerRect) return;
      const dx = mv.clientX - dragStart.current.mouseX;
      const dy = mv.clientY - dragStart.current.mouseY;

      // New position in % — clamped so field stays inside the PDF
      const newXpct = Math.min(
        Math.max(0, dragStart.current.origXpct + toPercent(dx, containerRect.width)),
        toPercent(containerRect.width - width, containerRect.width)
      );
      const newYpct = Math.min(
        Math.max(0, dragStart.current.origYpct + toPercent(dy, containerRect.height)),
        toPercent(containerRect.height - height, containerRect.height)
      );

      // Live-move the element for responsiveness (no re-render)
      if (fieldRef.current) {
        fieldRef.current.style.left = `${fromPercent(newXpct, containerRect.width)}px`;
        fieldRef.current.style.top  = `${fromPercent(newYpct, containerRect.height)}px`;
      }
      dragStart.current._newX = newXpct;
      dragStart.current._newY = newYpct;
    };

    const onUp = () => {
      if (dragStart.current?._newX != null) {
        onMoveEnd(field.id, dragStart.current._newX, dragStart.current._newY);
      }
      dragStart.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  // ── drag corner handle to resize ────────────────────────────────────────────

  const onMouseDownResize = (e) => {
    if (isSigned) return; // Locked if signed
    e.preventDefault();
    e.stopPropagation();

    resizeStart.current = {
      mouseX:  e.clientX,
      mouseY:  e.clientY,
      origW:   width,
      origH:   height,
    };

    const onMove = (mv) => {
      if (!resizeStart.current) return;
      const newW = Math.max(80,  resizeStart.current.origW + (mv.clientX - resizeStart.current.mouseX));
      const newH = Math.max(30,  resizeStart.current.origH + (mv.clientY - resizeStart.current.mouseY));

      if (fieldRef.current) {
        fieldRef.current.style.width  = `${newW}px`;
        fieldRef.current.style.height = `${newH}px`;
      }
      resizeStart.current._newW = newW;
      resizeStart.current._newH = newH;
    };

    const onUp = () => {
      if (resizeStart.current?._newW) {
        onResizeEnd(field.id, resizeStart.current._newW, resizeStart.current._newH);
      }
      resizeStart.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  const isSaved  = field.saved;
  const bgColor  = isSigned ? "#F0FDF4" : (selected ? "#EFF6FF" : "#F0F9FF");
  const border   = isSigned
    ? `1.5px solid ${C.green}`
    : (selected
      ? `2px solid ${C.blue}`
      : `1.5px dashed ${isSaved ? C.blue : "#93C5FD"}`);

  return (
    <div
      ref={fieldRef}
      onMouseDown={onMouseDownField}
      style={{
        position:    "absolute",
        left:        `${left}px`,
        top:         `${top}px`,
        width:       `${width}px`,
        height:      `${height}px`,
        background:  bgColor,
        border,
        borderRadius: 6,
        cursor:      isSigned ? "default" : "move",
        userSelect:  "none",
        boxShadow:   selected && !isSigned
          ? "0 0 0 3px rgba(37,99,235,0.18)"
          : "0 1px 4px rgba(0,0,0,0.08)",
        zIndex:      selected ? 20 : 10,
        display:     "flex",
        flexDirection: "column",
        alignItems:  "center",
        justifyContent: "center",
        transition:  "box-shadow 0.12s",
      }}
    >
      {isSigned ? (
        field.signatureImage ? (
          <img
            src={field.signatureImage}
            alt="Signature"
            style={{ width: "90%", height: "90%", objectFit: "contain", pointerEvents: "none" }}
          />
        ) : (
          <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>Signed</span>
        )
      ) : (
        <>
          {/* Pen icon + label */}
          <span style={{ fontSize: 15, lineHeight: 1 }}>✍️</span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: C.blue,
            letterSpacing: 0.3, marginTop: 2,
          }}>
            Signature Field
          </span>
        </>
      )}

      {field.signerName && !isSigned && (
        <span style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>
          {field.signerName}
        </span>
      )}

      {/* Delete button (only for unsigned fields) */}
      {!isSigned && (
        <button
          onMouseDown={(e) => { e.stopPropagation(); onDelete(field.id); }}
          title="Remove field"
          style={{
            position:     "absolute",
            top: -9, right: -9,
            width: 19, height: 19,
            borderRadius: "50%",
            background:   C.red,
            border:       "none",
            color:        "#fff",
            fontSize:     12,
            lineHeight:   "19px",
            textAlign:    "center",
            cursor:       "pointer",
            padding:      0,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            fontWeight:   700,
          }}
        >
          ×
        </button>
      )}

      {/* Resize handle (bottom-right corner - only for unsigned fields) */}
      {!isSigned && (
        <div
          data-role="resize"
          onMouseDown={onMouseDownResize}
          title="Drag to resize"
          style={{
            position:   "absolute",
            bottom: 0, right: 0,
            width: 14, height: 14,
            cursor:     "se-resize",
            display:    "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding:    2,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill={C.blue} style={{ pointerEvents: "none" }}>
            <path d="M8 0L0 8h8V0z" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Token ────────────────────────────────────────────────────────────
// The draggable chip in the left panel the user picks up and drops onto the PDF

function SidebarToken({ onDragStart }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        display:       "flex",
        alignItems:    "center",
        gap:           10,
        padding:       "11px 14px",
        background:    C.blueLight,
        border:        `1.5px dashed ${C.blue}`,
        borderRadius:  8,
        cursor:        "grab",
        userSelect:    "none",
        marginBottom:  8,
        transition:    "box-shadow 0.15s",
      }}
      onMouseOver={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(37,99,235,0.18)"}
      onMouseOut={e  => e.currentTarget.style.boxShadow = "none"}
    >
      <span style={{ fontSize: 20 }}>✍️</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>Signature Field</div>
        <div style={{ fontSize: 11, color: C.muted }}>Drag onto the document</div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }) {
  return (
    <div style={{
      position:     "fixed",
      bottom:       24,
      right:        24,
      background:   type === "error" ? C.red : C.green,
      color:        "#fff",
      borderRadius: 8,
      padding:      "10px 18px",
      fontSize:     13,
      fontWeight:   600,
      boxShadow:    "0 4px 16px rgba(0,0,0,0.18)",
      zIndex:       9999,
      pointerEvents: "none",
    }}>
      {msg}
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export default function PDFSignatureEditor({ fileId: propFileId, onClose }) {
  const { id: routeFileId } = useParams();
  const fileId = propFileId || routeFileId;
  const [fileUrl, setFileUrl] = useState(null);

  // PDF state
  const [totalPages, setTotalPages]  = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfReady, setPdfReady]      = useState(false);

  // Load document URL on mount
  useEffect(() => {
    if (!fileId) return;
    API.get(`/docs/${fileId}`)
      .then(res => {
        const doc = res.data.document;
        const name = doc.fileName || doc.filename || doc.filePath?.split(/[\\/]/).pop();
        setFileUrl(`${API_BASE_URL}/uploads/${name}`);
      })
      .catch(() => showToast("Could not load document.", "error"));
  }, [fileId]);

  // Fields: local working state (includes unsaved fields before POST)
  // { id, x, y, widthPx, heightPx, page, saved, _id (when saved), signerName }
  const [fields, setFields]       = useState([]);
  const [selectedId, setSelected] = useState(null);

  // Drag-from-sidebar state
  const dragOffsetRef = useRef({ x: 0, y: 0 }); // offset within the token when drag started

  // Container ref for coordinate math
  const canvasRef = useRef(null);

  // UI state
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [signerEmail, setSignerEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const handleDeleteDoc = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this document?")) return;
    try {
      await API.delete(`/docs/${fileId}`);
      showToast("Document deleted successfully ✓");
      if (onClose) {
        setTimeout(() => onClose(true), 1000);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete document", "error");
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      showToast("Finalizing document...", "success");
      const res = await API.post(`/signatures/finalize/${fileId}`);
      const { downloadUrl, signedFile } = res.data;

      const requestUrl = downloadUrl.startsWith("/api")
        ? downloadUrl.replace("/api", "")
        : downloadUrl;

      const fileRes = await API.get(requestUrl, {
        responseType: "blob"
      });

      const blobUrl = window.URL.createObjectURL(new Blob([fileRes.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = signedFile || "signed_document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      showToast("Signed PDF downloaded! ✓");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to finalize document", "error");
    } finally {
      setFinalizing(false);
    }
  };

  const handleSendForSigning = async () => {
    if (!signerEmail) return alert("Enter signer's email");
    try {
      setSending(true);
      await API.post(`/signatures/send/${fileId}`, { signerEmail });
      showToast(`Signing link sent to ${signerEmail} ✓`);
      setSignerEmail("");
    } catch (err) {
      console.error(err);
      showToast("Failed to send link", "error");
    } finally {
      setSending(false);
    }
  };

  // ── fetch saved signatures on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!fileId) return;
    API.get(`/signatures/${fileId}`)
      .then(res => {
        const saved = (res.data.signatures || []).map(s => ({
          id:        s._id,
          _id:       s._id,
          x:         s.x,
          y:         s.y,
          widthPx:   s.width  || FIELD_W_INIT,
          heightPx:  s.height || FIELD_H_INIT,
          page:      s.page,
          saved:     true,
          signerName: s.signer?.name || "",
          status:    s.status,
          signatureImage: s.signatureImage,
        }));
        setFields(saved);
      })
      .catch(() => showToast("Could not load existing fields.", "error"));
  }, [fileId]);

  // ── toast helper ─────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── get live container rect ──────────────────────────────────────────────────
  const getRect = () => canvasRef.current?.getBoundingClientRect() || { width: 1, height: 1 };

  // ── drag-from-sidebar: HTML5 drag/drop API ────────────────────────────────────

  const handleTokenDragStart = (e) => {
    // Record where within the token the user grabbed (for accurate drop position)
    const tokenRect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - tokenRect.left,
      y: e.clientY - tokenRect.top,
    };
    // Pass a type identifier
    e.dataTransfer.setData("text/plain", "signature-field");
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.getData("text/plain") !== "signature-field") return;

    const rect = getRect();

    // px position of the drop point, accounting for drag offset within the token
    const rawX = e.clientX - rect.left - dragOffsetRef.current.x;
    const rawY = e.clientY - rect.top  - dragOffsetRef.current.y;

    // Clamp so field stays inside the PDF canvas
    const clampedX = Math.min(Math.max(0, rawX), rect.width  - FIELD_W_INIT);
    const clampedY = Math.min(Math.max(0, rawY), rect.height - FIELD_H_INIT);

    // Convert to %
    const xPct = toPercent(clampedX, rect.width);
    const yPct = toPercent(clampedY, rect.height);

    const tempId = `local-${Date.now()}`;
    const newField = {
      id:       tempId,
      x:        xPct,
      y:        yPct,
      widthPx:  FIELD_W_INIT,
      heightPx: FIELD_H_INIT,
      page:     currentPage,
      saved:    false,
    };

    setFields(prev => [...prev, newField]);
    setSelected(tempId);
  };

  // ── move an existing field (after mouse-drag ends) ────────────────────────────
  const handleMoveEnd = useCallback((id, newXpct, newYpct) => {
    setFields(prev => prev.map(f =>
      f.id === id ? { ...f, x: newXpct, y: newYpct } : f
    ));
  }, []);

  // ── resize an existing field ──────────────────────────────────────────────────
  const handleResizeEnd = useCallback((id, newW, newH) => {
    setFields(prev => prev.map(f =>
      f.id === id ? { ...f, widthPx: newW, heightPx: newH } : f
    ));
  }, []);

  // ── delete a field (local + backend if saved) ─────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    const field = fields.find(f => f.id === id);
    if (!field) return;

    if (field.saved && field._id) {
      try {
        await API.delete(`/signatures/${field._id}`);
      } catch {
        showToast("Could not remove field from server.", "error");
        return;
      }
    }
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedId === id) setSelected(null);
    showToast("Field removed.");
  }, [fields, selectedId]);

  // ── Save all unsaved fields to backend ───────────────────────────────────────
  const handleSaveAll = async () => {
    const unsaved = fields.filter(f => !f.saved);
    if (unsaved.length === 0) {
      showToast("All fields are already saved.");
      return;
    }

    setSaving(true);
    const rect = getRect();

    try {
      const saved = await Promise.all(
        unsaved.map(f =>
          API.post(
            "/signatures",
            {
              fileId,
              x:      f.x,
              y:      f.y,
              page:   f.page,
              width:  f.widthPx,
              height: f.heightPx,
            }
          ).then(res => ({ tempId: f.id, sig: res.data.signature }))
        )
      );

      // Replace temp local fields with server-confirmed ones
      setFields(prev => {
        const updatedMap = Object.fromEntries(saved.map(s => [s.tempId, s.sig]));
        return prev.map(f => {
          if (!updatedMap[f.id]) return f;
          const sig = updatedMap[f.id];
          return {
            id:        sig._id,
            _id:       sig._id,
            x:         sig.x,
            y:         sig.y,
            widthPx:   sig.width  || f.widthPx,
            heightPx:  sig.height || f.heightPx,
            page:      sig.page,
            saved:     true,
            signerName: sig.signer?.name || "",
            status:    sig.status,
            signatureImage: sig.signatureImage,
          };
        });
      });

      showToast(`${unsaved.length} field${unsaved.length > 1 ? "s" : ""} saved ✓`);
    } catch {
      showToast("Failed to save some fields.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── filtered fields for the current page ────────────────────────────────────
  const pageFields = fields.filter(f => f.page === currentPage);
  const unsavedCount = fields.filter(f => !f.saved).length;

  // ─── Container rect for passing to fields ────────────────────────────────────
  // We use a live ref-based getter; fields receive it from parent on event
  const [containerRect, setContainerRect] = useState({ width: PDF_WIDTH, height: 900 });

  const onPageRenderSuccess = () => {
    if (canvasRef.current) {
      const r = canvasRef.current.getBoundingClientRect();
      setContainerRect({ width: r.width, height: r.height });
      setPdfReady(true);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display:    "flex",
      gap:        0,
      height:     propFileId ? "100%" : "calc(100vh - 64px)",
      fontFamily: "'Inter', system-ui, sans-serif",
      background: C.canvas,
      overflow:   "hidden",
    }}>

      {/* ── Left Sidebar ── */}
      <aside style={{
        width:      260,
        flexShrink: 0,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        padding:    "20px 16px",
        display:    "flex",
        flexDirection: "column",
        gap:        16,
        overflowY:  "auto",
      }}>
        <div>
          <p style={{
            margin:     "0 0 4px",
            fontSize:   11,
            fontWeight: 700,
            color:      C.muted,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Field Types
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: C.muted }}>
            Drag a field onto the document to mark where a signature goes.
          </p>
          <SidebarToken onDragStart={handleTokenDragStart} />
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${C.border}` }} />

        {/* Page navigator */}
        <div>
          <p style={{
            margin:     "0 0 8px",
            fontSize:   11,
            fontWeight: 700,
            color:      C.muted,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Pages
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => { setCurrentPage(p => p - 1); setSelected(null); }}
              style={navBtn(currentPage <= 1)}
            >←</button>
            <span style={{ fontSize: 13, color: C.ink, flex: 1, textAlign: "center" }}>
              {currentPage} / {totalPages || "—"}
            </span>
            <button
              disabled={!totalPages || currentPage >= totalPages}
              onClick={() => { setCurrentPage(p => p + 1); setSelected(null); }}
              style={navBtn(!totalPages || currentPage >= totalPages)}
            >→</button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${C.border}` }} />

        {/* Field list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <p style={{
            margin:     "0 0 8px",
            fontSize:   11,
            fontWeight: 700,
            color:      C.muted,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Placed Fields ({fields.length})
          </p>
          {fields.length === 0 && (
            <p style={{ fontSize: 12, color: C.muted }}>
              No fields yet. Drag a Signature Field onto the document.
            </p>
          )}
          {fields.map(f => (
            <div
              key={f.id}
              onClick={() => { setCurrentPage(f.page); setSelected(f.id); }}
              style={{
                display:      "flex",
                alignItems:   "center",
                justifyContent: "space-between",
                padding:      "7px 10px",
                borderRadius: 6,
                border:       `1px solid ${selectedId === f.id ? C.blue : C.border}`,
                background:   selectedId === f.id ? C.blueLight : C.surface,
                marginBottom: 4,
                cursor:       "pointer",
                fontSize:     12,
              }}
            >
              <span style={{ color: C.ink }}>
                ✍️ Page {f.page}
              </span>
              <span style={{
                fontSize:     10,
                fontWeight:   600,
                color:        f.status === "signed" ? C.green : (f.saved ? C.blue : C.blue),
                background:   f.status === "signed" ? C.greenLight : (f.saved ? C.blueLight : C.blueLight),
                borderRadius: 20,
                padding:      "2px 8px",
              }}>
                {f.status === "signed" ? "Signed" : (f.saved ? "Saved" : "Unsaved")}
              </span>
            </div>
          ))}
        </div>

        {/* Send for Signing Form */}
        <div>
          <p style={{
            margin:     "0 0 8px",
            fontSize:   11,
            fontWeight: 700,
            color:      C.muted,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Send for Signing
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              type="email"
              placeholder="Signer's email address"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={handleSendForSigning}
              disabled={sending}
              style={{
                width: "100%",
                padding: "9px",
                borderRadius: 6,
                border: "none",
                background: sending ? "#D1D5DB" : C.blue,
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Sending..." : "📨 Send for Signing"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${C.border}` }} />

        {/* Save button */}
        <button
          onClick={handleSaveAll}
          disabled={saving || unsavedCount === 0}
          style={{
            padding:      "11px",
            borderRadius: 8,
            border:       "none",
            background:   saving || unsavedCount === 0 ? "#D1D5DB" : C.blue,
            color:        saving || unsavedCount === 0 ? C.muted : "#fff",
            fontWeight:   700,
            fontSize:     14,
            cursor:       saving || unsavedCount === 0 ? "not-allowed" : "pointer",
            boxShadow:    unsavedCount > 0 ? "0 2px 10px rgba(37,99,235,0.28)" : "none",
            transition:   "background 0.2s",
            marginBottom: 10,
          }}
        >
          {saving
            ? "Saving…"
            : unsavedCount > 0
              ? `Save ${unsavedCount} Field${unsavedCount > 1 ? "s" : ""}`
              : "All Saved ✓"}
        </button>

        {fields.some(f => f.status === "signed") && (
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            style={{
              padding:      "11px",
              borderRadius: 8,
              border:       "none",
              background:   finalizing ? "#D1D5DB" : "#16A34A",
              color:        "#fff",
              fontWeight:   700,
              fontSize:     14,
              cursor:       finalizing ? "not-allowed" : "pointer",
              boxShadow:    "0 2px 8px rgba(22,163,74,0.30)",
              transition:   "background 0.2s",
              marginBottom: 10,
            }}
          >
            {finalizing ? "Finalizing…" : "✅ Finalize & Download"}
          </button>
        )}

        <button
          onClick={handleDeleteDoc}
          style={{
            padding:      "11px",
            borderRadius: 8,
            border:       `1px solid ${C.red}`,
            background:   "transparent",
            color:        C.red,
            fontWeight:   700,
            fontSize:     14,
            cursor:       "pointer",
            transition:   "all 0.2s",
            marginBottom: 10,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.red;
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = C.red;
          }}
        >
          🗑️ Delete Document
        </button>

        <AuditTrail docId={fileId} />
      </aside>

      {/* ── Main Canvas ── */}
      <main style={{
        flex:      1,
        overflowY: "auto",
        padding:   "28px 32px",
        display:   "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>

        {/* Drop-zone instruction banner */}
        {isDragOver && (
          <div style={{
            position:     "fixed",
            inset:        0,
            background:   "rgba(37,99,235,0.08)",
            border:       `3px dashed ${C.blue}`,
            zIndex:       50,
            pointerEvents: "none",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
          }}>
            <div style={{
              background:   C.blue,
              color:        "#fff",
              borderRadius: 12,
              padding:      "16px 28px",
              fontSize:     18,
              fontWeight:   700,
            }}>
              Drop to place signature field
            </div>
          </div>
        )}

        {/* PDF + overlay */}
        <div
          ref={canvasRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => setSelected(null)}
          style={{
            position:     "relative",
            width:        `${PDF_WIDTH}px`,
            background:   C.surface,
            borderRadius: 8,
            boxShadow:    "0 4px 32px rgba(0,0,0,0.10)",
            border:       isDragOver
              ? `2px dashed ${C.blue}`
              : `1px solid ${C.border}`,
            overflow:     "hidden",
            transition:   "border 0.15s",
          }}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
            loading={<Placeholder text="Loading PDF…" />}
            error={<Placeholder text="Failed to load PDF." color={C.red} />}
          >
            <Page
              pageNumber={currentPage}
              width={PDF_WIDTH}
              onRenderSuccess={onPageRenderSuccess}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>

          {/* Signature field overlays */}
          {pdfReady && pageFields.map(field => (
            <SignatureField
              key={field.id}
              field={field}
              containerRect={containerRect}
              onMoveEnd={handleMoveEnd}
              onResizeEnd={handleResizeEnd}
              onDelete={handleDelete}
              selected={selectedId === field.id}
              onSelect={setSelected}
            />
          ))}

          {/* Empty-state hint when no fields on page */}
          {pdfReady && pageFields.length === 0 && (
            <div style={{
              position:       "absolute",
              bottom:         20,
              left:           "50%",
              transform:      "translateX(-50%)",
              background:     "rgba(255,255,255,0.88)",
              border:         `1px dashed ${C.border}`,
              borderRadius:   8,
              padding:        "8px 18px",
              fontSize:       13,
              color:          C.muted,
              pointerEvents:  "none",
              whiteSpace:     "nowrap",
            }}>
              Drag a Signature Field from the sidebar and drop it here
            </div>
          )}
        </div>

        {/* Coordinate debug info for selected field (helpful during dev) */}
        {selectedId && (() => {
          const f = fields.find(x => x.id === selectedId);
          if (!f) return null;
          return (
            <div style={{
              marginTop:    12,
              fontSize:     12,
              color:        C.muted,
              background:   C.surface,
              border:       `1px solid ${C.border}`,
              borderRadius: 6,
              padding:      "6px 14px",
              display:      "flex",
              gap:          16,
            }}>
              <span>x: <strong>{f.x.toFixed(2)}%</strong></span>
              <span>y: <strong>{f.y.toFixed(2)}%</strong></span>
              <span>page: <strong>{f.page}</strong></span>
              <span>w: <strong>{f.widthPx}px</strong></span>
              <span>h: <strong>{f.heightPx}px</strong></span>
              <span style={{ color: f.saved ? C.green : C.blue, fontWeight: 600 }}>
                {f.saved ? "● Saved" : "○ Unsaved"}
              </span>
            </div>
          );
        })()}
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function Placeholder({ text, color = "#9CA3AF" }) {
  return (
    <div style={{
      padding:    60,
      textAlign:  "center",
      color,
      fontSize:   14,
    }}>
      {text}
    </div>
  );
}

function navBtn(disabled) {
  return {
    width:        32,
    height:       32,
    borderRadius: 6,
    border:       `1px solid ${C.border}`,
    background:   disabled ? C.canvas : C.surface,
    color:        disabled ? C.muted  : C.ink,
    cursor:       disabled ? "not-allowed" : "pointer",
    fontSize:     16,
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    padding:      0,
  };
}
