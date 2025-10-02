import { SubtitleGenerator } from "./subtitle-generator";

export { VideoMetadata } from "./durable-objects/video-metadata";

function generateId(): string {
  return crypto.randomUUID();
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    try {
      if (url.pathname === "/api/upload" && request.method === "POST") {
        const formData = await request.formData();
        const videoFile = formData.get("video") as File;
        const title = formData.get("title") as string | null;

        if (!videoFile) {
          return Response.json({ error: "No video file" }, { status: 400 });
        }

        const videoId = generateId();

        await env.VIDEOS.put(videoId, videoFile.stream(), {
          httpMetadata: { contentType: videoFile.type },
        });

        const doId = env.VIDEO_METADATA.idFromName(videoId);
        const doStub = env.VIDEO_METADATA.get(doId);

        await doStub.fetch(new Request("http://do/initialize", {
          method: "POST",
          body: JSON.stringify({ videoId, title: title || videoFile.name }),
          headers: { "Content-Type": "application/json" },
        }));

        ctx.waitUntil(
          (async () => {
            try {
              await doStub.fetch(new Request("http://do/status", {
                method: "POST",
                body: JSON.stringify({ status: "processing" }),
                headers: { "Content-Type": "application/json" },
              }));

              const videoObj = await env.VIDEOS.get(videoId);
              if (!videoObj) throw new Error("Video not found in storage");

              const videoBuffer = await videoObj.arrayBuffer();
              const subtitleGen = new SubtitleGenerator(env);
              const { vtt, transcript } = await subtitleGen.generateFromAudio(videoBuffer);

              await doStub.fetch(new Request("http://do/subtitles", {
                method: "POST",
                body: JSON.stringify({ subtitles: vtt, transcript }),
                headers: { "Content-Type": "application/json" },
              }));
            } catch (error) {
              await doStub.fetch(new Request("http://do/status", {
                method: "POST",
                body: JSON.stringify({
                  status: "error",
                  error: error instanceof Error ? error.message : "Unknown error",
                }),
                headers: { "Content-Type": "application/json" },
              }));
            }
          })()
        );

        return Response.json({ videoId, status: "processing" }, { headers: CORS });
      }

      if (url.pathname.startsWith("/api/video/") && request.method === "GET") {
        const videoId = url.pathname.split("/").pop();
        if (!videoId) {
          return Response.json({ error: "Invalid video ID" }, { status: 400 });
        }

        const doId = env.VIDEO_METADATA.idFromName(videoId);
        const doStub = env.VIDEO_METADATA.get(doId);
        const response = await doStub.fetch(new Request("http://do/metadata"));

        const data = await response.json();
        return Response.json(data, { headers: CORS });
      }

      if (url.pathname.startsWith("/api/stream/") && request.method === "GET") {
        const videoId = url.pathname.split("/").pop();
        if (!videoId) {
          return Response.json({ error: "Invalid video ID" }, { status: 400 });
        }

        const videoObj = await env.VIDEOS.get(videoId);
        if (!videoObj) {
          return new Response("Video not found", { status: 404 });
        }

        return new Response(videoObj.body, {
          headers: {
            "Content-Type": videoObj.httpMetadata?.contentType || "video/mp4",
            "Cache-Control": "public, max-age=31536000",
            ...CORS,
          },
        });
      }

      if (url.pathname.startsWith("/api/video/") && request.method === "DELETE") {
        const videoId = url.pathname.split("/").pop();
        if (!videoId) {
          return Response.json({ error: "Invalid video ID" }, { status: 400 });
        }

        await env.VIDEOS.delete(videoId);

        const doId = env.VIDEO_METADATA.idFromName(videoId);
        const doStub = env.VIDEO_METADATA.get(doId);
        await doStub.fetch(new Request("http://do/delete", { method: "POST" }));

        return Response.json({ success: true }, { headers: CORS });
      }

      if (url.pathname === "/api/videos" && request.method === "GET") {
        const listed = await env.VIDEOS.list();
        const videoIds = listed.objects.map(obj => obj.key);

        const videos = await Promise.all(
          videoIds.map(async (videoId) => {
            const doId = env.VIDEO_METADATA.idFromName(videoId);
            const doStub = env.VIDEO_METADATA.get(doId);
            const response = await doStub.fetch(new Request("http://do/metadata"));
            return response.json();
          })
        );

        return Response.json({ videos }, { headers: CORS });
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("Server error:", error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 500, headers: CORS }
      );
    }
  },
} satisfies ExportedHandler<Env>;
