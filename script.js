const API_KEY = '5959ee7103e0456dc8c681afb1462d4a'; 
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';

const movieGrid = document.getElementById('movieGrid');
const top10Carousel = document.getElementById('top10Carousel');
const carouselSection = document.getElementById('carouselSection');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sectionTitle = document.getElementById('sectionTitle');
const modal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const btnMovies = document.getElementById('btnMovies');
const btnTV = document.getElementById('btnTV');
const genreSelect = document.getElementById('genreSelect');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const watchlistNavBtn = document.getElementById('watchlistNavBtn');

let currentType = 'movie';
let currentPage = 1;
let currentFetchUrl = '';
let isLoadingMore = false;
let isSearchMode = false;
let currentQuery = '';

// Theme Persistence
const savedTheme = localStorage.getItem('kiosh_theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('kiosh_theme', isLight ? 'light' : 'dark');
});

// Fetch Media for Grid
async function getMedia(url, type, append = false) {
  try {
    isLoadingMore = true;
    const res = await fetch(url);
    const data = await res.json();
    
    if(data.results && data.results.length > 0) {
      showMedia(data.results, type, append);
    } else if (!append) {
      movieGrid.innerHTML = '<p style="color:#aaa;">No results found.</p>';
    }
  } catch (error) {
    if (!append) {
      movieGrid.innerHTML = '<p style="color:#e50914;">Error loading data.</p>';
    }
  } finally {
    isLoadingMore = false;
  }
}

function showMedia(items, type, append = false) {
  if (!append) {
    movieGrid.innerHTML = '';
  }
  
  items.forEach(item => {
    const title = item.title || item.name;
    const { poster_path, vote_average, id } = item;
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

// Load Top 10 Carousel
async function loadTop10() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}`);
    const data = await res.json();
    if(data.results) {
      top10Carousel.innerHTML = '';
      data.results.slice(0, 10).forEach((item, index) => {
        const title = item.title || item.name;
        const { poster_path, media_type } = item;
        if(!poster_path) return;

        const card = document.createElement('div');
        card.classList.add('carousel-card');
        card.innerHTML = `
          <span>#${index + 1}</span>
          <img src="${IMG_PATH + poster_path}" alt="${title}">
        `;
        card.addEventListener('click', () => openModal(item, media_type === 'tv' ? 'tv' : 'movie'));
        top10Carousel.appendChild(card);
      });
    }
  } catch (err) {
    console.error("Carousel error", err);
  }
}

function loadContent(resetPage = true) {
  isSearchMode = false;
  carouselSection.style.display = 'block';
  const genreId = genreSelect ? genreSelect.value : '';
  
  if (resetPage) {
    currentPage = 1;
  }

  if (genreId) {
    const selectedText = genreSelect.options[genreSelect.selectedIndex].text;
    sectionTitle.textContent = `${selectedText} (${currentType === 'movie' ? 'Movies' : 'TV Shows'})`;
    currentFetchUrl = `https://api.themoviedb.org/3/discover/${currentType}?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=`;
  } else {
    sectionTitle.textContent = `Trending ${currentType === 'movie' ? 'Movies' : 'TV Series'}`;
    currentFetchUrl = `https://api.themoviedb.org/3/trending/${currentType}/week?api_key=${API_KEY}&page=`;
  }

  getMedia(currentFetchUrl + currentPage, currentType, false);
}

// Watchlist & Continue Watching System
function getWatchlist() {
  return JSON.parse(localStorage.getItem('kiosh_watchlist')) || [];
}

function toggleWatchlist(item) {
  let watchlist = getWatchlist();
  const index = watchlist.findIndex(i => i.id === item.id);
  if(index > -1) {
    watchlist.splice(index, 1);
  } else {
    watchlist.push(item);
  }
  localStorage.setItem('kiosh_watchlist', JSON.stringify(watchlist));
}

function saveContinueWatching(item, type) {
  let history = JSON.parse(localStorage.getItem('kiosh_continue')) || [];
  history = history.filter(i => i.id !== item.id);
  history.unshift({ ...item, media_type: type });
  if (history.length > 10) history.pop();
  localStorage.setItem('kiosh_continue', JSON.stringify(history));
}

watchlistNavBtn.addEventListener('click', () => {
  isSearchMode = true; 
  carouselSection.style.display = 'none';
  sectionTitle.textContent = 'My Watchlist & History';
  const watchlist = getWatchlist();
  const history = JSON.parse(localStorage.getItem('kiosh_continue')) || [];
  const combined = [...watchlist, ...history];
  
  if(combined.length > 0) {
    showMedia(combined, currentType, false);
  } else {
    movieGrid.innerHTML = '<p style="color:#aaa; padding:20px;">Your Watchlist is empty.</p>';
  }
});

// Category Switcher
if (btnMovies && btnTV) {
  btnMovies.addEventListener('click', () => {
    currentType = 'movie';
    btnMovies.classList.add('active');
    btnTV.classList.remove('active');
    loadContent(true);
  });

  btnTV.addEventListener('click', () => {
    currentType = 'tv';
    btnTV.classList.add('active');
    btnMovies.classList.remove('active');
    loadContent(true);
  });
}

