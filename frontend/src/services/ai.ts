export const CREDIT_COSTS: Record<string, number> = {
  VIDEO: 20,
  IMAGE: 5,
  AUDIO: 8,
  UGC: 15,
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mockGenerate(type: string) {
  const t = Date.now();
  await delay(1500);
  const base = 'https://storage.presenterai.dev/mock';
  const map: Record<string, any> = {
    VIDEO: { resultUrl: `${base}/video-${t}.mp4`, thumbnailUrl: `${base}/thumb-${t}.jpg`, metadata: { duration: 30, resolution: '1080p' } },
    IMAGE: { resultUrl: `${base}/image-${t}.png`, thumbnailUrl: `${base}/image-${t}.png`, metadata: { width: 1024, height: 1024 } },
    AUDIO: { resultUrl: `${base}/audio-${t}.mp3`, thumbnailUrl: null, metadata: { duration: 30, format: 'mp3' } },
    UGC:   { resultUrl: `${base}/ugc-${t}.mp4`, thumbnailUrl: `${base}/ugc-thumb-${t}.jpg`, metadata: { duration: 15, presenter: 'ai-default' } },
  };
  return map[type];
}

export async function runGeneration(mediaType: string, prompt: string) {
  return mockGenerate(mediaType);
}
