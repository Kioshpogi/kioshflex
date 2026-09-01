// Kioshflex AI Chat Script & Main Functionality (Streaming Enabled & Robust Error Handling)
const aiChatInput = document.getElementById('aiChatInput');
const aiChatSend = document.getElementById('aiChatSend');
const aiChatMessages = document.getElementById('aiChatMessages');
const aiChatToggleBt = document.getElementById('aiChatToggleBtn');
const aiChatBox = document.getElementById('aiChatBox');
const aiChatClose = document.getElementById('aiChatClose');

const API_KEY = '5959ee7103e0456dc8c681afb1462d4a'; 
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

const movieGrid = document.getElementById('movieGrid');
const top10Carousl = document.getElementById('top10Carousel');
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

const suggestionsBox = document.getElementById('suggestionsBox');
const searchHistoryContainer = document.getElementById('searchHistoryContainer');
const searchDropdownWrapper = document.getElementById('searchDropdownWrapper');
const homeLogo = document.getElementById('homeLogo');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyHeader = document.getElementById('historyHeader');

const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');

const genreSelect = document.getElementById('genreSelect');
const languageSelect = document.getElementById('languageSelect');
const sortSelect = document.getElementById('sortSelect');
const yearSelect = document.getElementById('yearSelect');

for (let y = 2026; y >= 2000; y--) {
  const option = document.createElement('option');
  option.value = y;
  option.textContent = y;
  yearSelect.appendChild(option);
}

let currentType = 'movie';
let currentPage = 1;
let currentFetchUrl = '';
let isLoadingMore = false;
let isSearchMode = false;
let featuredItem = null;

window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.style.transition = 'opacity 0.5s ease-out';
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }
  }, 400);
});

if (localStorage.getItem('kiosh_theme') === 'light') {
  document.body.classList.add('light-mode');
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('kiosh_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
});

