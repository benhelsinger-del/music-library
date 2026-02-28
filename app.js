// app.js - GZ UP RADIO Player with persistent local MP3s

// Global state
let songs = [];              // { id, title, artist, url (blob or base64), art, fav, isLocal }
let currentIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;

const audio = document.getElementById('audio');
const mini = document.getElementById('mini');
const modal = document.getElementById('modal');

// DOM shortcuts
const listEl       = document.getElementById('list');
const miniPlay     = document.getElementById('miniPlay');
const npPlay       = document.getElementById('npPlay');
const miniTitle    = document.getElementById('miniTitle');
const miniArtist   = document.getElementById('miniArtist');
const npTitle      = document.getElementById('npTitle');
const npArtist     = document.getElementById('npArtist');
const barFill      = document.getElementById('barFill');
const barFill2     = document.getElementById('barFill2');
const scrub        = document.getElementById('scrub');
const scrub2       = document.getElementById('scrub2');
const tNow         = document.getElementById('tNow');
const tDur         = document.getElementById('tDur');
const tNow2        = document.getElementById('tNow2');
const tDur2        = document.getElementById('tDur2');

// Format time mm:ss
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Save / load persistent local songs (base64 for offline use)
function saveLocalSongs() {
  const localOnly = songs.filter(s => s.isLocal);
  const data = localOnly.map(s => ({
    title: s.title,
    artist: s.artist,
    base64: s.base64,       // we'll store base64 instead of blob
    fav: s.fav || false
  }));
  localStorage.setItem('gzup_local_songs', JSON.stringify(data));
}

function loadLocalSongs() {
  const saved = localStorage.getItem('gzup_local_songs');
  if (!saved) return;

  const data = JSON.parse(saved);
  data.forEach(item => {
    // Recreate blob from base64
    fetch(`data:audio/mp3;base64,${item.base64}`)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        songs.push({
          title: item.title,
          artist: item.artist,
          url: url,
          base64: item.base64,   // keep for future reloads
          art: '',
          fav: item.fav,
          isLocal: true
        });
        renderList();
      })
      .catch(err => console.error("Failed to restore local song:", err));
  });
}

// Render song list
function renderList(filter = '') {
  listEl.innerHTML = '';
  const favsOnly = document.getElementById('filterFavs')?.classList.contains('on') || false;

  songs
    .filter(s => {
      if (favsOnly && !s.fav) return false;
      const term = filter.toLowerCase();
      return s.title.toLowerCase().includes(term) || s.artist.toLowerCase().includes(term);
    })
    .forEach((song, idx) => {
      const el = document.createElement('div');
      el.className = `song${idx === currentIndex ? ' current' : ''}`;
      el.innerHTML = `
        <div class="art"><img src="${song.art || 'placeholder-art.jpg'}" alt=""></div>
        <div class="meta">
          <div class="t">${song.title}</div>
          <div class="a">${song.artist}</div>
        </div>
        <div class="rowBtns">
          <button class="btn play" onclick="playSong(${idx})">${idx === currentIndex && isPlaying ? 'Pause' : 'Play'}</button>
          <button class="btn ghost heart" onclick="toggleFav(${idx})">${song.fav ? '♥' : '♡'}</button>
          <button class="btn download" onclick="downloadSong(${idx})">Download</button>
        </div>
      `;
      listEl.appendChild(el);
    });
}

// Play song
function playSong(idx) {
  if (idx === currentIndex && isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    currentIndex = idx;
    const song = songs[idx];
    audio.src = song.url;
    audio.play().catch(e => {
      console.error("Playback failed:", e);
      alert("Cannot play this track. It may be corrupted or expired.");
    });
    isPlaying = true;
    updateUI();
  }
  renderList(document.getElementById('search')?.value || '');
}

// Update UI (mini + modal)
function updateUI() {
  if (currentIndex < 0) return;
  const song = songs[currentIndex];

  miniTitle.textContent = song.title;
  miniArtist.textContent = song.artist;
  npTitle.textContent = song.title;
  npArtist.textContent = song.artist;

  mini.classList.add('show');
  // Modal updates handled by CSS class
}

