import type { DurableObject, DurableObjectState } from "@cloudflare/workers-types";

export interface VideoData {
  videoId: string;
  title: string;
  subtitles?: string;
  transcript?: string;
  status: "uploading" | "processing" | "ready" | "error";
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export class VideoMetadata implements DurableObject {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/metadata") {
        const data = await this.state.storage.get<VideoData>("data");
        return Response.json(data || {});
      }

      if (request.method === "POST" && url.pathname === "/initialize") {
        const { videoId, title } = await request.json<{ videoId: string; title: string }>();
        const now = Date.now();
        const data: VideoData = {
          videoId,
          title,
          status: "uploading",
          createdAt: now,
          updatedAt: now,
        };
        await this.state.storage.put("data", data);
        return Response.json({ success: true });
      }

      if (request.method === "POST" && url.pathname === "/subtitles") {
        const { subtitles, transcript } = await request.json<{ subtitles: string; transcript: string }>();
        const data = await this.state.storage.get<VideoData>("data");
        if (data) {
          data.subtitles = subtitles;
          data.transcript = transcript;
          data.status = "ready";
          data.updatedAt = Date.now();
          await this.state.storage.put("data", data);
        }
        return Response.json({ success: true });
      }

      if (request.method === "POST" && url.pathname === "/status") {
        const { status, error } = await request.json<{ status: VideoData["status"]; error?: string }>();
        const data = await this.state.storage.get<VideoData>("data");
        if (data) {
          data.status = status;
          data.updatedAt = Date.now();
          if (error) data.error = error;
          await this.state.storage.put("data", data);
        }
        return Response.json({ success: true });
      }

      if (request.method === "POST" && url.pathname === "/delete") {
        await this.state.storage.deleteAll();
        return Response.json({ success: true });
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Unknown" },
        { status: 500 }
      );
    }
  }
}
