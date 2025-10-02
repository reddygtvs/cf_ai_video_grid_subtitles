import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function UploadPage() {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);

      const finalTitle = title || selectedFile.name.replace(/\.[^/.]+$/, "");
      formData.append("title", finalTitle);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      toast.success("Video uploaded successfully! Subtitles are being generated in the background.");
      navigate("/");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <header className="header">
        <div className="logo">Video Grid + Subtitles</div>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          Back to Grid
        </button>
      </header>

      <div className="upload-container">
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1.5rem", color: "#0a0a0a" }}>Upload Video</h1>

        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="title" className="label">
            Video Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            className="input"
          />
        </div>

        <div
          className={`upload-area ${dragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {selectedFile ? (
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem", color: "#0a0a0a" }}>{selectedFile.name}</p>
              <p style={{ color: "#737373", fontSize: "0.75rem" }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.25rem", color: "#0a0a0a" }}>
                Drag & drop a video file here
              </p>
              <p style={{ color: "#737373", fontSize: "0.75rem" }}>or click to browse</p>
            </div>
          )}
        </div>

        {selectedFile && (
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading}
              style={{ minWidth: "200px" }}
            >
              {uploading ? (
                <>
                  <span className="loading" style={{ marginRight: "0.5rem" }} />
                  Uploading...
                </>
              ) : (
                "Upload & Generate Subtitles"
              )}
            </button>
          </div>
        )}

        <div className="info-box" style={{ marginTop: "1.5rem" }}>
          <h3>How it works</h3>
          <ul>
            <li>Upload your video file</li>
            <li>AI automatically extracts audio and generates subtitles using Whisper</li>
            <li>Subtitles are synced perfectly with timestamp-accurate WebVTT format</li>
            <li>View your video with subtitles in the grid</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