// Progress
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  barFill.style.width = pct + '%';
  barFill2.style.width = pct + '%';
  scrub.value = pct;
  scrub2.value = pct;
  tNow.textContent = formatTime(audio.currentTime);
  tDur.textContent = formatTime(audio.duration);
  tNow2.textContent = formatTime(audio.currentTime);
  tDur2.textContent = formatTime(audio.duration);
});

// Scrub
[scrub, scrub2].forEach(el => {
  el.addEventListener('input', () => {
    audio.currentTime = (el.value / 100) * audio.duration;
  });
});

// Controls
miniPlay.onclick = npPlay.onclick = () => {
  if (isPlaying) {
    audio.pause();
    miniPlay.textContent = '▶';
    npPlay.textContent = '▶';
  } else {
    audio.play();
    miniPlay.textContent = '❚❚';
    npPlay.textContent = '❚❚';
  }
  isPlaying = !isPlaying;
};

document.getElementById('miniNext').onclick = document.getElementById('npNext').onclick = () => {
  let next = currentIndex + 1;
  if (isShuffle) next = Math.floor(Math.random() * songs.length);
  if (next >= songs.length) next = isRepeat ? 0 : currentIndex;
  playSong(next);
};

document.getElementById('miniPrev').onclick = document.getElementById('npPrev').onclick = () => {
  let prev = currentIndex - 1;
  if (prev < 0) prev = isRepeat ? songs.length - 1 : 0;
  playSong(prev);
};

document.getElementById('shuffleBtn').onclick = function() {
  isShuffle = !isShuffle;
  this.classList.toggle('on', isShuffle);
};

document.getElementById('repeatBtn').onclick = function() {
  isRepeat = !isRepeat;
  this.classList.toggle('on', isRepeat);
};

function toggleFav(idx) {
  songs[idx].fav = !songs[idx].fav;
  localStorage.setItem('gzup_favs', JSON.stringify(songs.map(s => ({id: s.id || s.title, fav: s.fav}))));
  renderList(document.getElementById('search')?.value || '');
}

function downloadSong(idx) {
  const song = songs[idx];
  if (song.url.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = song.url;
    a.download = `${song.title} - ${song.artist}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert("Download not supported for remote tracks.");
  }
}

// Init - load saved local songs + favs
function init() {
  // Load saved local MP3s (base64)
  const savedLocal = localStorage.getItem('gzup_local_songs');
  if (savedLocal) {
    const data = JSON.parse(savedLocal);
    data.forEach(item => {
      const binary = atob(item.base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      songs.push({
        title: item.title,
        artist: item.artist,
        url,
        base64: item.base64,
        art: '',
        fav: item.fav,
        isLocal: true
      });
    });
  }

  // Load favs for any existing songs (if you have remote ones)
  const savedFavs = JSON.parse(localStorage.getItem('gzup_favs') || '[]');
  songs.forEach(s => {
    const saved = savedFavs.find(f => f.id === (s.id || s.title));
    if (saved) s.fav = saved.fav;
  });

  renderList();
}

window.addEventListener('load', init);

// When adding a local MP3 (called from HTML)
function addLocalMp3() {
  const fileInput = document.getElementById('addMp3File');
  const titleInput = document.getElementById('addMp3Title').value.trim() || 'Downloaded Track';
  const artistInput = document.getElementById('addMp3Artist').value.trim() || 'Unknown';

  if (!fileInput.files.length) {
    alert("Select an MP3 file first!");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const base64 = e.target.result.split(',')[1]; // remove data:audio/mp3;base64,
    const blobUrl = URL.createObjectURL(file);

    const newSong = {
      title: titleInput,
      artist: artistInput,
      url: blobUrl,
      base64: base64,         // save base64 for persistence
      art: '',
      fav: false,
      isLocal: true
    };

    songs.push(newSong);
    saveLocalSongs();         // persist to localStorage
    renderList();
    alert(`Added "${titleInput}" by ${artistInput} to your library!`);
    fileInput.value = '';     // clear input
  };

  reader.readAsDataURL(file);
}

// Audio ended → next
audio.addEventListener('ended', () => {
  if (isRepeat) {
    playSong(currentIndex);
  } else {
    document.getElementById('miniNext').click();
  }
});

// Modal
document.getElementById('openNowPlaying')?.addEventListener('click', () => modal.classList.add('show'));
document.getElementById('closeModal')?.addEventListener('click', () => modal.classList.remove('show'));
