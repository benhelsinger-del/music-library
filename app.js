// app.js - GZ UP RADIO Player Logic

// Global state
let songs = [];              // Array of song objects
let currentIndex = -1;       // Current playing song index
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let audio = document.getElementById('audio');
let mini = document.getElementById('mini');
let modal = document.getElementById('modal');

// DOM elements
const listEl = document.getElementById('list');
const miniPlay = document.getElementById('miniPlay');
const npPlay = document.getElementById('npPlay');
const miniTitle = document.getElementById('miniTitle');
const miniArtist = document.getElementById('miniArtist');
const npTitle = document.getElementById('npTitle');
const npArtist = document.getElementById('npArtist');
const barFill = document.getElementById('barFill');
const barFill2 = document.getElementById('barFill2');
const scrub = document.getElementById('scrub');
const scrub2 = document.getElementById('scrub2');
const tNow = document.getElementById('tNow');
const tDur = document.getElementById('tDur');
const tNow2 = document.getElementById('tNow2');
const tDur2 = document.getElementById('tDur2');

// Format time (mm:ss)
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Load / render song list
function renderList(filter = '') {
  listEl.innerHTML = '';
  const favsOnly = document.getElementById('filterFavs').classList.contains('on');

  songs
    .filter(song => {
      if (favsOnly && !song.fav) return false;
      const term = filter.toLowerCase();
      return song.title.toLowerCase().includes(term) || song.artist.toLowerCase().includes(term);
    })
    .forEach((song, index) => {
      const el = document.createElement('div');
      el.className = 'song' + (index === currentIndex ? ' current' : '');
      el.innerHTML = `
        <div class="art"><img src="${song.art || 'placeholder-art.jpg'}" alt=""></div>
        <div class="meta">
          <div class="t">${song.title}</div>
          <div class="a">${song.artist}</div>
        </div>
        <div class="rowBtns">
          <button class="btn play" onclick="playSong(${index})">${index === currentIndex && isPlaying ? 'Pause' : 'Play'}</button>
          <button class="btn ghost heart" onclick="toggleFav(${index})">${song.fav ? '♥' : '♡'}</button>
          <button class="btn download" onclick="downloadSong(${index})">Download</button>
        </div>
      `;
      listEl.appendChild(el);
    });
}

// Play a song by index
function playSong(index) {
  if (index === currentIndex && isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    currentIndex = index;
    const song = songs[index];
    audio.src = song.url;
    audio.play().catch(e => console.error("Play failed:", e));
    isPlaying = true;
    updateUI();
  }
  renderList(document.getElementById('search').value);
}

// Update mini/modal UI
function updateUI() {
  if (currentIndex < 0) return;

  const song = songs[currentIndex];
  miniTitle.textContent = song.title;
  miniArtist.textContent = song.artist;
  npTitle.textContent = song.title;
  npArtist.textContent = song.artist;

  document.querySelectorAll('.song').forEach((el, i) => {
    el.classList.toggle('current', i === currentIndex);
  });

  mini.classList.add('show');
  if (modal.classList.contains('show')) {
    // Update modal progress too
  }
}

// Progress / time update
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  barFill.style.width = percent + '%';
  barFill2.style.width = percent + '%';
  scrub.value = percent;
  scrub2.value = percent;
  tNow.textContent = formatTime(audio.currentTime);
  tDur.textContent = formatTime(audio.duration);
  tNow2.textContent = formatTime(audio.currentTime);
  tDur2.textContent = formatTime(audio.duration);
});

// Scrub / seek
function setupScrub(el) {
  el.addEventListener('input', () => {
    const percent = el.value;
    audio.currentTime = (percent / 100) * audio.duration;
  });
}
setupScrub(scrub);
setupScrub(scrub2);

// Play/pause buttons
miniPlay.addEventListener('click', () => {
  if (isPlaying) {
    audio.pause();
    miniPlay.textContent = '▶';
  } else {
    audio.play();
    miniPlay.textContent = '❚❚';
  }
  isPlaying = !isPlaying;
  npPlay.textContent = isPlaying ? '❚❚' : '▶';
});

npPlay.addEventListener('click', () => miniPlay.click());

// Next / Prev
document.getElementById('miniNext').onclick = document.getElementById('npNext').onclick = () => {
  let next = currentIndex + 1;
  if (isShuffle) {
    next = Math.floor(Math.random() * songs.length);
  } else if (next >= songs.length) {
    next = isRepeat ? 0 : currentIndex;
  }
  playSong(next);
};

document.getElementById('miniPrev').onclick = document.getElementById('npPrev').onclick = () => {
  let prev = currentIndex - 1;
  if (prev < 0) prev = isRepeat ? songs.length - 1 : 0;
  playSong(prev);
};

// Shuffle / Repeat
document.getElementById('shuffleBtn').onclick = function() {
  isShuffle = !isShuffle;
  this.classList.toggle('on', isShuffle);
  this.textContent = isShuffle ? 'Shuffle On' : 'Shuffle';
};

document.getElementById('repeatBtn').onclick = function() {
  isRepeat = !isRepeat;
  this.classList.toggle('on', isRepeat);
  this.textContent = isRepeat ? 'Repeat On' : 'Repeat';
};

// Fav toggle
function toggleFav(index) {
  songs[index].fav = !songs[index].fav;
  localStorage.setItem('gzup_favs', JSON.stringify(songs.map(s => s.fav)));
  renderList(document.getElementById('search').value);
}

// Download placeholder
function downloadSong(index) {
  const song = songs[index];
  if (song.url.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = song.url;
    a.download = `${song.title} - ${song.artist}.mp3`;
    a.click();
  } else {
    alert('Download not available for this track (remote URL)');
  }
}

// Search / filter
document.getElementById('search').addEventListener('input', e => {
  renderList(e.target.value);
});

// Favs filter
document.getElementById('filterFavs').onclick = function() {
  this.classList.toggle('on');
  this.textContent = this.classList.contains('on') ? 'Favs Only' : 'All';
  renderList(document.getElementById('search').value);
};

// Modal open/close
document.getElementById('openNowPlaying').onclick = () => modal.classList.add('show');
document.getElementById('closeModal').onclick = () => modal.classList.remove('show');

// Initial load (example songs - replace with your data source)
function init() {
  // Example placeholder songs (add your own or load from localStorage / JSON)
  songs = [
    { title: "God's Plan", artist: "Drake", url: "https://example.com/song1.mp3", art: "", fav: false },
    { title: "Blinding Lights", artist: "The Weeknd", url: "https://example.com/song2.mp3", art: "", fav: false },
    // ... add more or load dynamically
  ];

  // Restore favs from localStorage if any
  const savedFavs = JSON.parse(localStorage.getItem('gzup_favs') || '[]');
  songs.forEach((s, i) => { if (savedFavs[i]) s.fav = true; });

  renderList();
}

window.addEventListener('load', init);

// Audio ended → next song
audio.addEventListener('ended', () => {
  if (isRepeat) {
    playSong(currentIndex);
  } else {
    document.getElementById('miniNext').click();
  }
});
