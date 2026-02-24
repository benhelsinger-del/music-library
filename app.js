// ====== CONFIG ======
const LIBRARY_URL = "https://raw.githubusercontent.com/benhelsinger-del/music-library/main/library.json";

// ====== ELEMENTS ======
const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const audio = document.getElementById("audio");

const filterFavsBtn = document.getElementById("filterFavs");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");

const mini = document.getElementById("mini");
const miniTap = document.getElementById("miniTap");
const miniImg = document.getElementById("miniImg");
const miniTitle = document.getElementById("miniTitle");
const miniArtist = document.getElementById("miniArtist");
const miniPrev = document.getElementById("miniPrev");
const miniPlay = document.getElementById("miniPlay");
const miniNext = document.getElementById("miniNext");

const barFill = document.getElementById("barFill");
const scrub = document.getElementById("scrub");
const tNow = document.getElementById("tNow");
const tDur = document.getElementById("tDur");

const modal = document.getElementById("modal");
const openNowPlaying = document.getElementById("openNowPlaying");
const closeModal = document.getElementById("closeModal");

const npImg = document.getElementById("npImg");
const npTitle = document.getElementById("npTitle");
const npArtist = document.getElementById("npArtist");
const npFav = document.getElementById("npFav");
const npPrev = document.getElementById("npPrev");
const npPlay = document.getElementById("npPlay");
const npNext = document.getElementById("npNext");
const npShuffle = document.getElementById("npShuffle");

const barFill2 = document.getElementById("barFill2");
const scrub2 = document.getElementById("scrub2");
const tNow2 = document.getElementById("tNow2");
const tDur2 = document.getElementById("tDur2");

const npArt = document.getElementById("npArt");
const npMode = document.getElementById("npMode");

const toggleHelp = document.getElementById("toggleHelp");
const hint = document.getElementById("hint");

// ====== STATE ======
let songs = [];
let view = [];
let currentIndex = -1;

let showFavsOnly = false;
let shuffle = false;
let repeat = false; // repeat-one

// ====== STORAGE KEYS ======
const LS_FAVS = "gz_favs_v2";
const LS_LAST = "gz_last_v2"; // { id, t }

// ====== UTILS ======
const vibe = (ms=12) => { try { navigator.vibrate?.(ms); } catch {} };

const escapeHtml = (s) => (s || "").replace(/[&<>"']/g, m => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[m]));

function fmtTime(sec){
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2,"0")}`;
}

function getFavs(){
  try { return new Set(JSON.parse(localStorage.getItem(LS_FAVS) || "[]")); }
  catch { return new Set(); }
}
function setFavs(set){
  localStorage.setItem(LS_FAVS, JSON.stringify([...set]));
}
let favs = getFavs();

function setModeTag(){
  const bits = [];
  if (shuffle) bits.push("SHUFFLE");
  if (repeat) bits.push("REPEAT");
  npMode.textContent = bits.length ? bits.join(" • ") : "GZ UP";
}

function currentSong(){
  if (currentIndex < 0 || currentIndex >= songs.length) return null;
  return songs[currentIndex];
}

function setNowUI(song){
  if (!song){
    miniTitle.textContent = "Not playing";
    miniArtist.textContent = "—";
    miniImg.removeAttribute("src");
    npTitle.textContent = "Not playing";
    npArtist.textContent = "—";
    npImg.removeAttribute("src");
    npFav.textContent = "♡";
    return;
  }

  miniTitle.textContent = song.title || "Untitled";
  miniArtist.textContent = song.artist || "—";
  npTitle.textContent = song.title || "Untitled";
  npArtist.textContent = song.artist || "—";

  const art = song.artworkURL || "fellas.jpg";
  miniImg.src = art;
  npImg.src = art;

  npFav.textContent = favs.has(song.id) ? "♥" : "♡";
  mini.classList.add("show");
}

function syncPlayBtns(){
  const playing = !audio.paused && audio.src;
  miniPlay.textContent = playing ? "⏸" : "▶";
  npPlay.textContent = playing ? "⏸" : "▶";

  // Row buttons
  document.querySelectorAll(".song").forEach(el => {
    const id = el.dataset.id;
    const btn = el.querySelector("[data-role='play']");
    if (!btn) return;
    if (currentSong() && id === currentSong().id && playing) btn.textContent = "Pause";
    else btn.textContent = "Play";
    el.classList.toggle("current", !!(currentSong() && id === currentSong().id));
  });
}

function saveLast(id, t){
  try { localStorage.setItem(LS_LAST, JSON.stringify({ id, t })); } catch {}
}
function loadLast(){
  try { return JSON.parse(localStorage.getItem(LS_LAST) || "null"); } catch { return null; }
}

// ====== RENDER ======
function applyFilters(){
  const q = searchEl.value.toLowerCase().trim();
  view = songs.filter(s => {
    if (showFavsOnly && !favs.has(s.id)) return false;
    if (!q) return true;
    return (s.title || "").toLowerCase().includes(q) || (s.artist || "").toLowerCase().includes(q);
  });
  render(view);
  syncPlayBtns();
}

function render(items){
  listEl.innerHTML = "";
  items.forEach((song, idx) => {
    const row = document.createElement("div");
    row.className = "song";
    row.dataset.id = song.id;

    const art = document.createElement("div");
    art.className = "art";
    const img = document.createElement("img");
    img.alt = "";
    img.src = song.artworkURL || "fellas.jpg";
    art.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <div class="t">${escapeHtml(song.title)}</div>
      <div class="a">${escapeHtml(song.artist)}</div>
    `;

    const btns = document.createElement("div");
    btns.className = "rowBtns";

    const favBtn = document.createElement("button");
    favBtn.className = "btn ghost heart";
    favBtn.textContent = favs.has(song.id) ? "♥" : "♡";
    favBtn.onclick = (e) => {
      e.stopPropagation();
      vibe(8);
      toggleFav(song.id);
      favBtn.textContent = favs.has(song.id) ? "♥" : "♡";
      if (currentSong() && currentSong().id === song.id) npFav.textContent = favBtn.textContent;
      if (showFavsOnly) applyFilters();
    };

    const playBtn = document.createElement("button");
    playBtn.className = "btn play";
    playBtn.dataset.role = "play";
    playBtn.textContent = "Play";
    playBtn.onclick = (e) => {
      e.stopPropagation();
      vibe(10);
      playFromViewIndex(idx);
    };

    row.onclick = () => { vibe(8); playFromViewIndex(idx); };

    btns.appendChild(favBtn);
    btns.appendChild(playBtn);

    row.appendChild(art);
    row.appendChild(meta);
    row.appendChild(btns);

    listEl.appendChild(row);
  });
}