homeLogo.addEventListener('click', () => {
  searchInput.value = '';
  if (searchDropdownWrapper) searchDropdownWrapper.style.display = 'none';
  loadContent(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (!append) {
      movieGrid.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        movieGrid.appendChild(skeleton);
      }
    }
    const res = await fetch(url);
    const data = await res.json();
    if(data.results && data.results.length > 0) {
      showMedia(data.results, type, append);
    } else if (!append) {
      movieGrid.innerHTML = '<p style="color:#aaa; padding:20px;">No results found.</p>';
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
      <div style="position: relative; width: 100%; height: calc(100% - 50px);">
        <img class="card-img" src="${IMG_PATH + poster_path}" alt="${title}" style="width:100%; height:100%; object-fit:cover;">
        <div class="hover-preview-container" style="position: absolute; inset: 0; background: #000; display: none; z-index: 3; overflow: hidden;"></div>
        <button class="quick-trailer-btn" data-id="${item.id}" data-type="${type}" title="Quick Trailer" style="position: absolute; top: 8px; right: 8px; background: rgba(20, 20, 20, 0.7); color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 4; box-shadow: 0 2px 6px rgba(0,0,0,0.5); transition: transform 0.2s ease, background 0.2s ease;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 1px;"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="card-info">
        <h3>${title}</h3>
        <span>★ ${vote_average ? vote_average.toFixed(1) : 'N/A'}</span>
      </div>
    `;

    let hoverTimeout;
    const previewContainer = card.querySelector('.hover-preview-container');
    
    card.addEventListener('mouseenter', () => {
      hoverTimeout = setTimeout(async () => {
        try {
          const vidRes = await fetch(`https://api.themoviedb.org/3/${type}/${item.id}/videos?api_key=${API_KEY}`);
          const vidData = await vidRes.json();
          const teaser = vidData.results.find(v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
          if (teaser) {
            previewContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${teaser.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${teaser.key}" width="100%" height="100%" frameborder="0" style="position: absolute; top: 50%; left: 50%; width: 200%; height: 200%; transform: translate(-50%, -50%); pointer-events: none;"></iframe>`;
            previewContainer.style.display = 'block';
            card.style.boxShadow = '0 0 25px rgba(229,9,20,0.6)';
          }
        } catch (e) {}
      }, 600);
    });

    card.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      previewContainer.innerHTML = '';
      previewContainer.style.display = 'none';
      card.style.boxShadow = 'none';
    });

    card.addEventListener('click', () => openModal(item, type));

    const quickBtn = card.querySelector('.quick-trailer-btn');
    quickBtn.addEventListener('mouseenter', () => {
      quickBtn.style.transform = 'scale(1.1)';
      quickBtn.style.background = 'rgba(229, 9, 20, 0.85)';
    });
    quickBtn.addEventListener('mouseleave', () => {
      quickBtn.style.transform = 'scale(1)';
      quickBtn.style.background = 'rgba(20, 20, 20, 0.7)';
    });

    quickBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const mediaId = e.target.getAttribute('data-id') || e.target.closest('.quick-trailer-btn').getAttribute('data-id');
      const mediaType = e.target.getAttribute('data-type') || e.target.closest('.quick-trailer-btn').getAttribute('data-type');
      
      try {
        const vidRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}/videos?api_key=${API_KEY}`);
        const vidData = await vidRes.json();
        const trailer = vidData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        
        if (trailer) {
          modalBody.innerHTML = `
            <button id="backFromTrailerBtn" style="background:#222; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; margin-bottom:12px;">&larr; Close</button>
            <h3 style="margin-bottom:12px; font-size:16px; color:#fff;">Trailer Preview</h3>
            <div style="border-radius:10px; overflow:hidden; position:relative; padding-bottom:56.25%; height:0; background:#000;">
              <iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" width="100%" height="100%" frameborder="0" allowfullscreen style="position:absolute; top:0; left:0; width:100%; height:100%;"></iframe>
            </div>
          `;
          modal.style.display = 'flex';
          document.getElementById('backFromTrailerBtn').addEventListener('click', () => {
            modal.style.display = 'none';
            modalBody.innerHTML = '';
          });
        } else {
          alert('Trailer not available.');
        }
      } catch (err) {}
    });

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
        const title = featuredItem.title || featuredItem.name;
        heroTitle.textContent = title;
        
        const mediaType = featuredItem.media_type === 'tv' ? 'tv' : 'movie';
        
        heroBanner.style.backgroundImage = `url(${BACKDROP_PATH + featuredItem.backdrop_path})`;
        heroBanner.style.backgroundSize = 'cover';
        heroBanner.style.backgroundPosition = 'center';
        heroBanner.style.display = 'flex';
        heroPlayBtn.onclick = () => openModal(featuredItem, mediaType);

        setTimeout(async () => {
          try {
            const vidRes = await fetch(`https://api.themoviedb.org/3/${mediaType}/${featuredItem.id}/videos?api_key=${API_KEY}`);
            const vidData = await vidRes.json();
            const trailer = vidData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            
            if (trailer) {
              heroBanner.innerHTML = `
                <div style="position: absolute; inset: 0; overflow: hidden; z-index: 1;" id="iframeContainer">
                  <iframe id="heroIframe" src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&enablejsapi=1" width="100%" height="100%" frameborder="0" style="position: absolute; top: 50%; left: 50%; width: 100vw; height: 56.25vw; min-height: 100%; min-width: 177.77vh; transform: translate(-50%, -50%); pointer-events: none;" allow="autoplay"></iframe>
                </div>
                <div style="position: absolute; inset: 0; background: linear-gradient(0deg, #141414 0%, transparent 60%); z-index: 2; pointer-events: none;"></div>
                <div style="position: absolute; bottom: 24px; left: 24px; z-index: 3; display:flex; align-items:flex-end; justify-content:space-between; width: calc(100% - 48px);">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 5px; height: 36px; background-color: #e50914; border-radius: 3px;"></div>
                    <h1 style="font-size: 32px; font-weight: 800; color: #fff; margin: 0; text-shadow: 2px 2px 8px rgba(0,0,0,0.9);">${title}</h1>
                  </div>
                  <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="heroPlayBtnDynamic" style="background: #e50914; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">▶ Play</button>
                    <button id="unmuteBtn" style="background: rgba(20,20,20,0.7); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer;">Muted Off</button>
                  </div>
                </div>
              `;
              
              const dynamicPlayBtn = document.getElementById('heroPlayBtnDynamic');
              if (dynamicPlayBtn && featuredItem) {
                dynamicPlayBtn.onclick = () => openModal(featuredItem, mediaType);
              }

              const unmuteBtn = document.getElementById('unmuteBtn');
              const heroIframe = document.getElementById('heroIframe');
              if (unmuteBtn && heroIframe) {
                let isMuted = true;
                unmuteBtn.onclick = () => {
                  isMuted = !isMuted;
                  heroIframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&loop=1&playlist=${trailer.key}`;
                  unmuteBtn.textContent = isMuted ? 'Muted Off' : 'Muted On';
                };
              }
            }
          } catch (e) {}
        }, 800);
      }

      top10Carousl.innerHTML = '';
      data.results.slice(0, 10).forEach((item, index) => {
        const title = item.title || item.name;
        if(!item.poster_path) return;
        const card = document.createElement('div');
        card.classList.add('carousel-card');
        card.innerHTML = `<span>#${index + 1}</span><img src="${IMG_PATH + item.poster_path}" alt="${title}">`;
        card.addEventListener('click', () => openModal(item, item.media_type === 'tv' ? 'tv' : 'movie'));
        top10Carousl.appendChild(card);
      });
    }
  } catch (err) {}
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
      
      const badgeText = item.media_type === 'tv' && item.savedSeason ? `S${item.savedSeason} E${item.savedEpisode}` : '';

      card.innerHTML = `
        <div style="position: relative;">
          <img src="${IMG_PATH + item.poster_path}" alt="${title}" style="width:100%; height:160px; object-fit:cover; border-radius:10px;">
        </div>
        ${badgeText ? `<span style="position: absolute; bottom: 8px; left: 5px; background: rgba(229, 9, 20, 0.85); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${badgeText}</span>` : ''}
        <button class="delete-history-btn" title="Remove" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2;">&times;</button>
      `;
      
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-history-btn')) {
          openModal(item, item.media_type || 'movie');
        }
      });

      card.querySelector('.delete-history-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromContinueWatching(item.id);
      });
      
      continueCarousel.appendChild(card);
    });
  } else {
    continueSection.style.display = 'none';
  }
}

function saveContinueWatching(item, type, season = 1, episode = 1) {
  let history = JSON.parse(localStorage.getItem('kiosh_continue')) || [];
  history = history.filter(i => i.id !== item.id);
  history.unshift({ ...item, media_type: type, savedSeason: season, savedEpisode: episode, progress: 45 });
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
  
  let yearParam = yearSelect.value ? (currentType === 'movie' ? `&primary_release_year=${yearSelect.value}` : `&first_air_date_year=${yearSelect.value}`) : '';
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
  sectionTitle.textContent = 'My Watchlist';
  const watchlistItems = getWatchlist();
  if(watchlistItems.length > 0) showMedia(watchlistItems, currentType, false);
  else movieGrid.innerHTML = '<p style="color:#aaa; padding:20px;">Your Watchlist is empty.</p>';
});

function getSearchHistory() { return JSON.parse(localStorage.getItem('kiosh_history')) || []; }
function saveSearchHistory(query) {
  let history = getSearchHistory();
  query = query.trim();
  if (query === '') return;
  history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  if (history.length > 5) history.pop();
  localStorage.setItem('kiosh_history', JSON.stringify(history));
  renderSearchHistory();
}

clearHistoryBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  localStorage.removeItem('kiosh_history');
  renderSearchHistory();
  if (searchInput.value.trim() === '' && searchDropdownWrapper) searchDropdownWrapper.style.display = 'none';
});

function renderSearchHistory() {
  const history = getSearchHistory();
  if (!searchHistoryContainer) return;
  searchHistoryContainer.innerHTML = '';
  if (history.length === 0) {
    if (historyHeader) historyHeader.style.display = 'none';
    searchHistoryContainer.style.display = 'none';
    return;
  }
  if (historyHeader) historyHeader.style.display = 'flex';
  searchHistoryContainer.style.display = 'flex';
  history.forEach(term => {
    const chip = document.createElement('div');
    chip.className = 'history-chip';
    chip.style.cssText = 'background-color: #18181b; border: 1px solid #27272a; color: #e4e4e7; padding: 4px 8px; border-radius: 8px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;';
    chip.innerHTML = `<span>${term}</span>`;
    chip.onclick = () => {
      searchInput.value = term;
      if (searchDropdownWrapper) searchDropdownWrapper.style.display = 'none';
      executeSearch(term);
    };
    searchHistoryContainer.appendChild(chip);
  });
}

searchInput.addEventListener('focus', () => {
  if (getSearchHistory().length > 0) {
    renderSearchHistory();
    if (searchDropdownWrapper) searchDropdownWrapper.style.display = 'flex';
  }
});

document.addEventListener('click', (e) => {
  if (!document.querySelector('.search-container').contains(e.target)) {
    if (searchDropdownWrapper) searchDropdownWrapper.style.display = 'none';
  }
});

searchInput.addEventListener('input', async (e) => {
  const keyword = e.target.value.trim();
  suggestionsBox.innerHTML = '';
  if (searchDropdownWrapper) searchDropdownWrapper.style.display = 'flex';
  renderSearchHistory();
  if (keyword.length === 0) return;
  
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/${currentType}?api_key=${API_KEY}&query=${keyword}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      data.results.slice(0, 5).forEach(item => {
        const title = item.title || item.name;
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = title;
        div.onclick = () => {
          searchInput.value = title;
          if (searchDropdownWrapper) searchDropdownWrapper.style.display = 'none';
          saveSearchHistory(title);
          executeSearch(title);
        };
        suggestionsBox.appendChild(div);
      });
    }
  } catch (err) {}
});

function executeSearch(query) {
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
}

searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if(query) {
    if (searchDropdownWrapper) searchDropdownWrapper.style.display = 'none';
    saveSearchHistory(query);
    executeSearch(query);
  }
});

searchInput.addEventListener('keypress', (e) => { 
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if(query) {
      if (searchDropdownWrapper) searchDropdownWrapper.style.display = 'none';
      saveSearchHistory(query);
      executeSearch(query);
    }
  } 
});

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
  
  const continueHistory = JSON.parse(localStorage.getItem('kiosh_continue')) || [];
  const existingProgress = continueHistory.find(i => i.id === id);
  
  let season = existingProgress ? (existingProgress.savedSeason || 1) : 1;
  let episode = existingProgress ? (existingProgress.savedEpisode || 1) : 1;

  saveContinueWatching(item, type, season, episode);
  
  const getLinks = (s, e) => type === 'tv' ? {
    s1: `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
    s2: `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    s3: `https://vidlink.pro/tv/${id}/${s}/${e}`,
    s4: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  } : {
    s1: `https://vidsrc.me/embed/movie?tmdb=${id}`,
    s2: `https://vidsrc.cc/v2/embed/movie/${id}`,
    s3: `https://vidlink.pro/movie/${id}`,
    s4: `https://multiembed.mov/?video_id=${id}&tmdb=1`
  };

  let links = getLinks(season, episode);
  const isInWatchlist = getWatchlist().some(i => i.id === id);

  modalBody.innerHTML = `
    <h3 style="margin-bottom:12px; font-size:18px; color:#fff;">${title}</h3>
    <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">
      <button id="modalWatchlistBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:${isInWatchlist ? '#e50914' : '#222'}; color:#fff;">${isInWatchlist ? '✓ In Watchlist' : '+ Watchlist'}</button>
      <button id="trailerBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#222; color:#fff;">&#9658; Trailer</button>
      <button id="shareBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#222; color:#fff;">Share</button>
    </div>
    
    ${type === 'tv' ? `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:10px; border-radius:10px; margin-bottom:12px;">
        <div style="display:flex; gap:6px; margin-bottom:8px; overflow-x:auto;" id="seasonTabsContainer">
          ${Array.from({length: 4}, (_, i) => `<button class="season-tab-btn ${i+1 === season ? 'active' : ''}" data-season="${i+1}" style="padding:5px 12px; font-size:11px; border-radius:6px; border:none; cursor:pointer; background:${i+1 === season ? '#e50914' : '#222'}; color:#fff;">Season ${i+1}</button>`).join('')}
        </div>
        <div style="max-height: 110px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;" id="episodeListContainer">
          <span style="font-size:11px; color:#888;">Loading episodes...</span>
        </div>
      </div>
    ` : ''}

    <div style="display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap;" id="serverButtons">
      <button onclick="changeServer('${links.s1}', this)" class="server-btn" style="padding:6px 12px; font-size:11px; background:#e50914; color:#fff; border:none; border-radius:8px; cursor:pointer;">Server 1</button>
      <button onclick="changeServer('${links.s2}', this)" class="server-btn" style="padding:6px 12px; font-size:11px; background:#222; color:#ccc; border:none; border-radius:8px; cursor:pointer;">Server 2</button>
      <button onclick="changeServer('${links.s3}', this)" class="server-btn" style="padding:6px 12px; font-size:11px; background:#222; color:#ccc; border:none; border-radius:8px; cursor:pointer;">Server 3</button>
      <button onclick="changeServer('${links.s4}', this)" class="server-btn" style="padding:6px 12px; font-size:11px; background:#222; color:#ccc; border:none; border-radius:8px; cursor:pointer;">Server 4</button>
    </div>
    
    <div style="border-radius:10px; overflow:hidden; margin-bottom:12px; position:relative;" id="playerWrapper">
      <iframe id="playerIframe" src="${links.s1}" width="100%" height="260" frameborder="0" allowfullscreen style="display:block; background:#000;"></iframe>
      ${type === 'tv' ? `
      <div class="custom-player-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(0deg, rgba(0,0,0,0.8), transparent); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; opacity: 0; transition: opacity 0.3s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">
        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="customSkipBack" style="background:none; border:none; color:#fff; cursor:pointer; font-size:12px;">↺ 10s</button>
          <button id="customSkipForward" style="background:none; border:none; color:#fff; cursor:pointer; font-size:12px;">10s ↻</button>
        </div>
        <button id="customNextEp" style="background:#e50914; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:11px; cursor:pointer;">Next Ep ➔</button>
      </div>` : ''}
    </div>
    
    <p style="color:#bbb; font-size:12px; line-height:1.4; margin-bottom:10px; max-height:50px; overflow-y:auto;">${overview || 'No overview available.'}</p>
    
    <div id="castSection" style="margin-top: 10px;">
      <strong style="font-size:12px; color:#fff;">Top Cast:</strong>
      <div id="castScrollContainer" class="cast-scroll"><span style="font-size:11px; color:#777;">Loading cast...</span></div>
    </div>
  `;

  modal.style.display = 'flex';

  if (type === 'tv') {
    const loadEpisodesForSeason = async (sNum) => {
      try {
        const epRes = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${sNum}?api_key=${API_KEY}`);
        const epData = await epRes.json();
        const epContainer = document.getElementById('episodeListContainer');
        if (epData.episodes && epData.episodes.length > 0) {
          epContainer.innerHTML = '';
          epData.episodes.forEach(ep => {
            const isCurrent = ep.episode_number === episode && sNum === season;
            const epCard = document.createElement('div');
            epCard.style.cssText = `display: flex; gap: 8px; padding: 6px; border-radius: 6px; background: ${isCurrent ? 'rgba(229,9,20,0.2)' : 'transparent'}; cursor: pointer; align-items: center;`;
            epCard.innerHTML = `
              <span style="font-size: 11px; font-weight: bold; color: ${isCurrent ? '#e50914' : '#fff'}; width: 20px;">${ep.episode_number}</span>
              <div style="flex: 1; overflow: hidden;">
                <div style="font-size: 11px; font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ep.name}</div>
                <div style="font-size: 9px; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ep.overview || 'No description'}</div>
              </div>
            `;
            epCard.onclick = () => {
              season = sNum;
              episode = ep.episode_number;
              saveContinueWatching(item, type, season, episode);
              let nl = getLinks(season, episode);
              document.getElementById('playerIframe').src = nl.s1;
              loadEpisodesForSeason(season);
            };
            epContainer.appendChild(epCard);
          });
        }
      } catch (e) {}
    };

    loadEpisodesForSeason(season);

    document.querySelectorAll('.season-tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('.season-tab-btn').forEach(b => { b.style.background = '#222'; b.classList.remove('active'); });
        e.target.style.background = '#e50914';
        e.target.classList.add('active');
        season = parseInt(e.target.getAttribute('data-season'));
        episode = 1;
        loadEpisodesForSeason(season);
        let nl = getLinks(season, episode);
        document.getElementById('playerIframe').src = nl.s1;
      };
    });

    const nextEpBtn = document.getElementById('customNextEp');
    if (nextEpBtn) {
      nextEpBtn.onclick = () => {
        episode++;
        saveContinueWatching(item, type, season, episode);
        let nl = getLinks(season, episode);
        document.getElementById('playerIframe').src = nl.s1;
        loadEpisodesForSeason(season);
      };
    }
  }

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
        actorDiv.innerHTML = `<img src="${profileImg}" alt="${actor.name}"><span>${actor.name}</span>`;
        actorDiv.addEventListener('click', () => openActorModal(actor.id));
        castScrollContainer.appendChild(actorDiv);
      });
    } else {
      document.getElementById('castSection').style.display = 'none';
    }
  } catch (err) {}

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
}

async function openActorModal(personId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/person/${personId}?api_key=${API_KEY}`);
    const person = await res.json();
    const creditsRes = await fetch(`https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${API_KEY}`);
    const creditsData = await creditsRes.json();
    const profileImg = person.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : 'https://via.placeholder.com/150?text=No+Img';
    
    modalBody.innerHTML = `
      <button id="backToMediaBtn" style="background:#222; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; margin-bottom:12px;">&larr; Close</button>
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

    document.getElementById('backToMediaBtn').addEventListener('click', () => { modal.style.display = 'none'; });
    document.querySelectorAll('.actor-media-card').forEach(card => {
      card.addEventListener('click', () => {
        fetch(`https://api.themoviedb.org/3/${card.getAttribute('data-type')}/${card.getAttribute('data-id')}?api_key=${API_KEY}`)
          .then(res => res.json())
          .then(item => openModal(item, card.getAttribute('data-type')));
      });
    });
  } catch (err) {}
}

