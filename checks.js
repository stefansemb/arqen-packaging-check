// Rule-based checks for a YouTube video's packaging: title, description, tags and thumbnail.
// Pure functions (no DOM), so they run in the browser and in `node --test`.

/** One finding: level is "pass", "warn" or "fail". */
const item = (level, area, text) => ({ level, area, text });

/** Characters of a title that fit before YouTube cuts it, roughly, per surface. */
export const TITLE_FITS = { mobile: 70, search: 100, suggested: 55 };

const EMOJI = /\p{Extended_Pictographic}/gu;

export function checkTitle(title) {
  const t = title.trim();
  const out = [];
  if (!t) return [item('fail', 'Title', 'Add a title.')];
  if (t.length > 100) out.push(item('fail', 'Title', `${t.length} characters: YouTube allows 100.`));
  else if (t.length > 70) out.push(item('warn', 'Title', `${t.length} characters: the end is cut off on phones and in suggestions. Keep the hook in the first 50–60.`));
  else if (t.length < 20) out.push(item('warn', 'Title', `Only ${t.length} characters: there may be room for a clearer promise or a keyword.`));
  else out.push(item('pass', 'Title', `${t.length} characters: fits on most surfaces.`));
  const words = t.split(/\s+/).filter((w) => /[A-Za-zÅÄÖåäö]{3,}/.test(w));
  const caps = words.filter((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
  if (words.length && caps.length / words.length > 0.5) out.push(item('warn', 'Title', 'Mostly CAPITALS reads as shouting. Capitalize one or two key words at most.'));
  const emoji = (t.match(EMOJI) || []).length;
  if (emoji > 2) out.push(item('warn', 'Title', `${emoji} emoji: one is plenty, more looks spammy.`));
  if (/[!?]{2,}/.test(t)) out.push(item('warn', 'Title', 'Repeated "!!" or "??" looks like clickbait.'));
  if (/[<>]/.test(t)) out.push(item('fail', 'Title', 'YouTube does not allow < or > in titles.'));
  return out;
}

/** Chapters found in a description: [{ seconds, label }], in order of appearance. */
export function parseChapters(description) {
  const out = [];
  for (const line of description.split('\n')) {
    const m = line.trim().match(/^(?:\(|\[)?((?:\d{1,2}:)?\d{1,2}:\d{2})(?:\)|\])?\s*[-–—:|]?\s*(.+)$/);
    if (!m) continue;
    const parts = m[1].split(':').map(Number);
    const seconds = parts.reduce((acc, n) => acc * 60 + n, 0);
    out.push({ seconds, label: m[2].trim() });
  }
  return out;
}

export function checkChapters(description) {
  const ch = parseChapters(description);
  if (!ch.length) return [item('warn', 'Chapters', 'No chapters. Timestamps (0:00 Intro, 1:20 …) help viewers jump and can show up in search.')];
  const out = [];
  if (ch[0].seconds !== 0) out.push(item('fail', 'Chapters', `The first timestamp must be 0:00 (it is ${fmt(ch[0].seconds)}), or YouTube ignores all chapters.`));
  if (ch.length < 3) out.push(item('fail', 'Chapters', `${ch.length} timestamp${ch.length > 1 ? 's' : ''}: YouTube needs at least 3.`));
  for (let i = 1; i < ch.length; i++) {
    if (ch[i].seconds <= ch[i - 1].seconds) { out.push(item('fail', 'Chapters', `${fmt(ch[i].seconds)} comes after ${fmt(ch[i - 1].seconds)}: timestamps must go up.`)); break; }
    if (ch[i].seconds - ch[i - 1].seconds < 10) { out.push(item('fail', 'Chapters', `"${ch[i - 1].label}" is shorter than 10 seconds: YouTube's minimum.`)); break; }
  }
  if (!out.length) out.push(item('pass', 'Chapters', `${ch.length} chapters, valid.`));
  return out;
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Words from the title worth repeating early in the description (no filler words). */
const STOP = new Set('the a an and or of to in on for with is are was this that it its how why what your you my i we our from at by as be new vs'.split(' '));
export function keywords(title) {
  return [...new Set(title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)))];
}

export function checkDescription(description, title) {
  const d = description.trim();
  if (!d) return [item('fail', 'Description', 'Add a description: the first lines show in search and under the video.')];
  const out = [];
  if (d.length > 5000) out.push(item('fail', 'Description', `${d.length} characters: YouTube allows 5000.`));
  const first = d.slice(0, 150).toLowerCase();
  const kw = keywords(title);
  const hits = kw.filter((w) => first.includes(w));
  if (kw.length && !hits.length) out.push(item('warn', 'Description', 'None of the title\'s key words appear in the first 150 characters, which is what search shows.'));
  else if (kw.length) out.push(item('pass', 'Description', `The opening repeats ${hits.slice(0, 3).map((w) => `"${w}"`).join(', ')} from the title.`));
  if (/^https?:\/\//i.test(d)) out.push(item('warn', 'Description', 'It starts with a link: lead with a sentence about the video, links further down.'));
  const hashtags = d.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || [];
  if (hashtags.length > 15) out.push(item('fail', 'Description', `${hashtags.length} hashtags: over 15 and YouTube ignores all of them.`));
  else if (hashtags.length > 3) out.push(item('warn', 'Description', `${hashtags.length} hashtags: only the first 3 show above the title.`));
  const links = (d.match(/https?:\/\/\S+/g) || []).length;
  if (links > 8) out.push(item('warn', 'Description', `${links} links: a long link list pushes the useful text down.`));
  return out;
}

/** How YouTube counts the tag limit: commas between tags, and quotes around tags with spaces. */
export function tagLength(tags) {
  if (!tags.length) return 0;
  return tags.reduce((n, t) => n + t.length + (/\s/.test(t) ? 2 : 0), 0) + tags.length - 1;
}

export function splitTags(text) {
  return text.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
}

export function checkTags(text) {
  const tags = splitTags(text);
  if (!tags.length) return [item('warn', 'Tags', 'No tags. They matter little, but a few help with misspellings of your topic.')];
  const out = [];
  const len = tagLength(tags);
  if (len > 500) out.push(item('fail', 'Tags', `${len} of 500 characters (YouTube counts commas and quotes): remove some.`));
  else out.push(item('pass', 'Tags', `${tags.length} tags, ${len} of 500 characters.`));
  const seen = new Set();
  const dup = tags.filter((t) => { const k = t.toLowerCase(); if (seen.has(k)) return true; seen.add(k); return false; });
  if (dup.length) out.push(item('warn', 'Tags', `Duplicate: ${[...new Set(dup)].join(', ')}.`));
  if (tags.some((t) => t.length > 100)) out.push(item('fail', 'Tags', 'A tag is longer than 100 characters.'));
  return out;
}

/** info: { width, height, bytes, type } of the uploaded thumbnail, or null. */
export function checkThumbnail(info) {
  if (!info) return [item('warn', 'Thumbnail', 'Upload your thumbnail to see it in the feed and check its size.')];
  const out = [];
  if (info.bytes > 2 * 1024 * 1024) out.push(item('fail', 'Thumbnail', `${(info.bytes / 1048576).toFixed(1)} MB: YouTube's limit is 2 MB. Save it as JPG.`));
  if (!/^image\/(jpeg|png|gif|bmp)$/.test(info.type)) out.push(item('warn', 'Thumbnail', `${info.type || 'This format'} may not upload: YouTube takes JPG, PNG, GIF and BMP.`));
  const ratio = info.width / info.height;
  if (Math.abs(ratio - 16 / 9) > 0.02) out.push(item('warn', 'Thumbnail', `${info.width}×${info.height} is not 16:9, so it gets black bars or a crop.`));
  if (info.width < 1280) out.push(item('warn', 'Thumbnail', `${info.width}×${info.height}: use 1280×720 or larger so it stays sharp on big screens.`));
  if (!out.length) out.push(item('pass', 'Thumbnail', `${info.width}×${info.height}, ${Math.round(info.bytes / 1024)} KB: ready to upload.`));
  return out;
}

export function checkAll({ title, description, tags, thumbnail }) {
  return [
    ...checkTitle(title),
    ...checkThumbnail(thumbnail),
    ...checkDescription(description, title),
    ...checkChapters(description),
    ...checkTags(tags),
  ];
}