// ====== PLAYBACK ======
function playSongByIndex(idx, startTime=null){
  if (!songs.length) return;
  currentIndex = Math.max(0, Math.min(idx, songs.length - 1));
  const song = songs[currentIndex];

  audio.src = song.audioURL;
  audio.play().catch(()=>{});

  setNowUI(song);
  setModeTag();
  saveLast(song.id, 0);

  // Seek after metadata loads
  if (startTime && startTime > 0){
    audio.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(audio.duration) && startTime < audio.duration) {
        audio.currentTime = startTime;
      }
    }, { once:true });
  }

  syncPlayBtns();
}

function playFromViewIndex(viewIdx){
  if (!view.length) return;
  const song = view[viewIdx];
  const idx = songs.findIndex(s => s.id === song.id);

  // toggle pause if same song
  if (currentSong() && currentSong().id === song.id && audio.src) {
    if (audio.paused) audio.play().catch(()=>{});
    else audio.pause();
    syncPlayBtns();
    return;
  }

  playSongByIndex(idx);
}

function next(){
  if (!songs.length) return;
  if (repeat && currentSong()){
    // repeat one
    playSongByIndex(currentIndex, 0);
    return;
  }

  if (shuffle){
    if (songs.length === 1) return playSongByIndex(0);
    let n = Math.floor(Math.random() * songs.length);
    while (n === currentIndex) n = Math.floor(Math.random() * songs.length);
    playSongByIndex(n);
  } else {
    playSongByIndex((currentIndex + 1) % songs.length);
  }
}

function prev(){
  if (!songs.length) return;
  playSongByIndex((currentIndex - 1 + songs.length) % songs.length);
}

function togglePlay(){
  if (!audio.src) {
    // start first song
    if (view.length) return playFromViewIndex(0);
    if (songs.length) return playSongByIndex(0);
    return;
  }
  if (audio.paused) audio.play().catch(()=>{});
  else audio.pause();
  syncPlayBtns();
}

// ====== FAVORITES ======
function toggleFav(id){
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  setFavs(favs);
  // refresh row hearts quickly
  document.querySelectorAll(".song").forEach(el => {
    if (el.dataset.id === id) {
      const heart = el.querySelector(".heart");
      if (heart) heart.textContent = favs.has(id) ? "♥" : "♡";
    }
  });
  if (currentSong() && currentSong().id === id) npFav.textContent = favs.has(id) ? "♥" : "♡";
}

// ====== PROGRESS ======
function setProgressUI(){
  const dur = audio.duration;
  const cur = audio.currentTime;

  tNow.textContent = fmtTime(cur);
  tDur.textContent = fmtTime(dur);

  tNow2.textContent = fmtTime(cur);
  tDur2.textContent = fmtTime(dur);

  const pct = (Number.isFinite(dur) && dur > 0) ? (cur / dur) : 0;
  const w = Math.max(0, Math.min(1, pct)) * 100;

  barFill.style.width = `${w}%`;
  barFill2.style.width = `${w}%`;

  // keep range sliders aligned without fighting user drag
  if (!scrub._dragging) scrub.value = Math.round(w * 10);   // 0..1000
  if (!scrub2._dragging) scrub2.value = Math.round(w * 10);
}

function seekFromSlider(v){
  const dur = audio.duration;
  if (!Number.isFinite(dur) || dur <= 0) return;
  const pct = Math.max(0, Math.min(1000, v)) / 1000;
  audio.currentTime = pct * dur;
}

