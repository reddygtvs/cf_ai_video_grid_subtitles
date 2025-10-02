import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { VideoData } from "../server/durable-objects/video-metadata";

export function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoId) {
      loadVideo(videoId);
    }
  }, [videoId]);

  useEffect(() => {
    if (!video || video.status !== "processing") return;

    let attempts = 0;
    const maxAttempts = 15;
    
    const poll = () => {
      if (attempts >= maxAttempts) return;
      
      const delay = Math.min(8000 + (attempts * 7000), 30000);
      attempts++;
      
      setTimeout(() => {
        if (!document.hidden && videoId) {
          loadVideo(videoId);
        }
        if (video?.status === "processing") {
          poll();
        }
      }, delay);
    };
    
    poll();
  }, [video?.status, videoId]);

  useEffect(() => {
    if (video?.subtitles && videoRef.current) {
      const tracks = videoRef.current.querySelectorAll("track");
      tracks.forEach((track) => track.remove());

      const blob = new Blob([video.subtitles], { type: "text/vtt" });
      const url = URL.createObjectURL(blob);

      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = "English";
      track.srclang = "en";
      track.src = url;
      track.default = true;

      videoRef.current.appendChild(track);

      if (videoRef.current.textTracks[0]) {
        videoRef.current.textTracks[0].mode = "showing";
      }
    }
  }, [video?.subtitles]);

  async function loadVideo(id: string) {
    try {
      const response = await fetch(`/api/video/${id}`);
      if (!response.ok) throw new Error("Video not found");
      const data = await response.json();
      setVideo(data);
    } catch (err) {
      console.error("Failed to load video:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="loading" />
        <p style={{ marginTop: "1rem", color: "#737373" }}>Loading...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="empty-state">
        <h2 style={{ color: "#dc2626" }}>Video not found</h2>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="logo">Video Grid + Subtitles</div>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          Back to Grid
        </button>
      </header>
      
      <div className="watch-container">
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "#0a0a0a" }}>{video.title}</h1>

      <div className="video-player">
        <video
          ref={videoRef}
          src={`/api/stream/${video.videoId}`}
          controls
          loop
          autoPlay
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%" }}
        >
          Your browser doesn't support video.
        </video>
      </div>

        {video.status === "processing" && (
          <div className="status-box processing" style={{ marginBottom: "1rem" }}>
            <div className="loading" style={{ display: "inline-block", marginRight: "0.5rem" }} />
            Generating subtitles... This page will auto-update.
          </div>
        )}

        {video.status === "error" && (
          <div className="status-box error" style={{ marginBottom: "1rem" }}>
            Error: {video.error || "Unknown error"}
          </div>
        )}

        {video.transcript && (
          <div className="transcript-box" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1rem", color: "#0a0a0a" }}>Transcript</h2>
            <div className="transcript-content">
              {video.transcript}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
