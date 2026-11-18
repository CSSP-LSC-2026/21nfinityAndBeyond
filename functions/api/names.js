import { neon } from "@neondatabase/serverless";

const WHOLE_WORD_BLOCKED = ["dick", "fag", "rape", "coon"];
const BLOCKED_WORDS = [
  "fuck", "fucking", "fucker", "fuckface", "motherfucker", "fck", "fuk", "fuq", "phuck",
  "shit", "shitty", "bullshit", "bullshitter", "shithead", "shitbag", "shitfuck", "shite", "bitch", "bitches", "sonofabitch", "bastard",
  "asshole", "arsehole", "asswipe", "asshat", "dumbass", "jackass", "cunt", "dickhead", "cock", "cocksucker", "pussy", "whore", "slut", "twat", "prick",
  "wanker", "bollocks", "tosser", "fucktard", "porn", "pornhub", "hentai", "dildo", "handjob", "blowjob", "rimjob", "jerkoff", "jackoff", "masturbate", "masturbation", "cumshot", "cumslut", "jizz", "orgasm", "titties", "boobs", "boobies", "ballsack", "rapist", "molest", "pedophile", "bestiality",
  "nigger", "nigga", "faggot", "dyke", "kike", "chink", "spic", "wetback", "tranny", "retard", "raghead",
  "putangina", "putanginamo", "putanginaka", "potangina", "potanginamo", "tangina", "tanginamo", "tanginaka", "tngina", "tngn", "amputa", "ampota", "pota", "puta", "pukinamo", "pukinangina", "pakingshet",
  "puki", "puke", "pekpek", "kiki", "tite", "titi", "etits", "burat", "kantot", "kantutan", "jakol", "pokpok",
  "gago", "gaga", "gagi", "bobo", "tanga", "ulol", "kupal", "tarantado", "punyeta", "pakshet", "pakshit", "pakyu",
  "leche", "letse", "lintik", "hinayupak", "buwisit", "bwisit", "yawa", "buang", "bilat", "bayag", "hayopka", "siraulo", "inutil", "peste", "pisti", "yati", "atay", "amaw", "pistingyawa"
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function moderationText(value) {
  return String(value || "").toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[4@]/g, "a").replace(/[3]/g, "e").replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o").replace(/[5$]/g, "s").replace(/[7+]/g, "t")
    .replace(/ph/g, "f");
}
function moderationPattern(word) {
  return moderationText(word).replace(/[^a-z]/g, "").split("").map((letter) => `${letter}+`).join("[^a-z]*");
}
function isBlocked(name) {
  const separated = moderationText(name);
  const wholeWordBlocked = WHOLE_WORD_BLOCKED.some((word) => {
    return new RegExp(`(?:^|[^a-z])${moderationPattern(word)}(?:$|[^a-z])`).test(separated);
  });
  return wholeWordBlocked || BLOCKED_WORDS.some((word) => new RegExp(moderationPattern(word)).test(separated));
}
function validateName(rawName) {
  if (typeof rawName !== "string") return { ok: false, message: "Please enter a name." };
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, message: "Please enter a name." };
  if ([...name].length > 30) return { ok: false, message: "Names must be 30 characters or fewer." };
  if (/[,;&/+]|\band\b/i.test(name)) return { ok: false, message: "Please submit one explorer per entry." };
  if (isBlocked(name)) return { ok: false, message: "Please choose a nickname without profanity or slurs." };
  return { ok: true, name };
}

export async function onRequestGet({ env }) {
  if (!env.DATABASE_URL) return json({ ok: false, message: "Neon DATABASE_URL is not configured for this Pages environment." }, 503);
  try {
    const sql = neon(env.DATABASE_URL);
    const rows = await sql`SELECT name FROM explorers ORDER BY id DESC LIMIT 1000`;
    return json({ ok: true, names: rows.map(({ name }) => ({ name })) });
  } catch (error) {
    console.error("Could not read explorer names from Neon:", error);
    return json({ ok: false, message: "The shared adventure wall is temporarily unavailable." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DATABASE_URL) return json({ ok: false, message: "Neon DATABASE_URL is not configured for this Pages environment." }, 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Please send a valid name." }, 400);
  }

  const checked = validateName(body?.name);
  if (!checked.ok) return json(checked, 400);

  try {
    const sql = neon(env.DATABASE_URL);
    const inserted = await sql`
      INSERT INTO explorers (name) VALUES (${checked.name})
      ON CONFLICT DO NOTHING
      RETURNING name
    `;
    return json({ ok: true, name: checked.name, duplicate: inserted.length === 0 });
  } catch (error) {
    console.error("Could not save explorer name to Neon:", error);
    return json({ ok: false, message: "The shared adventure wall is temporarily unavailable." }, 500);
  }
}