// ====== MODAL ======
function openModal(){
  vibe(10);
  modal.classList.add("show");
  setModeTag();
  syncPlayBtns();
}
function closeNow(){
  vibe(8);
  modal.classList.remove("show");
}

// ====== GESTURES (swipe on cover) ======
function addSwipe(el){
  let sx=0, sy=0, moved=false, lastTap=0;

  el.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY;
    moved = false;
  }, { passive:true });

  el.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
  }, { passive:true });

  el.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;

    // double tap toggles play
    const now = Date.now();
    if (!moved && (now - lastTap) < 320) {
      vibe(12);
      togglePlay();
      lastTap = 0;
      return;
    }
    lastTap = now;

    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      vibe(12);
      if (dx < 0) next();
      else prev();
    }
  }, { passive:true });
}

// ====== EVENTS ======
searchEl.addEventListener("input", applyFilters);

filterFavsBtn.addEventListener("click", () => {
  vibe(8);
  showFavsOnly = !showFavsOnly;
  filterFavsBtn.textContent = showFavsOnly ? "Favs" : "All";
  filterFavsBtn.classList.toggle("on", showFavsOnly);
  applyFilters();
});

shuffleBtn.addEventListener("click", () => {
  vibe(8);
  shuffle = !shuffle;
  shuffleBtn.classList.toggle("on", shuffle);
  setModeTag();
});

repeatBtn.addEventListener("click", () => {
  vibe(8);
  repeat = !repeat;
  repeatBtn.classList.toggle("on", repeat);
  setModeTag();
});

miniPrev.addEventListener("click", () => { vibe(10); prev(); });
miniNext.addEventListener("click", () => { vibe(10); next(); });
miniPlay.addEventListener("click", () => { vibe(10); togglePlay(); });
miniTap.addEventListener("click", () => openModal());

openNowPlaying.addEventListener("click", openModal);
closeModal.addEventListener("click", closeNow);
modal.addEventListener("click", (e) => { if (e.target === modal) closeNow(); });

npPrev.addEventListener("click", () => { vibe(10); prev(); });
npNext.addEventListener("click", () => { vibe(10); next(); });
npPlay.addEventListener("click", () => { vibe(10); togglePlay(); });
npShuffle.addEventListener("click", () => {
  vibe(10);
  shuffle = !shuffle;
  shuffleBtn.classList.toggle("on", shuffle);
  setModeTag();
});
npFav.addEventListener("click", () => {
  const s = currentSong();
  if (!s) return;
  vibe(8);
  toggleFav(s.id);
  npFav.textContent = favs.has(s.id) ? "♥" : "♡";
});

toggleHelp.addEventListener("click", () => {
  vibe(8);
  const showing = hint.style.display !== "none";
  hint.style.display = showing ? "none" : "block";
});

// Scrub bars
[scrub, scrub2].forEach(sl => {
  sl.addEventListener("input", () => {
    sl._dragging = true;
    const pct = Math.max(0, Math.min(1000, +sl.value)) / 1000;
    const w = pct * 100;
    if (sl === scrub) barFill.style.width = `${w}%`;
    else barFill2.style.width = `${w}%`;
  });
  sl.addEventListener("change", () => {
    seekFromSlider(+sl.value);
    sl._dragging = false;
  });
});

// Audio events
audio.addEventListener("timeupdate", () => {
  setProgressUI();
  const s = currentSong();
  if (s) saveLast(s.id, audio.currentTime || 0);
});
audio.addEventListener("loadedmetadata", setProgressUI);
audio.addEventListener("play", syncPlayBtns);
audio.addEventListener("pause", syncPlayBtns);
audio.addEventListener("ended", next);

// gestures on cover
addSwipe(npArt);

// Keyboard shortcuts (desktop)
document.addEventListener("keydown", (e) => {
  if (e.key === " "){ e.preventDefault(); togglePlay(); }
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});

// ====== INIT ======
async function loadLibrary(){
  const res = await fetch(LIBRARY_URL, { cache: "no-store" });
  const data = await res.json();

  songs = (data.songs || []).map((s, i) => ({
    id: String(s.id ?? i+1),
    title: s.title ?? "Untitled",
    artist: s.artist ?? "—",
    audioURL: s.audioURL,
    artworkURL: s.artworkURL || null
  }));

  applyFilters();

  // restore last played
  const last = loadLast();
  if (last?.id){
    const idx = songs.findIndex(x => x.id === last.id);
    if (idx !== -1){
      currentIndex = idx;
      const s = songs[currentIndex];
      audio.src = s.audioURL;
      setNowUI(s);
      setModeTag();
      syncPlayBtns();

      // seek after metadata
      audio.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(last.t) && last.t > 0 && last.t < audio.duration) {
          audio.currentTime = last.t;
          setProgressUI();
        }
      }, { once:true });
    }
  }
}

loadLibrary().catch(err => {
  console.error(err);
  listEl.innerHTML = `<div style="padding:16px;font-weight:900;color:#ff7777">Failed to load library.json</div>`;
});
