import { useState, useRef, useEffect } from "react";

export default function SignatureModal({ isOpen, onClose, onConfirm }) {
  const [activeTab, setActiveTab] = useState("draw"); // "draw" or "upload"
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drag, setDrag] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null); // base64 string
  const [fileName, setFileName] = useState("");
  const [saveForFuture, setSaveForFuture] = useState(false);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef(null);

  // Initialize Canvas context styling
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#1C1F2E";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // ─── Drawing logic ─────────────────────────────────────────────────────────
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support touch events
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getCoordinates(e);
    isDrawingRef.current = true;
    lastPosRef.current = pos;
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPosRef.current = pos;
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // ─── File Upload logic ───────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDrag(true);
  };

  const handleDragLeave = () => {
    setDrag(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setFileName("");
  };

  // ─── Submit/Confirm ────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (activeTab === "draw" && hasDrawn && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onConfirm(dataUrl, saveForFuture);
    } else if (activeTab === "upload" && uploadedImage) {
      onConfirm(uploadedImage, saveForFuture);
    }
  };

  // ─── Styling constants ──────────────────────────────────────────────────────
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  const modalStyle = {
    background: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 460,
    padding: "24px",
    position: "relative",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
  };

  const headerStyle = {
    fontSize: 20,
    fontWeight: 700,
    color: "#000000",
    margin: "0 0 16px 0",
    letterSpacing: "-0.01em",
  };

  const tabContainerStyle = {
    display: "flex",
    background: "#F3F4F6",
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    background: active ? "#ffffff" : "transparent",
    color: active ? "#000000" : "#6B7280",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
    transition: "all 0.15s ease",
  });

  const canvasContainerStyle = {
    border: "1px dashed #E5E7EB",
    borderRadius: 12,
    background: "#F9FAFB",
    position: "relative",
    overflow: "hidden",
    height: 180,
  };

  const uploadContainerStyle = {
    border: `2px dashed ${drag ? "#2563EB" : "#D1D5DB"}`,
    borderRadius: 12,
    background: drag ? "#EFF6FF" : "#ffffff",
    height: 180,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const btnPrimaryStyle = (disabled) => ({
    background: disabled ? "#E5E7EB" : "#2563EB",
    color: disabled ? "#9CA3AF" : "#ffffff",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    flex: 1,
    transition: "all 0.15s",
  });

  const btnSecondaryStyle = {
    background: "#E5E7EB",
    color: "#000000",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const isContinueDisabled =
    (activeTab === "draw" && !hasDrawn) ||
    (activeTab === "upload" && !uploadedImage);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            border: "none",
            background: "none",
            fontSize: 20,
            color: "#9CA3AF",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <h3 style={headerStyle}>Create your signature</h3>

        {/* Tab selection */}
        <div style={tabContainerStyle}>
          <button
            onClick={() => setActiveTab("draw")}
            style={tabStyle(activeTab === "draw")}
          >
            Draw
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            style={tabStyle(activeTab === "upload")}
          >
            Upload
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === "draw" ? (
          <div>
            <div style={canvasContainerStyle}>
              <canvas
                ref={canvasRef}
                width={410}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ display: "block", cursor: "crosshair" }}
              />
              {hasDrawn && (
                <button
                  onClick={clearCanvas}
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    background: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid #D1D5DB",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, marginBottom: 16 }}>
              Use your mouse or trackpad to draw your signature.
            </p>
          </div>
        ) : (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            
            {uploadedImage ? (
              <div
                style={{
                  height: 180,
                  border: "1px dashed #E5E7EB",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#F9FAFB",
                  position: "relative",
                }}
              >
                <img
                  src={uploadedImage}
                  alt="Signature preview"
                  style={{ maxHeight: 110, maxWidth: "80%", objectFit: "contain" }}
                />
                
                {/* File badge capsule */}
                <div
                  style={{
                    marginTop: 8,
                    background: "#E5E7EB",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 11,
                    color: "#374151",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{fileName}</span>
                  <button
                    onClick={clearUploadedImage}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#9CA3AF",
                      cursor: "pointer",
                      fontWeight: 700,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={uploadContainerStyle}
              >
                {/* Cloud icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  Drag and drop or click
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                  Browse files
                </p>
              </div>
            )}
            
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, marginBottom: 16 }}>
              Supports PNG, JPG, or SVG signature images.
            </p>
          </div>
        )}

        {/* Save for future contracts checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <input
            type="checkbox"
            id="save-for-future"
            checked={saveForFuture}
            onChange={(e) => setSaveForFuture(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              accentColor: "#000000",
              cursor: "pointer",
            }}
          />
          <label
            htmlFor="save-for-future"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            Save for future contracts
          </label>
        </div>

        {/* Footer actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleContinue}
            disabled={isContinueDisabled}
            style={btnPrimaryStyle(isContinueDisabled)}
          >
            Continue to signing
          </button>
          <button onClick={onClose} style={btnSecondaryStyle}>
            Discard
          </button>
        </div>

      </div>
    </div>
  );
}
