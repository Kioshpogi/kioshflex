const API_KEY = '5959ee7103e0456dc8c681afb1462d4a'; 
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

const movieGrid = document.getElementById('movieGrid');
const top10Carousel = document.getElementById('top10Carousel');
const continueCarousel = document.getElementById('continueCarousel');
const continueSection = document.getElementById('continueSection');
const carouselSection = document.getElementById('carouselSection');
const heroBanner = document.getElementById('heroBanner');
const heroTitle = document.getElementById('heroTitle');
const heroPlayBtn = document.getElementById('heroPlayBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sectionTitle = document.getElementById('sectionTitle');
const modal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const watchlistNavBtn = document.getElementById('watchlistNavBtn');

// Sidebar Elements
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');

const genreSelect = document.getElementById('genreSelect');
const languageSelect = document.getElementById('languageSelect');
const sortSelect = document.getElementById('sortSelect');
const yearSelect = document.getElementById('yearSelect');

let currentType = 'movie';
let currentPage = 1;
let currentFetchUrl = '';
let isLoadingMore = false;
let isSearchMode = false;
let featuredItem = null;

if (localStorage.getItem('kiosh_theme') === 'light') {
  document.body.classList.add('light-mode');
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('kiosh_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
});

hamburgerBtn.addEventListener('click', () => {
  sidebar.classList.add('open');
  sidebarOverlay.style.display = 'block';
});

const closeSidebarMenu = () => {
  sidebar.classList.remove('open');
  sidebarOverlay.style.display = 'none';
};

closeSidebar.addEventListener('click', closeSidebarMenu);
sidebarOverlay.addEventListener('click', closeSidebarMenu);

async function getMedia(url, type, append = false) {
  try {
    isLoadingMore = true;
    const res = await fetch(url);
    const data = await res.json();
    if(data.results && data.results.length > 0) {
      showMedia(data.results, type, append);
    } else if (!append) {
      movieGrid.innerHTML = '<p style="color:#aaa; padding:20px;">No results found for this filter combination. Try resetting filters.</p>';
    }
  } catch (error) {
    if (!append) movieGrid.innerHTML = '<p style="color:#e50914; padding:20px;">Error loading data.</p>';
  } finally {
    isLoadingMore = false;
  }
}

function showMedia(items, type, append = false) {
  if (!append) movieGrid.innerHTML = '';
  items.forEach(item => {
    const title = item.title || item.name;
    const { poster_path, vote_average } = item;
    if(!poster_path) return;

    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <img src="${IMG_PATH + poster_path}" alt="${title}" style="-webkit-touch-callout: none; user-select: none;">
      <div class="card-info">
        <h3>${title}</h3>
        <span>★ ${vote_average ? vote_average.toFixed(1) : 'N/A'}</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(item, type));
    movieGrid.appendChild(card);
  });
}

async function loadHeroAndTop10() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}`);
    const data = await res.json();
    if(data.results && data.results.length > 0) {
      const validItems = data.results.filter(item => item.backdrop_path);
      if (validItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * validItems.length);
        featuredItem = validItems[randomIndex];
        heroTitle.textContent = featuredItem.title || featuredItem.name;
        heroBanner.style.backgroundImage = `url(${BACKDROP_PATH + featuredItem.backdrop_path})`;
        heroBanner.style.display = 'flex';
        heroPlayBtn.onclick = () => openModal(featuredItem, featuredItem.media_type === 'tv' ? 'tv' : 'movie');
      }

      top10Carousel.innerHTML = '';
      data.results.slice(0, 10).forEach((item, index) => {
        const title = item.title || item.name;
        if(!item.poster_path) return;
        const card = document.createElement('div');
        card.classList.add('carousel-card');
        card.innerHTML = `<span>#${index + 1}</span><img src="${IMG_PATH + item.poster_path}" alt="${title}" style="-webkit-touch-callout: none; user-select: none;">`;
        card.addEventListener('click', () => openModal(item, item.media_type === 'tv' ? 'tv' : 'movie'));
        top10Carousel.appendChild(card);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

