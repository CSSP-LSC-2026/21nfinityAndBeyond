/*
 * 21nfinityAndBeyond — small, framework-free interaction layer.
 * Easy edits: palette lives in styles.css; letter copy and Apps Script URL live here.
 */
const LETTER_COPY = "Dear CSSP Student, you've been chosen for something special. CSSP College Week is here, and this year we're going to infinity and beyond. Grab your friends, find your spark, and make this week one to remember. Sign the board below to show you're part of the adventure. Signed, The CSSP College Week Team";
// Paste the deployed Google Apps Script web-app URL here to sync names for all visitors.
// Leave empty to use this browser's localStorage only.
const GOOGLE_APPS_SCRIPT_URL = "";
const STORAGE_KEY = "21nfinityAndBeyond.explorers.v1";
const TAG_COLORS = ["tag-yellow", "tag-red", "tag-blue", "tag-green", "tag-pink"];
const PROFANITY = ["fuck", "shit", "bitch", "bastard", "asshole", "cunt", "dickhead", "slut", "whore"];

const $ = (selector) => document.querySelector(selector);
const stage = $(".scene-stage");
const box = $("#atticBox");
const openBoxButton = $("#openBox");
const dialog = $("#letterDialog");
const nameForm = $("#nameForm");
const nameInput = $("#nameInput");
const nameTags = $("#nameTags");
const formMessage = $("#formMessage");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let names = [];
let soundEnabled = false;
let audioContext;
let toastTimer;
let jsonpSequence = 0;

$("#letterBody").textContent = LETTER_COPY;

function readLocalNames() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.name === "string") : [];
  } catch (_) { return []; }
}
function saveLocalNames() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(names)); } catch (_) { /* private browsing/storage disabled */ }
}
function normalizeName(value) { return value.trim().replace(/\s+/g, " "); }
function isProfane(value) {
  const compact = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  return PROFANITY.some((word) => compact.includes(word.replace(/[^a-z0-9]/g, "")));
}
function duplicateName(value) { return names.some((item) => item.name.toLocaleLowerCase() === value.toLocaleLowerCase()); }
function updateCount() {
  const count = names.length;
  $("#explorerCount").textContent = `${count} ${count === 1 ? "explorer has" : "explorers have"} joined the adventure`;
  $("#boardEmpty").classList.toggle("is-hidden", count > 0);
}
function renderNames() {
  nameTags.replaceChildren();
  names.forEach((entry, index) => {
    const tag = document.createElement("div");
    tag.className = `name-tag ${entry.color || TAG_COLORS[index % TAG_COLORS.length]}`;
    tag.style.setProperty("--tilt", `${entry.tilt ?? ((Math.random() * 8 - 4).toFixed(1))}deg`);
    // Small randomized offsets keep the wall feeling hand-placed; grid gaps prevent collisions.
    tag.style.marginInlineStart = `${Math.round(Math.random() * 10 - 5)}px`;
    tag.style.marginBlockStart = `${Math.round(Math.random() * 7)}px`;
    tag.style.animationDelay = `${Math.min(index * 35, 350)}ms`;
    tag.textContent = entry.name;
    tag.title = entry.name;
    nameTags.append(tag);
  });
  updateCount();
}
function say(message, type = "") {
  formMessage.textContent = message;
  formMessage.classList.toggle("success", type === "success");
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

// JSONP keeps the simple Apps Script endpoint usable from a static site without a server/CORS setup.
function requestSheet(action, values = {}) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_APPS_SCRIPT_URL) return reject(new Error("No shared sheet configured"));
    const callback = `__21nfinityCallback${++jsonpSequence}`;
    const script = document.createElement("script");
    const timer = setTimeout(() => finish(new Error("The board is taking a little while to respond.")), 9000);
    function finish(error, result) {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
      error ? reject(error) : resolve(result);
    }
    window[callback] = (result) => finish(null, result);
    script.onerror = () => finish(new Error("Couldn't reach the shared name board."));
    const params = new URLSearchParams({ action, callback, ...values, _: Date.now().toString() });
    script.src = `${GOOGLE_APPS_SCRIPT_URL}${GOOGLE_APPS_SCRIPT_URL.includes("?") ? "&" : "?"}${params}`;
    document.head.append(script);
  });
}
async function loadNames() {
  names = readLocalNames();
  renderNames();
  if (!GOOGLE_APPS_SCRIPT_URL) return;
  try {
    const result = await requestSheet("list");
    if (!result || result.ok !== true || !Array.isArray(result.names)) throw new Error("Invalid board response");
    const byName = new Map();
    [...result.names, ...names].forEach((entry) => {
      if (entry && typeof entry.name === "string" && !byName.has(entry.name.toLowerCase())) byName.set(entry.name.toLowerCase(), entry);
    });
    names = [...byName.values()];
    saveLocalNames();
    renderNames();
  } catch (error) {
    // Keep the visitor's locally cached wall usable when the shared connection is offline.
    console.info("Using the local adventure wall:", error.message);
  }
}