if (genreSelect) {
  genreSelect.addEventListener('change', () => loadContent(true));
}

// Search Feature
if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if(query) {
      isSearchMode = true;
      carouselSection.style.display = 'none';
      sectionTitle.textContent = `Search Results: ${query}`;
      currentQuery = query;
      currentPage = 1;
      currentFetchUrl = `https://api.themoviedb.org/3/search/${currentType}?api_key=${API_KEY}&query=${query}&page=`;
      getMedia(currentFetchUrl + currentPage, currentType, false);
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });
}

// Infinite Scroll Listener
window.addEventListener('scroll', () => {
  if (isSearchMode && watchlistNavBtn === document.activeElement) return;
  
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoadingMore) {
    currentPage++;
    if (currentFetchUrl) {
      getMedia(currentFetchUrl + currentPage, currentType, true);
    }
  }
});

// Redesigned Modern Modal UI
async function openModal(item, type) {
  const title = item.title || item.name;
  const overview = item.overview;
  const id = item.id;
  
  saveContinueWatching(item, type);
  
  let season = 1;
  let episode = 1;

  function getLinks(s, e) {
    if (type === 'tv') {
      return {
        s1: `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
        s2: `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
        s3: `https://vidlink.pro/tv/${id}/${s}/${e}`,
        s4: `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`
      };
    } else {
      return {
        s1: `https://vidsrc.me/embed/movie?tmdb=${id}`,
        s2: `https://vidsrc.cc/v2/embed/movie/${id}`,
        s3: `https://vidlink.pro/movie/${id}`,
        s4: `https://vidsrc.pro/embed/movie/${id}`
      };
    }
  }

  let links = getLinks(season, episode);
  const watchlist = getWatchlist();
  const isInWatchlist = watchlist.some(i => i.id === id);

  modalBody.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h3 style="margin:0; font-size:18px; font-weight:700; color:var(--text-color);">${title}</h3>
    </div>
    
    <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">
      <button id="modalWatchlistBtn" style="padding:7px 12px; font-size:12px; font-weight:600; border-radius:6px; border:none; cursor:pointer; background:${isInWatchlist ? '#e50914' : '#262626'}; color:#fff; transition:0.2s;">
        ${isInWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
      </button>
      <button id="trailerBtn" style="padding:7px 12px; font-size:12px; font-weight:600; border-radius:6px; border:none; cursor:pointer; background:#262626; color:#fff;">▶ Trailer</button>
      <button id="shareBtn" style="padding:7px 12px; font-size:12px; font-weight:600; border-radius:6px; border:none; cursor:pointer; background:#262626; color:#fff;">🔗 Share</button>
    </div>

    ${type === 'tv' ? `
      <div class="episode-selector" style="display:flex; gap:10px; margin-bottom:12px; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px;">
        <div class="select-group" style="flex:1;">
          <label style="font-size:11px; color:#888; display:block; margin-bottom:2px;">Season</label>
          <select id="seasonSelect" style="width:100%; background:#1a1a1a; color:#fff; border:1px solid #333; padding:6px; border-radius:4px;">
            ${Array.from({length: 15}, (_, i) => `<option value="${i+1}" ${i+1 === season ? 'selected' : ''}>Season ${i+1}</option>`).join('')}
          </select>
        </div>
        <div class="select-group" style="flex:1;">
          <label style="font-size:11px; color:#888; display:block; margin-bottom:2px;">Episode</label>
          <select id="episodeSelect" style="width:100%; background:#1a1a1a; color:#fff; border:1px solid #333; padding:6px; border-radius:4px;">
            ${Array.from({length: 35}, (_, i) => `<option value="${i+1}" ${i+1 === episode ? 'selected' : ''}>Episode ${i+1}</option>`).join('')}
          </select>
        </div>
      </div>
    ` : ''}

    <div style="display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap;" id="serverButtons">
      <button onclick="changeServer('${links.s1}', this)" class="server-btn" style="padding:6px 14px; font-size:12px; background:#e50914; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Server 1</button>
      <button onclick="changeServer('${links.s2}', this)" class="server-btn" style="padding:6px 14px; font-size:12px; background:#222; color:#ccc; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Server 2</button>
      <button onclick="changeServer('${links.s3}', this)" class="server-btn" style="padding:6px 14px; font-size:12px; background:#222; color:#ccc; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Server 3</button>
      <button onclick="changeServer('${links.s4}', this)" class="server-btn" style="padding:6px 14px; font-size:12px; background:#222; color:#ccc; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Server 4</button>
    </div>

    <div style="border-radius:8px; overflow:hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.5); margin-bottom:12px;">
      <iframe id="playerIframe" src="${links.s1}" width="100%" height="260" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" style="display:block; background:#000;"></iframe>
    </div>

    <p style="margin-top:0; margin-bottom:10px; color:#bbb; font-size:12px; line-height:1.4; max-height:60px; overflow-y:auto;">${overview || 'No overview available.'}</p>

    <div id="castSection" style="margin-bottom:12px; font-size:12px; color:#888; background:rgba(255,255,255,0.02); padding:8px; border-radius:6px;">
      <strong style="color:#fff;">Cast:</strong> <span id="castList">Loading...</span>
    </div>

    <div class="review-section" style="border-top:1px solid rgba(255,255,255,0.08); padding-top:10px;">
      <h4 style="font-size:13px; margin-bottom:6px; color:#fff;">User Reviews & Ratings</h4>
      <div class="review-input-group" style="display:flex; gap:6px; margin-bottom:8px;">
        <input type="text" id="reviewInput" placeholder="Write a review..." style="flex:1; background:#1a1a1a; border:1px solid #333; padding:6px 10px; border-radius:4px; color:#fff; font-size:12px;">
        <button id="submitReviewBtn" style="background:#e50914; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:600; cursor:pointer; font-size:12px;">Post</button>
      </div>
      <div id="reviewsList" class="reviews-list" style="max-height:80px; overflow-y:auto;"></div>
    </div>
  `;

  modal.style.display = 'flex';

  // Fetch Cast & Crew
  try {
    const castRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}`);
    const castData = await castRes.json();
    if(castData.cast) {
      const topCast = castData.cast.slice(0, 4).map(c => c.name).join(', ');
      document.getElementById('castList').textContent = topCast || 'N/A';
    }
  } catch (e) {
    document.getElementById('castList').textContent = 'Unavailable';
  }

  // Trailer functionality
  document.getElementById('trailerBtn').addEventListener('click', async () => {
    try {
      const vidRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`);
      const vidData = await vidRes.json();
      const trailer = vidData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) {
        document.getElementById('playerIframe').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
      } else {
        alert('Trailer not available.');
      }
    } catch(err) {
      alert('Could not load trailer.');
    }
  });

  // Share functionality
  document.getElementById('shareBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!');
    });
  });

  document.getElementById('modalWatchlistBtn').addEventListener('click', (e) => {
    toggleWatchlist(item);
    const updatedList = getWatchlist();
    const isNowIn = updatedList.some(i => i.id === id);
    e.target.textContent = isNowIn ? '✓ In Watchlist' : '+ Watchlist';
    e.target.style.background = isNowIn ? '#e50914' : '#262626';
  });

  const reviewsKey = `kiosh_reviews_${id}`;
  const loadReviews = () => {
    const reviews = JSON.parse(localStorage.getItem(reviewsKey)) || [];
    const listEl = document.getElementById('reviewsList');
    if(reviews.length === 0) {
      listEl.innerHTML = '<span style="color:#666; font-size:11px;">No reviews yet.</span>';
    } else {
      listEl.innerHTML = reviews.map(r => `<div style="font-size:11px; color:#ccc; margin-bottom:4px;">• ${r}</div>`).join('');
    }
  };
  loadReviews();

  document.getElementById('submitReviewBtn').addEventListener('click', () => {
    const val = document.getElementById('reviewInput').value.trim();
    if(val) {
      const reviews = JSON.parse(localStorage.getItem(reviewsKey)) || [];
      reviews.push(val);
      localStorage.setItem(reviewsKey, JSON.stringify(reviews));
      document.getElementById('reviewInput').value = '';
      loadReviews();
    }
  });

  if (type === 'tv') {
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');

    const updatePlayerSource = () => {
      season = seasonSelect.value;
      episode = episodeSelect.value;
      let newLinks = getLinks(season, episode);
      
      document.getElementById('playerIframe').src = newLinks.s1;
      
      const buttons = document.querySelectorAll('#serverButtons button');
      buttons[0].setAttribute('onclick', `changeServer('${newLinks.s1}', this)`);
      buttons[1].setAttribute('onclick', `changeServer('${newLinks.s2}', this)`);
      buttons[2].setAttribute('onclick', `changeServer('${newLinks.s3}', this)`);
      buttons[3].setAttribute('onclick', `changeServer('${newLinks.s4}', this)`);

      buttons.forEach((b, idx) => {
        if(idx === 0) {
          b.style.background = '#e50914';
          b.style.color = '#fff';
        } else {
          b.style.background = '#222';
          b.style.color = '#ccc';
        }
      });
    };

    seasonSelect.addEventListener('change', updatePlayerSource);
    episodeSelect.addEventListener('change', updatePlayerSource);
  }
}

window.changeServer = function(url, btn) {
  document.getElementById('playerIframe').src = url;
  const buttons = document.querySelectorAll('#serverButtons button');
  buttons.forEach(b => {
    b.style.background = '#222';
    b.style.color = '#ccc';
  });
  btn.style.background = '#e50914';
  btn.style.color = '#fff';
};

if (closeModal) {
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    modalBody.innerHTML = '';
  });
}

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    modalBody.innerHTML = '';
  }
});

loadTop10();
loadContent(true);

