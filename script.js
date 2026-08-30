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
      <img src="${IMG_PATH + poster_path}" alt="${title}">
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
        card.innerHTML = `<span>#${index + 1}</span><img src="${IMG_PATH + item.poster_path}" alt="${title}">`;
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
      card.innerHTML = `
        <img src="${IMG_PATH + item.poster_path}" alt="${title}">
        <div class="progress-bar"><div class="progress-fill" style="width: 60%;"></div></div>
      `;
      card.addEventListener('click', () => openModal(item, item.media_type || 'movie'));
      continueCarousel.appendChild(card);
    });
  } else {
    continueSection.style.display = 'none';
  }
}

function loadContent(resetPage = true) {
  isSearchMode = false;
  carouselSection.style.display = 'block';
  heroBanner.style.display = featuredItem && featuredItem.backdrop_path ? 'flex' : 'none';
  loadContinueWatching();
  
  if (resetPage) currentPage = 1;
  sectionTitle.textContent = `Explore ${currentType === 'movie' ? 'Movies' : 'TV Series'}`;
  
  let queryParams = `api_key=${API_KEY}&sort_by=${sortSelect.value}&page=`;
  if (genreSelect.value) queryParams += `&with_genres=${genreSelect.value}`;
  if (languageSelect.value) queryParams += `&with_original_language=${languageSelect.value}`;
  if (yearSelect.value) {
    queryParams += currentType === 'movie' ? `&primary_release_year=${yearSelect.value}` : `&first_air_date_year=${yearSelect.value}`;
  }

  currentFetchUrl = `https://api.themoviedb.org/3/discover/${currentType}?${queryParams}`;
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

function saveContinueWatching(item, type) {
  let history = JSON.parse(localStorage.getItem('kiosh_continue')) || [];
  history = history.filter(i => i.id !== item.id);
  history.unshift({ ...item, media_type: type });
  if (history.length > 10) history.pop();
  localStorage.setItem('kiosh_continue', JSON.stringify(history));
  loadContinueWatching();
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
    s3: `https://vidlink.pro/tv/${id}/${s}/${e}`
  } : {
    s1: `https://vidsrc.me/embed/movie?tmdb=${id}`,
    s2: `https://vidsrc.cc/v2/embed/movie/${id}`,
    s3: `https://vidlink.pro/movie/${id}`
  };

  let links = getLinks(season, episode);
  const isInWatchlist = getWatchlist().some(i => i.id === id);

  modalBody.innerHTML = `
    <h3 style="margin-bottom:12px; font-size:18px; color:#fff;">${title}</h3>
    <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">
      <button id="modalWatchlistBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:${isInWatchlist ? '#e50914' : '#222'}; color:#fff;">${isInWatchlist ? '✓ In Watchlist' : '+ Watchlist'}</button>
      <button id="trailerBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#222; color:#fff;">▶ Trailer</button>
      <button id="shareBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#222; color:#fff;">🔗 Share</button>
      ${type === 'tv' ? `<button id="nextEpBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#e50914; color:#fff;">⏭ Next Ep</button>` : ''}
    </div>
    ${type === 'tv' ? `
      <div style="display:flex; gap:10px; margin-bottom:12px; background:rgba(255,255,255,0.03); padding:10px; border-radius:10px;">
        <select id="seasonSelect" style="flex:1; background:#1a1a1a; color:#fff; padding:6px; border-radius:6px;">${Array.from({length: 10}, (_, i) => `<option value="${i+1}">Season ${i+1}</option>`).join('')}</select>
        <select id="episodeSelect" style="flex:1; background:#1a1a1a; color:#fff; padding:6px; border-radius:6px;">${Array.from({length: 25}, (_, i) => `<option value="${i+1}">Episode ${i+1}</option>`).join('')}</select>
      </div>
    ` : ''}
    <div style="display:flex; gap:6px; margin-bottom:12px;" id="serverButtons">
      <button onclick="changeServer('${links.s1}', this)" class="server-btn" style="padding:6px 14px; font-size:12px; background:#e50914; color:#fff; border:none; border-radius:8px; cursor:pointer;">Server 1</button>
      <button onclick="changeServer('${links.s2}', this)" class="server-btn" style="padding:6px 14px; font-size:12px; background:#222; color:#ccc; border:none; border-radius:8px; cursor:pointer;">Server 2</button>
      <button onclick="changeServer('${links.s3}', this)" class="server-btn" style="padding:6px 14px; font-size:12px; background:#222; color:#ccc; border:none; border-radius:8px; cursor:pointer;">Server 3</button>
    </div>
    <div style="border-radius:10px; overflow:hidden; margin-bottom:12px;">
      <iframe id="playerIframe" src="${links.s1}" width="100%" height="260" frameborder="0" allowfullscreen style="display:block; background:#000;"></iframe>
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
        actorDiv.innerHTML = `
          <img src="${profileImg}" alt="${actor.name}">
          <span>${actor.name}</span>
        `;
        castScrollContainer.appendChild(actorDiv);
      });
    } else {
      document.getElementById('castSection').style.display = 'none';
    }
  } catch (err) {
    document.getElementById('castSection').style.display = 'none';
  }

  document.getElementById('trailerBtn').addEventListener('click', async () => {
    const vidRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`);
    const vidData = await vidRes.json();
    const trailer = vidData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) document.getElementById('playerIframe').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
    else alert('Trailer not available.');
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
    const updateSrc = () => {
      let nl = getLinks(sSelect.value, eSelect.value);
      document.getElementById('playerIframe').src = nl.s1;
    };
    sSelect.addEventListener('change', updateSrc);
    eSelect.addEventListener('change', updateSrc);

    document.getElementById('nextEpBtn').addEventListener('click', () => {
      let cur = parseInt(eSelect.value);
      if(cur < 25) { eSelect.value = cur + 1; updateSrc(); }
    });
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
