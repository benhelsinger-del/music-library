const LIBRARY_URL = "https://raw.githubusercontent.com/benhelsinger-del/music-library/main/library.json";

const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");
const audioEl = document.getElementById("audio");
const nowEl = document.getElementById("now");

let songs = [];

async function loadLibrary() {
  const res = await fetch(LIBRARY_URL);
  const data = await res.json();
  songs = data.songs || [];
  render(songs);
}

function render(items) {
  listEl.innerHTML = "";
  items.forEach(song => {
    const row = document.createElement("div");
    row.className = "song";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<div class="title">${escapeHtml(song.title)}</div>
                      <div class="artist">${escapeHtml(song.artist)}</div>`;

    const btn = document.createElement("button");
    btn.textContent = "Play";
    btn.onclick = () => playSong(song);

    row.appendChild(meta);
    row.appendChild(btn);
    listEl.appendChild(row);
  });
}

function playSong(song) {
  audioEl.src = song.audioURL;
  audioEl.play();
  nowEl.textContent = `Now playing: ${song.title} — ${song.artist}`;
}

searchEl.addEventListener("input", () => {
  const q = searchEl.value.toLowerCase().trim();
  if (!q) return render(songs);
  render(songs.filter(s =>
    (s.title || "").toLowerCase().includes(q) ||
    (s.artist || "").toLowerCase().includes(q)
  ));
});

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

loadLibrary().catch(err => {
  listEl.innerHTML = `<div style="color:#ff6b6b">Failed to load library.json</div>`;
  console.error(err);
});
