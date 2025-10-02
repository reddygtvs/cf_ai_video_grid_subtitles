import type { VideoData } from "../server/durable-objects/video-metadata";

interface VideoCardProps {
  video: VideoData;
  onClick: () => void;
  onDelete: () => void;
}

export function VideoCard({ video, onClick, onDelete }: VideoCardProps) {
  return (
    <div className="video-card">
      <div onClick={onClick} style={{ cursor: "pointer" }}>
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
        {video.status === "ready" ? (
          <video
            src={`/api/stream/${video.videoId}`}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f5f5f5",
            }}
          >
            {video.status === "processing" && (
              <div className="loading" />
            )}
            {video.status === "error" && (
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
          </div>
        )}
      </div>
      </div>
      <div className="video-info">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="video-title">{video.title || "Untitled Video"}</div>
            <div className="video-status">
              {video.status === "ready" && "Ready"}
              {video.status === "processing" && "Processing..."}
              {video.status === "uploading" && "Uploading..."}
              {video.status === "error" && "Error"}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="delete-btn"
            title="Delete video"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
