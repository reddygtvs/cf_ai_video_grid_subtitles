declare namespace Cloudflare {
  interface Env {
    VIDEO_METADATA: DurableObjectNamespace<import("./src/server/durable-objects/video-metadata").VideoMetadata>;
    VIDEOS: R2Bucket;
    AI: Ai;
  }
}

interface Env extends Cloudflare.Env {}