function loadContinueWatching() {
  const history = JSON.parse(localStorage.getItem('kiosh_continue')) || [];
  if (history.length > 0) {
    continueSection.style.display = 'block';
    continueCarousel.innerHTML = '';
    history.forEach(item => {
      const title = item.title || item.name;
      if(!item.poster_path) return;
      const card = document.createElement('div');
      card.classList.add('carousel-card');
      card.style.position = 'relative';
      
      card.innerHTML = `
        <img src="${IMG_PATH + item.poster_path}" alt="${title}" style="-webkit-touch-callout: none; user-select: none;">
        <button class="delete-history-btn" title="Remove" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2;">&times;</button>
      `;
      
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-history-btn')) {
          openModal(item, item.media_type || 'movie');
        }
      });

      const deleteBtn = card.querySelector('.delete-history-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromContinueWatching(item.id);
      });
      
      continueCarousel.appendChild(card);
    });
  } else {
    continueSection.style.display = 'none';
  }
}

function saveContinueWatching(item, type) {
  let history = JSON.parse(localStorage.getItem('kiosh_continue')) || [];
  history = history.filter(i => i.id !== item.id);
  history.unshift({ ...item, media_type: type });
  if (history.length > 10) history.pop();
  localStorage.setItem('kiosh_continue', JSON.stringify(history));
  loadContinueWatching();
}

function removeFromContinueWatching(id) {
  let history = JSON.parse(localStorage.getItem('kiosh_continue')) || [];
  history = history.filter(item => item.id !== id);
  localStorage.setItem('kiosh_continue', JSON.stringify(history));
  loadContinueWatching();
}

function loadContent(resetPage = true) {
  isSearchMode = false;
  carouselSection.style.display = 'block';
  heroBanner.style.display = featuredItem && featuredItem.backdrop_path ? 'flex' : 'none';
  loadContinueWatching();
  
  if (resetPage) currentPage = 1;
  sectionTitle.textContent = `Explore ${currentType === 'movie' ? 'Movies' : 'TV Series'}`;
  
  let yearParam = '';
  if (yearSelect.value) {
    yearParam = currentType === 'movie' ? `&primary_release_year=${yearSelect.value}` : `&first_air_date_year=${yearSelect.value}`;
  }

  let genreParam = genreSelect.value ? `&with_genres=${genreSelect.value}` : '';
  let langParam = languageSelect.value ? `&with_original_language=${languageSelect.value}` : '';
  let sortParam = sortSelect.value ? `&sort_by=${sortSelect.value}` : '&sort_by=popularity.desc';

  currentFetchUrl = `https://api.themoviedb.org/3/discover/${currentType}?api_key=${API_KEY}${sortParam}${genreParam}${langParam}${yearParam}&page=`;
  
  getMedia(currentFetchUrl + currentPage, currentType, false);
}

document.querySelectorAll('#btnMovies, #btnTV').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('#btnMovies, #btnTV').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentType = e.target.getAttribute('data-type');
    loadContent(true);
    closeSidebarMenu();
  });
});

genreSelect.addEventListener('change', () => { loadContent(true); closeSidebarMenu(); });
languageSelect.addEventListener('change', () => { loadContent(true); closeSidebarMenu(); });
sortSelect.addEventListener('change', () => { loadContent(true); closeSidebarMenu(); });
yearSelect.addEventListener('change', () => { loadContent(true); closeSidebarMenu(); });

function getWatchlist() { return JSON.parse(localStorage.getItem('kiosh_watchlist')) || []; }
function toggleWatchlist(item) {
  let watchlist = getWatchlist();
  const index = watchlist.findIndex(i => i.id === item.id);
  if(index > -1) watchlist.splice(index, 1);
  else watchlist.push(item);
  localStorage.setItem('kiosh_watchlist', JSON.stringify(watchlist));
}

watchlistNavBtn.addEventListener('click', () => {
  isSearchMode = true; 
  carouselSection.style.display = 'none';
  continueSection.style.display = 'none';
  heroBanner.style.display = 'none';
  sectionTitle.textContent = 'My Watchlist & History';
  const combined = [...getWatchlist(), ...(JSON.parse(localStorage.getItem('kiosh_continue')) || [])];
  if(combined.length > 0) showMedia(combined, currentType, false);
  else movieGrid.innerHTML = '<p style="color:#aaa; padding:20px;">Your Watchlist is empty.</p>';
});

searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if(query) {
    isSearchMode = true;
    carouselSection.style.display = 'none';
    continueSection.style.display = 'none';
    heroBanner.style.display = 'none';
    sectionTitle.textContent = `Search Results: ${query}`;
    currentPage = 1;
    currentFetchUrl = `https://api.themoviedb.org/3/search/${currentType}?api_key=${API_KEY}&query=${query}&page=`;
    getMedia(currentFetchUrl + currentPage, currentType, false);
  }
});

searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchBtn.click(); });

window.addEventListener('scroll', () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoadingMore) {
    currentPage++;
    if (currentFetchUrl) getMedia(currentFetchUrl + currentPage, currentType, true);
  }
});

async function openModal(item, type) {
  const title = item.title || item.name;
  const overview = item.overview;
  const id = item.id;
  saveContinueWatching(item, type);
  
  let season = 1, episode = 1;
  const getLinks = (s, e) => type === 'tv' ? {
    s1: `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
    s2: `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    s3: `https://vidlink.pro/tv/${id}/${s}/${e}`,
    s4: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    s5: `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
  } : {
    s1: `https://vidsrc.me/embed/movie?tmdb=${id}`,
    s2: `https://vidsrc.cc/v2/embed/movie/${id}`,
    s3: `https://vidlink.pro/movie/${id}`,
    s4: `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    s5: `https://www.2embed.cc/embed/${id}`
  };

  let links = getLinks(season, episode);
  const isInWatchlist = getWatchlist().some(i => i.id === id);

  modalBody.innerHTML = `
    <h3 style="margin-bottom:12px; font-size:18px; color:#fff;">${title}</h3>
    <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">
      <button id="modalWatchlistBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:${isInWatchlist ? '#e50914' : '#222'}; color:#fff;">${isInWatchlist ? '✓ In Watchlist' : '+ Watchlist'}</button>
      <button id="trailerBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#222; color:#fff;">▶ Trailer</button>
      <button id="shareBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#222; color:#fff;">Share</button>
      ${type === 'tv' ? `<button id="nextEpBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#e50914; color:#fff;">⏭ Next Ep</button>` : ''}
    </div>
    ${type === 'tv' ? `
      <div style="display:flex; gap:10px; margin-bottom:12px; background:rgba(255,255,255,0.03); padding:10px; border-radius:10px; align-items:center;">
        <select id="seasonSelect" style="flex:1; background:#1a1a1a; color:#fff; padding:6px; border-radius:6px;">${Array.from({length: 10}, (_, i) => `<option value="${i+1}">Season ${i+1}</option>`).join('')}</select>
        <select id="episodeSelect" style="flex:1; background:#1a1a1a; color:#fff; padding:6px; border-radius:6px;">${Array.from({length: 25}, (_, i) => `<option value="${i+1}">Episode ${i+1}</option>`).join('')}</select>
        <button id="autoNextToggle" style="background:#222; color:#aaa; border:none; padding:6px 10px; font-size:11px; border-radius:6px; cursor:pointer;" title="Toggle Auto-Next Countdown">Auto-Next: OFF</button>
      </div>
    ` : ''}
    <div style="display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap;" id="serverButtons">
      <button onclick="changeServer('${links.s1}', this)" class="server-btn" style="padding:6px 12px; font-size:11px; background:#e50914; color:#fff; border:none; border-radius:8px; cursor:pointer;">Server 1</button>
      <button onclick="changeServer('${links.s2}', this)" class="server-btn" style="padding:6px 12px; font-size:11px; background:#222; color:#ccc; border:none; border-radius:8px; cursor:pointer;">Server 2</button>
      <button onclick="changeServer('${links.s3}', this)" class="server-btn" style="padding:6px 12px; font-size:11px; background:#222; color:#ccc; border:none; border-radius:8px; cursor:pointer;">Server 3</button>
      <button onclick="changeServer('${links.s4}', this)" class="server-btn" style="padding:6px 12px; font-size:11px; background:#222; color:#ccc; border:none; border-radius:8px; cursor:pointer;">Server 4</button>
      <button onclick="changeServer('${links.s5}', this)" class="server-btn" style="padding:6px 12px; font-size:11px; background:#222; color:#ccc; border:none; border-radius:8px; cursor:pointer;">Server 5</button>
    </div>
    <div style="border-radius:10px; overflow:hidden; margin-bottom:12px; position:relative;">
      <iframe id="playerIframe" src="${links.s1}" width="100%" height="260" frameborder="0" allowfullscreen style="display:block; background:#000;"></iframe>
      <div id="autoNextOverlay" style="display:none; position:absolute; bottom:15px; right:15px; background:rgba(0,0,0,0.85); border:1px solid #e50914; padding:10px 14px; border-radius:8px; color:#fff; font-size:12px; z-index:5; align-items:center; gap:10px;">
        <span id="countdownText">Next ep in 5s...</span>
        <button id="cancelAutoNext" style="background:#222; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer;">Cancel</button>
      </div>
    </div>
    <p style="color:#bbb; font-size:12px; line-height:1.4; margin-bottom:10px; max-height:50px; overflow-y:auto;">${overview || 'No overview available.'}</p>
    
    <div id="castSection" style="margin-top: 10px;">
      <strong style="font-size:12px; color:#fff;">Top Cast:</strong>
      <div id="castScrollContainer" class="cast-scroll"><span style="font-size:11px; color:#777;">Loading cast...</span></div>
    </div>
  `;

  modal.style.display = 'flex';

  try {
    const castRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}`);
    const castData = await castRes.json();
    const castScrollContainer = document.getElementById('castScrollContainer');
    
    if (castData.cast && castData.cast.length > 0) {
      castScrollContainer.innerHTML = '';
      castData.cast.slice(0, 10).forEach(actor => {
        const profileImg = actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://via.placeholder.com/50x50?text=No+Img';
        const actorDiv = document.createElement('div');
        actorDiv.classList.add('cast-item');
        actorDiv.style.cursor = 'pointer';
        actorDiv.innerHTML = `
          <img src="${profileImg}" alt="${actor.name}" style="-webkit-touch-callout: none; user-select: none;">
          <span>${actor.name}</span>
        `;
        
        actorDiv.addEventListener('click', () => openActorModal(actor.id));
        castScrollContainer.appendChild(actorDiv);
      });
    } else {
      document.getElementById('castSection').style.display = 'none';
    }
  } catch (err) {
    document.getElementById('castSection').style.display = 'none';
  }

  // IN-APP TRAILER MODAL LOGIC
  document.getElementById('trailerBtn').addEventListener('click', async () => {
    const vidRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`);
    const vidData = await vidRes.json();
    const trailer = vidData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) {
      document.getElementById('playerIframe').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
    } else {
      alert('Trailer not available.');
    }
  });

  document.getElementById('shareBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied to clipboard!'));
  });

  document.getElementById('modalWatchlistBtn').addEventListener('click', (e) => {
    toggleWatchlist(item);
    const inList = getWatchlist().some(i => i.id === id);
    e.target.textContent = inList ? '✓ In Watchlist' : '+ Watchlist';
    e.target.style.background = inList ? '#e50914' : '#222';
  });

  if (type === 'tv') {
    const sSelect = document.getElementById('seasonSelect');
    const eSelect = document.getElementById('episodeSelect');
    let autoNextActive = false;
    let countdownInterval = null;

    const updateSrc = () => {
      let nl = getLinks(sSelect.value, eSelect.value);
      document.getElementById('playerIframe').src = nl.s1;
      resetCountdown();
    };

    sSelect.addEventListener('change', updateSrc);
    eSelect.addEventListener('change', updateSrc);

    const triggerNextEpisode = () => {
      let curEp = parseInt(eSelect.value);
      if (curEp < 25) {
        eSelect.value = curEp + 1;
        updateSrc();
      }
    };

    const resetCountdown = () => {
      clearInterval(countdownInterval);
      document.getElementById('autoNextOverlay').style.display = 'none';
      if (autoNextActive) startCountdown();
    };

    const startCountdown = () => {
      let timeLeft = 10; // 10 seconds simulation countdown
      const overlay = document.getElementById('autoNextOverlay');
      const text = document.getElementById('countdownText');
      overlay.style.display = 'flex';
      text.textContent = `Next ep in ${timeLeft}s...`;

      countdownInterval = setInterval(() => {
        timeLeft--;
        text.textContent = `Next ep in ${timeLeft}s...`;
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          overlay.style.display = 'none';
          triggerNextEpisode();
        }
      }, 1000);
    };

    const autoToggleBtn = document.getElementById('autoNextToggle');
    autoToggleBtn.addEventListener('click', () => {
      autoNextActive = !autoNextActive;
      autoToggleBtn.style.background = autoNextActive ? '#e50914' : '#222';
      autoToggleBtn.style.color = autoNextActive ? '#fff' : '#aaa';
      autoToggleBtn.textContent = `Auto-Next: ${autoNextActive ? 'ON' : 'OFF'}`;
      if (autoNextActive) {
        startCountdown();
      } else {
        resetCountdown();
      }
    });

    document.getElementById('cancelAutoNext').addEventListener('click', () => {
      resetCountdown();
    });

    document.getElementById('nextEpBtn').addEventListener('click', () => {
      let cur = parseInt(eSelect.value);
      if(cur < 25) { eSelect.value = cur + 1; updateSrc(); }
    });
  }
}