function playSound(kind) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain); gain.connect(audioContext.destination);
    if (kind === "box") {
      oscillator.type = "triangle"; oscillator.frequency.setValueAtTime(170, now); oscillator.frequency.exponentialRampToValueAtTime(68, now + .22);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.12, now + .03); gain.gain.exponentialRampToValueAtTime(.0001, now + .32);
      oscillator.start(now); oscillator.stop(now + .33);
    } else {
      oscillator.type = "sine"; oscillator.frequency.setValueAtTime(650, now); oscillator.frequency.exponentialRampToValueAtTime(980, now + .08);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.075, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + .16);
      oscillator.start(now); oscillator.stop(now + .17);
    }
  } catch (_) { /* audio is an optional enhancement */ }
}

function burstConfetti() {
  if (reducedMotion.matches) return;
  const colors = ["#ffd52e", "#0b4fb3", "#e52b2b", "#9bd52d", "#fff4b8"];
  for (let i = 0; i < 58; i += 1) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.setProperty("--confetti", colors[i % colors.length]);
    piece.style.setProperty("--duration", `${1.5 + Math.random() * 1.7}s`);
    piece.style.setProperty("--drift", `${Math.random() * 190 - 95}px`);
    piece.style.animationDelay = `${Math.random() * .4}s`;
    document.body.append(piece);
    setTimeout(() => piece.remove(), 3800);
  }
}
let isOpening = false;
function openBox() {
  if (isOpening) return;
  if (stage.classList.contains("is-open")) {
    if (dialog.open) return;
    stage.classList.remove("is-open");
    box.classList.remove("is-open");
    openBoxButton.innerHTML = '<span class="button-sparkle">✦</span> Open the box <span aria-hidden="true">→</span>';
    $("#boxHint").textContent = "Psst… open me!";
    return;
  }
  isOpening = true;
  box.classList.add("is-shaking");
  openBoxButton.innerHTML = '<span class="button-sparkle">✦</span> Something magical!';
  $("#boxHint").textContent = "A surprise is on its way…";
  playSound("box");
  const wait = reducedMotion.matches ? 60 : 780;
  window.setTimeout(() => {
    stage.classList.add("is-open");
    box.classList.remove("is-shaking");
    box.classList.add("is-open");
    burstConfetti();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    isOpening = false;
  }, wait);
}
openBoxButton.addEventListener("click", openBox);

function closeLetter() {
  if (dialog.open && typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
  stage.classList.remove("is-open");
  box.classList.remove("is-open", "is-shaking");
  openBoxButton.innerHTML = '<span class="button-sparkle">✦</span> Open the box <span aria-hidden="true">→</span>';
  $("#boxHint").textContent = "Psst… open me!";
  openBoxButton.focus({ preventScroll: true });
}
$("#closeLetter").addEventListener("click", closeLetter);
dialog.addEventListener("click", (event) => { if (event.target === dialog) closeLetter(); });
dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeLetter(); });
$("#signBoardLink").addEventListener("click", (event) => {
  event.preventDefault(); closeLetter();
  window.setTimeout(() => { $("#name-board").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" }); nameInput.focus({ preventScroll: true }); }, 80);
});

$("#alienEgg").addEventListener("click", () => {
  showToast("Ooooh!");
  if ("speechSynthesis" in window && soundEnabled) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Ooooh!"));
  }
});

$("#soundToggle").addEventListener("click", (event) => {
  soundEnabled = !soundEnabled;
  const button = event.currentTarget;
  button.setAttribute("aria-pressed", String(soundEnabled));
  button.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  button.querySelector(".sound-label").textContent = soundEnabled ? "Sound on" : "Sound off";
  if (soundEnabled) { playSound("stick"); showToast("Sound is on"); }
});

$("#characterCount").textContent = `0 / ${nameInput.maxLength}`;
nameInput.addEventListener("input", () => { $("#characterCount").textContent = `${nameInput.value.length} / ${nameInput.maxLength}`; });
nameForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = normalizeName(nameInput.value);
  if (!name) return say("Add a name before joining the adventure.");
  if ([...name].length > 30) return say("Keep your name to 30 characters or fewer.");
  if (isProfane(name)) return say("Let's keep the adventure friendly for everyone.");
  if (duplicateName(name)) return say("That name is already on the board. You're in!", "success");

  const entry = { name, color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)], tilt: (Math.random() * 8 - 4).toFixed(1) };
  names.unshift(entry);
  saveLocalNames(); renderNames();
  nameInput.value = ""; $("#characterCount").textContent = `0 / ${nameInput.maxLength}`;
  say(GOOGLE_APPS_SCRIPT_URL ? "You're on the wall! Syncing your name…" : "You're on the wall! This browser has saved your name.", "success");
  playSound("stick");

  if (GOOGLE_APPS_SCRIPT_URL) {
    try {
      const result = await requestSheet("add", { name });
      if (!result || result.ok !== true) throw new Error(result?.message || "The board couldn't save your name.");
      say("You're on the wall! Your name is shared with every explorer.", "success");
    } catch (error) {
      say("Saved here for now — the shared board couldn't be reached. Please try again later.");
      console.warn("Shared board save failed:", error.message);
    }
  }
});

loadNames();
