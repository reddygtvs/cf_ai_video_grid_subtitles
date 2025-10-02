import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { VideoCard } from "../components/VideoCard";
import type { VideoData } from "../server/durable-objects/video-metadata";

export function GridPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    const hasProcessingVideos = videos.some(v => v.status === "processing" || v.status === "uploading");
    
    if (!hasProcessingVideos) return;

    let attempts = 0;
    const maxAttempts = 20;
    
    const poll = () => {
      if (attempts >= maxAttempts) return;
      
      const delay = Math.min(5000 + (attempts * 5000), 30000);
      attempts++;
      
      setTimeout(() => {
        if (!document.hidden) {
          loadVideos();
        }
        poll();
      }, delay);
    };
    
    poll();
  }, [videos.map(v => `${v.videoId}:${v.status}`).join(',')]);

  async function loadVideos() {
    try {
      const response = await fetch("/api/videos");
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(videoId: string) {
    if (!confirm("Delete this video?")) return;

    try {
      const response = await fetch(`/api/video/${videoId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Video deleted");
        loadVideos();
      } else {
        toast.error("Failed to delete video");
      }
    } catch {
      toast.error("Failed to delete video");
    }
  }

  const processingCount = videos.filter(v => v.status === "processing").length;

  return (
    <div>
      <header className="header">
        <div className="logo">Video Grid + Subtitles</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {processingCount > 0 && (
            <span className="processing-indicator">
              {processingCount} processing...
            </span>
          )}
          <button
            className="btn btn-primary"
            onClick={() => navigate("/upload")}
          >
            Upload Video
          </button>
        </div>
      </header>

      <main>
        {loading ? (
          <div className="empty-state">
            <div className="loading" />
            <p style={{ marginTop: "1rem", color: "#737373" }}>Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="empty-state">
            <h2>No videos yet</h2>
            <p>Upload your first video to get started!</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/upload")}
            >
              Upload Video
            </button>
          </div>
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard
                key={video.videoId}
                video={video}
                onClick={() => {
                  navigate(`/watch/${video.videoId}`);
                }}
                onDelete={() => handleDelete(video.videoId)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
