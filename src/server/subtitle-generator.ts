interface WhisperResult {
  text: string;
  word_count: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  vtt?: string;
}

export class SubtitleGenerator {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async generateFromAudio(audioBuffer: ArrayBuffer): Promise<{ vtt: string; transcript: string }> {
    try {
      const base64Audio = this.arrayBufferToBase64(audioBuffer);

      const result = await this.env.AI.run("@cf/openai/whisper-large-v3-turbo", {
        audio: base64Audio,
        task: "transcribe",
      }) as WhisperResult;

      const vtt = this.generateWebVTT(result);
      const transcript = result.text || "";

      return { vtt, transcript };
    } catch (error) {
      console.error("Subtitle generation error:", error);
      throw new Error(`Failed to generate subtitles: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private generateWebVTT(result: WhisperResult): string {
    if (result.vtt) {
      return result.vtt;
    }

    if (result.words && result.words.length > 0) {
      let vtt = "WEBVTT\n\n";

      const chunks = this.groupWordsIntoChunks(result.words);

      chunks.forEach((chunk, index) => {
        const startTime = this.formatTime(chunk.start);
        const endTime = this.formatTime(chunk.end);
        const text = chunk.words.join(" ");

        vtt += `${index + 1}\n`;
        vtt += `${startTime} --> ${endTime}\n`;
        vtt += `${text}\n\n`;
      });

      return vtt;
    }

    return `WEBVTT\n\n1\n00:00:00.000 --> 00:00:10.000\n${result.text}\n\n`;
  }

  private groupWordsIntoChunks(words: Array<{ word: string; start: number; end: number }>): Array<{
    start: number;
    end: number;
    words: string[];
  }> {
    const chunks: Array<{ start: number; end: number; words: string[] }> = [];
    const maxWordsPerChunk = 10;
    const maxDuration = 5;

    let currentChunk: { start: number; end: number; words: string[] } | null = null;

    for (const word of words) {
      if (!currentChunk) {
        currentChunk = {
          start: word.start,
          end: word.end,
          words: [word.word],
        };
      } else {
        const duration = word.end - currentChunk.start;
        const shouldStartNew =
          currentChunk.words.length >= maxWordsPerChunk || duration >= maxDuration;

        if (shouldStartNew) {
          chunks.push(currentChunk);
          currentChunk = {
            start: word.start,
            end: word.end,
            words: [word.word],
          };
        } else {
          currentChunk.end = word.end;
          currentChunk.words.push(word.word);
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  }
}