async function openActorModal(personId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/person/${personId}?api_key=${API_KEY}`);
    const person = await res.json();

    const creditsRes = await fetch(`https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${API_KEY}`);
    const creditsData = await creditsRes.json();
    
    const profileImg = person.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : 'https://via.placeholder.com/150?text=No+Img';
    
    modalBody.innerHTML = `
      <button id="backToMediaBtn" style="background:#222; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; margin-bottom:12px;">← Close</button>
      <div style="display:flex; gap:15px; align-items:flex-start; margin-bottom:15px; flex-wrap:wrap;">
        <img src="${profileImg}" alt="${person.name}" style="width:100px; height:150px; object-fit:cover; border-radius:8px;">
        <div style="flex:1;">
          <h3 style="color:#fff; font-size:18px; margin-bottom:5px;">${person.name}</h3>
          <p style="color:#aaa; font-size:12px; margin-bottom:8px;"><strong>Born:</strong> ${person.birthday || 'N/A'}</p>
          <p style="color:#bbb; font-size:11px; max-height:80px; overflow-y:auto; line-height:1.4;">${person.biography || 'No biography available.'}</p>
        </div>
      </div>
      <h4 style="color:#fff; font-size:14px; margin-bottom:8px;">Filmography:</h4>
      <div id="actorMoviesGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap:8px; max-height:200px; overflow-y:auto;">
        ${creditsData.cast && creditsData.cast.length > 0 ? creditsData.cast.map(media => {
          if(!media.poster_path) return '';
          return `
            <div class="actor-media-card" data-id="${media.id}" data-type="${media.media_type || 'movie'}" style="cursor:pointer;">
              <img src="https://image.tmdb.org/t/p/w185${media.poster_path}" style="width:100%; border-radius:6px;" alt="${media.title || media.name}">
              <span style="font-size:10px; color:#aaa; display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${media.title || media.name}</span>
            </div>
          `;
        }).join('') : '<p style="color:#aaa; font-size:11px;">No filmography found.</p>'}
      </div>
    `;

    document.getElementById('backToMediaBtn').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    document.querySelectorAll('.actor-media-card').forEach(card => {
      card.addEventListener('click', () => {
        const mediaId = card.getAttribute('data-id');
        const mediaType = card.getAttribute('data-type');
        fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${API_KEY}`)
          .then(res => res.json())
          .then(item => openModal(item, mediaType));
      });
    });

  } catch (err) {
    console.error(err);
    alert('Failed to load actor profile.');
  }
}

window.changeServer = function(url, btn) {
  document.getElementById('playerIframe').src = url;
  document.querySelectorAll('#serverButtons button').forEach(b => { b.style.background = '#222'; b.style.color = '#ccc'; });
  btn.style.background = '#e50914'; btn.style.color = '#fff';
};

closeModal.addEventListener('click', () => { modal.style.display = 'none'; modalBody.innerHTML = ''; });
window.addEventListener('click', (e) => { if (e.target === modal) { modal.style.display = 'none'; modalBody.innerHTML = ''; } });

loadHeroAndTop10();
loadContent(true);
