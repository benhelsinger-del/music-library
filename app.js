const LIBRARY_URL = "https://raw.githubusercontent.com/benhelsinger-del/music-library/main/library.json";

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const audioEl = document.getElementById("audio");
const nowEl = document.getElementById("now");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const filterFavsBtn = document.getElementById("filterFavs");
const shuffleBtn = document.getElementById("shuffleBtn");

let songs = [];
let viewSongs = [];          // filtered list (search/favs)
let currentIndex = -1;
let isShuffle = false;
let showFavsOnly = false;

const LS_FAVS = "mm_favs_v1";
const LS_LAST = "mm_last_v1";   // { songId, time }

function getFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_FAVS) || "[]")); }
  catch { return new Set(); }
}
function setFavs(set) {
  localStorage.setItem(LS_FAVS, JSON.stringify([...set]));
}

let favs = getFavs();

async function loadLibrary() {
  const res = await fetch(LIBRARY_URL, { cache: "no-store" });
  const data = await res.json();
  songs = (data.songs || []).map(s => ({
    ...s,
    artworkURL: s.artworkURL || null
  }));
  applyFilters();
  restoreLast();
}

function applyFilters() {
  const q = searchEl.value.toLowerCase().trim();
  viewSongs = songs.filter(s => {
    if (showFavsOnly && !favs.has(s.id)) return false;
    if (!q) return true;
    return (s.title || "").toLowerCase().includes(q) || (s.artist || "").toLowerCase().includes(q);
  });
  render(viewSongs);
  syncCurrentHighlight();
}

function render(items) {
  listEl.innerHTML = "";
  items.forEach((song, idx) => {
    const row = document.createElement("div");
    row.className = "song";
    row.dataset.songId = song.id;

    const art = document.createElement("div");
    art.className = "art";
    if (song.artworkURL) {
      const img = document.createElement("img");
      img.src = song.artworkURL;
      img.alt = "";
      art.appendChild(img);
    }

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <div class="title">${escapeHtml(song.title)}</div>
      <div class="artist">${escapeHtml(song.artist)}</div>
    `;

    const favBtn = document.createElement("button");
    favBtn.className = "btn ghost fav";
    favBtn.textContent = favs.has(song.id) ? "♥" : "♡";
    favBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFav(song.id);
      favBtn.textContent = favs.has(song.id) ? "♥" : "♡";
      if (showFavsOnly) applyFilters();
    };

    const playBtn = document.createElement("button");
    playBtn.className = "btn";
    playBtn.textContent = "Play";
    playBtn.onclick = (e) => {
      e.stopPropagation();
      playFromViewIndex(idx);
    };

    row.onclick = () => playFromViewIndex(idx);

    row.appendChild(art);
    row.appendChild(meta);
    row.appendChild(favBtn);
    row.appendChild(playBtn);
    listEl.appendChild(row);
  });
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function toggleFav(songId) {
  if (favs.has(songId)) favs.delete(songId);
  else favs.add(songId);
  setFavs(favs);
}

function setNowPlayingText(song) {
  nowEl.textContent = song ? `Now playing: ${song.title} — ${song.artist}` : "Not playing";
}

function playSong(song) {
  audioEl.src = song.audioURL;
  audioEl.play();
  setNowPlayingText(song);
  playPauseBtn.textContent = "Pause";
  saveLast(song.id, 0);
}

function playFromViewIndex(viewIdx) {
  if (!viewSongs.length) return;
  const song = viewSongs[viewIdx];
  currentIndex = songs.findIndex(s => s.id === song.id);
  playSong(song);
  syncCurrentHighlight();
}

function currentSong() {
  if (currentIndex < 0 || currentIndex >= songs.length) return null;
  return songs[currentIndex];
}

function nextSong() {
  if (!songs.length) return;

  if (isShuffle) {
    let next = Math.floor(Math.random() * songs.length);
    if (songs.length > 1) {
      while (next === currentIndex) next = Math.floor(Math.random() * songs.length);
    }
    currentIndex = next;
  } else {
    currentIndex = (currentIndex + 1) % songs.length;
  }

  const song = currentSong();
  playSong(song);
  syncCurrentHighlight();
}

function prevSong() {
  if (!songs.length) return;
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  const song = currentSong();
  playSong(song);
  syncCurrentHighlight();
}

function syncCurrentHighlight() {
  const cs = currentSong();
  document.querySelectorAll(".song").forEach(el => {
    const isCurrent = cs && el.dataset.songId === cs.id;
    el.classList.toggle("current", !!isCurrent);
    const btn = el.querySelector(".btn:not(.ghost)");
    if (btn && isCurrent) btn.textContent = audioEl.paused ? "Play" : "Pause";
    else if (btn) btn.textContent = "Play";
  });
}

function saveLast(songId, time) {
  localStorage.setItem(LS_LAST, JSON.stringify({ songId, time }));
}

function restoreLast() {
  try {
    const raw = localStorage.getItem(LS_LAST);
    if (!raw) return;
    const { songId, time } = JSON.parse(raw);
    const idx = songs.findIndex(s => s.id === songId);
    if (idx === -1) return;
    currentIndex = idx;

    const song = songs[currentIndex];
    audioEl.src = song.audioURL;
    setNowPlayingText(song);

    // seek after metadata loads
    audioEl.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(time) && time > 0 && time < audioEl.duration) {
        audioEl.currentTime = time;
      }
    }, { once: true });

    syncCurrentHighlight();
  } catch {}
}

/** Events */
searchEl.addEventListener("input", applyFilters);

filterFavsBtn.addEventListener("click", () => {
  showFavsOnly = !showFavsOnly;
  filterFavsBtn.textContent = showFavsOnly ? "Favs" : "All";
  applyFilters();
});

shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleBtn.textContent = `Shuffle: ${isShuffle ? "On" : "Off"}`;
});

nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

playPauseBtn.addEventListener("click", () => {
  if (!audioEl.src) {
    // if nothing loaded, start with first in view (or overall)
    if (viewSongs.length) playFromViewIndex(0);
    else if (songs.length) { currentIndex = 0; playSong(songs[0]); syncCurrentHighlight(); }
    return;
  }

  if (audioEl.paused) {
    audioEl.play();
    playPauseBtn.textContent = "Pause";
  } else {
    audioEl.pause();
    playPauseBtn.textContent = "Play";
  }
  syncCurrentHighlight();
});

audioEl.addEventListener("ended", nextSong);

audioEl.addEventListener("timeupdate", () => {
  const cs = currentSong();
  if (!cs) return;
  saveLast(cs.id, audioEl.currentTime || 0);
});

audioEl.addEventListener("play", () => {
  playPauseBtn.textContent = "Pause";
  syncCurrentHighlight();
});
audioEl.addEventListener("pause", () => {
  playPauseBtn.textContent = "Play";
  syncCurrentHighlight();
});

loadLibrary().catch(err => {
  listEl.innerHTML = `<div style="color:#ff6b6b;padding:16px">Failed to load library.json</div>`;
  console.error(err);
});
