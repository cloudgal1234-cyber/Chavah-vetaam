function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mockGenerate(type: string, prompt: string) {
  const t = Date.now();
  await delay(1500);
  const base = 'https://storage.presenterai.dev/mock';
  const map: Record<string, any> = {
    VIDEO: { resultUrl: `${base}/video-${t}.mp4`, thumbnailUrl: `${base}/thumb-${t}.jpg`, metadata: { duration: 30, resolution: '1080p' } },
    IMAGE: { resultUrl: `${base}/image-${t}.png`, thumbnailUrl: `${base}/image-${t}.png`, metadata: { width: 1024, height: 1024 } },
    AUDIO: { resultUrl: `${base}/audio-${t}.mp3`, thumbnailUrl: null, metadata: { duration: 30, format: 'mp3' } },
    UGC:   { resultUrl: `${base}/ugc-${t}.mp4`, thumbnailUrl: `${base}/ugc-thumb-${t}.jpg`, metadata: { duration: 15, presenter: 'ai-default' } },
    TEXT:  {
      resultUrl: null,
      thumbnailUrl: null,
      metadata: {
        text: generateMockText(prompt),
      },
    },
  };
  return map[type];
}

function generateMockText(prompt: string): string {
  const base = prompt?.trim() || 'המוצר/שירות שלנו';
  return `✨ ${base}\n\nגלה את החוויה שתשנה את חייך — ${base} מציע לך את הטוב ביותר בתחומו. אנחנו מאמינים באיכות, בשירות ובתוצאות שמדברות בעד עצמן.\n\n🔥 למה לבחור בנו?\n• איכות ללא פשרות\n• שירות מקצועי ואישי\n• תוצאות מוכחות\n\n📞 צור קשר עוד היום וקבל ייעוץ חינם!`;
}

export async function runGeneration(mediaType: string, prompt: string) {
  return mockGenerate(mediaType, prompt);
}
