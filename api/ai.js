// Vercel Serverless Function: Google Gemini API-র সামনে নিরাপদ প্রক্সি।
// API key কখনো ব্রাউজারে যায় না, থাকে শুধু Vercel Environment Variables-এ।
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const SYSTEM = 'তুমি বাংলাদেশের HSC ICT (তথ্য ও যোগাযোগ প্রযুক্তি) বিষয়ের শিক্ষক। শুধু ICT পাঠ্যক্রম (এনসিটিবি, একাদশ-দ্বাদশ) সংক্রান্ত প্রশ্নের উত্তর দাও। অন্য বিষয়ের প্রশ্নে বিনয়ের সাথে জানাও যে তুমি শুধু HSC ICT-তে সাহায্য করতে পারো। সহজ বাংলায় ধাপে ধাপে বোঝাও।';
const LIMIT = 20, WINDOW_MS = 10 * 60 * 1000;   // প্রতি IP: ১০ মিনিটে ২০ অনুরোধ (সহজ সুরক্ষা)
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > LIMIT;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'missing_api_key' });

  const allowed = (process.env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (allowed.length && origin && !allowed.includes(origin)) return res.status(403).json({ error: 'forbidden_origin' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const { messages, images } = req.body || {};
  if (!Array.isArray(messages) || !messages.length || messages.length > 9) return res.status(400).json({ error: 'bad_messages' });
  if (messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') return res.status(400).json({ error: 'bad_order' });
  for (const m of messages) {
    if (!['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 9000) return res.status(400).json({ error: 'bad_message' });
  }
  // Gemini-তে assistant-এর নাম "model"
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  if (Array.isArray(images) && images.length) {
    if (images.length > 1) return res.status(400).json({ error: 'too_many_images' });
    const im = images[0];
    if (!/^image\/(jpeg|png|webp|gif)$/.test(im.media_type || '') || typeof im.data !== 'string' || im.data.length > 3_500_000)
      return res.status(400).json({ error: 'bad_image' });
    contents[contents.length - 1].parts.unshift({ inline_data: { mime_type: im.media_type, data: im.data } });
  }

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents,
    generationConfig: Object.assign(
      { maxOutputTokens: 4096, temperature: 0.4 },
      // gemini-2.5-flash-এর "thinking" টোকেন উত্তরের জায়গা খেয়ে ফেলে, তাই বন্ধ রাখা হলো
      /2\.5-flash/.test(MODEL) ? { thinkingConfig: { thinkingBudget: 0 } } : {}
    )
  });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;
  try {
    let r, j;
    for (let i = 0; i < 2; i++) {            // ব্যস্ত (503/500) থাকলে একবার আবার চেষ্টা
      r = await fetch(url, { method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'content-type': 'application/json' }, body });
      j = await r.json().catch(() => ({}));
      if (r.ok || ![500, 503].includes(r.status)) break;
      await new Promise(z => setTimeout(z, 1200));
    }
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: 'upstream', status: r.status, detail: j && j.error && j.error.message });
    const cand = j.candidates && j.candidates[0];
    const text = ((cand && cand.content && cand.content.parts) || []).map(p => p.text || '').join('');
    if (!text) return res.status(502).json({ error: 'empty_reply', detail: (cand && cand.finishReason) || (j.promptFeedback && j.promptFeedback.blockReason) || 'no text' });
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: 'upstream_failed', detail: String(e && e.message || e) });
  }
};