window.changeServer = function(url, btn) {
  document.getElementById('playerIframe').src = url;
  document.querySelectorAll('#serverButtons button').forEach(b => { b.style.background = '#222'; b.style.color = '#ccc'; });
  btn.style.background = '#e50914'; btn.style.color = '#fff';
};

closeModal.addEventListener('click', () => { modal.style.display = 'none'; modalBody.innerHTML = ''; });
window.addEventListener('click', (e) => { if (e.target === modal) { modal.style.display = 'none'; modalBody.innerHTML = ''; } });

// --- AI Chat Assistant Integration ---
if (aiChatToggleBt && aiChatBox) {
  aiChatToggleBt.addEventListener('click', () => {
    aiChatBox.style.display = aiChatBox.style.display === 'flex' ? 'none' : 'flex';
  });

  aiChatClose.addEventListener('click', () => {
    aiChatBox.style.display = 'none';
  });

  aiChatSend.addEventListener('click', handleUserMessage);
  aiChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserMessage();
  });
}

function parseMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/###\s*(.*?)/g, '<strong style="display:block; margin-top:8px; color:#fff;">$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

async function handleUserMessage() {
  const text = aiChatInput.value.trim();
  if (!text) return;

  appendMessageToUI('user', text);
  aiChatInput.value = '';
  
  let aiMessageElement = appendMessageToUI('bot', 'Thinking...');
  let fullResponseText = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    });

    const rawText = await response.text();

    if (!response.ok) {
      let errorMsg = 'API error occurred.';
      try {
        const errJson = JSON.parse(rawText);
        errorMsg = errJson.error || errorMsg;
      } catch (e) {
        errorMsg = rawText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    if (rawText.trim().startsWith('{')) {
      try {
        const parsedJson = JSON.parse(rawText);
        const candidateText = parsedJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          updateMessageInUI(aiMessageElement, candidateText);
          return;
        } else if (parsedJson.error) {
          throw new Error(typeof parsedJson.error === 'string' ? parsedJson.error : JSON.stringify(parsedJson.error));
        }
      } catch (jsonErr) {
        if (jsonErr.message && !jsonErr.message.includes('JSON')) {
          throw jsonErr;
        }
      }
    }

    const lines = rawText.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunkText) {
            fullResponseText += chunkText;
            updateMessageInUI(aiMessageElement, fullResponseText);
          }
        } catch (e) {}
      }
    }

    if (!fullResponseText && !aiMessageElement.textContent) {
      updateMessageInUI(aiMessageElement, rawText || 'No response received.');
    }

  } catch (error) {
    updateMessageInUI(aiMessageElement, 'Sorry, an error occurred: ' + error.message);
  }
}

function appendMessageToUI(sender, text) {
  if (!aiChatMessages) return;
  const msgDiv = document.createElement('div');
  msgDiv.style.cssText = `padding: 8px 12px; border-radius: 8px; max-width: 85%; line-height: 1.4; word-break: break-word; white-space: pre-wrap; ${sender === 'user' ? 'background: #e50914; color: #fff; align-self: flex-end;' : 'background: #222; color: #ddd; align-self: flex-start;'}`;
  
  if (sender === 'user') {
    msgDiv.textContent = text;
  } else {
    msgDiv.innerHTML = parseMarkdown(text);
  }

  aiChatMessages.appendChild(msgDiv);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  return msgDiv;
}

function updateMessageInUI(msgDiv, text) {
  if (!msgDiv) return;
  msgDiv.innerHTML = parseMarkdown(text);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

loadHeroAndTop10();
loadContent(true);
renderSearchHistory();
