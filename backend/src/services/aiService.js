// Mock AI generation service — swap each function body with real API calls in production.

const CREDIT_COSTS = {
  VIDEO: 20,
  IMAGE: 5,
  AUDIO: 8,
  UGC: 15,
};

// Simulates a delay to mimic real API response time
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateVideo(prompt, options = {}) {
  await delay(2000);
  return {
    resultUrl: `https://storage.presenterai.dev/mock/video-${Date.now()}.mp4`,
    thumbnailUrl: `https://storage.presenterai.dev/mock/thumb-${Date.now()}.jpg`,
    metadata: { duration: 30, resolution: '1080p', fps: 30, ...options },
  };
}

async function generateImage(prompt, options = {}) {
  await delay(1000);
  return {
    resultUrl: `https://storage.presenterai.dev/mock/image-${Date.now()}.png`,
    thumbnailUrl: `https://storage.presenterai.dev/mock/image-${Date.now()}.png`,
    metadata: { width: 1024, height: 1024, format: 'png', ...options },
  };
}

async function generateAudio(prompt, options = {}) {
  await delay(1500);
  return {
    resultUrl: `https://storage.presenterai.dev/mock/audio-${Date.now()}.mp3`,
    thumbnailUrl: null,
    metadata: { duration: 30, voice: options.voice || 'neutral', format: 'mp3' },
  };
}

async function generateUGC(prompt, options = {}) {
  await delay(3000);
  return {
    resultUrl: `https://storage.presenterai.dev/mock/ugc-${Date.now()}.mp4`,
    thumbnailUrl: `https://storage.presenterai.dev/mock/ugc-thumb-${Date.now()}.jpg`,
    metadata: { duration: 15, presenter: options.presenter || 'ai-default', resolution: '1080p' },
  };
}

async function run(mediaType, prompt, options) {
  switch (mediaType) {
    case 'VIDEO': return generateVideo(prompt, options);
    case 'IMAGE': return generateImage(prompt, options);
    case 'AUDIO': return generateAudio(prompt, options);
    case 'UGC':   return generateUGC(prompt, options);
    default: throw new Error(`Unknown media type: ${mediaType}`);
  }
}

module.exports = { run, CREDIT_COSTS };
