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

// Dark / Light Mode Toggle
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
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

// Watchlist System using localStorage
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

watchlistNavBtn.addEventListener('click', () => {
  isSearchMode = true; // disable infinite scroll for watchlist
  carouselSection.style.display = 'none';
  sectionTitle.textContent = 'My Watchlist';
  const watchlist = getWatchlist();
  if(watchlist.length > 0) {
    showMedia(watchlist, currentType, false);
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
  if (isSearchMode && watchlistNavBtn === document.activeElement) return; // skip if custom views
  
  const { scrollTop, scrollHeight,clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoadingMore) {
    currentPage++;
    if (currentFetchUrl) {
      getMedia(currentFetchUrl + currentPage, currentType, true);
    }
  }
});

// Modal Player with Alternative Servers & Fallbacks
function openModal(item, type) {
  const title = item.title || item.name;
  const overview = item.overview;
  const id = item.id;
  
  let season = 1;
  let episode = 1;

  function getLinks(s, e) {
    if (type === 'tv') {
      return {
        s1: `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
        s2: `https://vidlink.pro/tv/${id}/${s}/${e}`,
        s3: `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`,
        s4: `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
      };
    } else {
      return {
        s1: `https://vidsrc.cc/v2/embed/movie/${id}`,
        s2: `https://vidlink.pro/movie/${id}`,
        s3: `https://vidsrc.pro/embed/movie/${id}`,
        s4: `https://www.2embed.cc/embed/${id}`
      };
    }
  }

  let links = getLinks(season, episode);
  const watchlist = getWatchlist();
  const isInWatchlist = watchlist.some(i => i.id === id);

  modalBody.innerHTML = `
    <h3 style="margin-bottom:4px; font-size:16px; color:var(--text-color);">${title}</h3>
    
    <div class="modal-actions">
      <button id="modalWatchlistBtn" class="watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}">
        ${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      </button>
    </div>

    ${type === 'tv' ? `
      <div class="episode-selector">
        <div class="select-group">
          <label style="font-size:11px; color:#aaa;">Season:</label>
          <select id="seasonSelect">
            ${Array.from({length: 15}, (_, i) => `<option value="${i+1}" ${i+1 === season ? 'selected' : ''}>Season ${i+1}</option>`).join('')}
          </select>
        </div>
        <div class="select-group">
          <label style="font-size:11px; color:#aaa;">Episode:</label>
          <select id="episodeSelect">
            ${Array.from({length: 35}, (_, i) => `<option value="${i+1}" ${i+1 === episode ? 'selected' : ''}>Episode ${i+1}</option>`).join('')}
          </select>
        </div>
      </div>
    ` : ''}

    <div style="display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;" id="serverButtons">
      <button onclick="changeServer('${links.s1}', this)" class="server-btn" style="padding:6px 12px; font-size:12px; background:#e50914; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Server 1</button>
      <button onclick="changeServer('${links.s2}', this)" class="server-btn" style="padding:6px 12px; font-size:12px; background:var(--btn-bg); color:var(--text-color); border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Server 2</button>
      <button onclick="changeServer('${links.s3}', this)" class="server-btn" style="padding:6px 12px; font-size:12px; background:var(--btn-bg); color:var(--text-color); border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Server 3</button>
      <button onclick="changeServer('${links.s4}', this)" class="server-btn" style="padding:6px 12px; font-size:12px; background:var(--btn-bg); color:var(--text-color); border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Server 4</button>
    </div>

    <iframe id="playerIframe" src="${links.s1}" width="100%" height="250" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" style="border-radius:6px; background:#000;"></iframe>
    <p style="margin-top:8px; color:#ccc; font-size:12px; max-height:60px; overflow-y:auto;">${overview || 'No overview available.'}</p>

    <div class="review-section">
      <h4>User Reviews & Ratings</h4>
      <div class="review-input-group">
        <input type="text" id="reviewInput" placeholder="Leave a comment or rating...">
        <button id="submitReviewBtn">Post</button>
      </div>
      <div id="reviewsList" class="reviews-list"></div>
    </div>
  `;

  modal.style.display = 'flex';

  document.getElementById('modalWatchlistBtn').addEventListener('click', (e) => {
    toggleWatchlist(item);
    const updatedList = getWatchlist();
    const isNowIn = updatedList.some(i => i.id === id);
    e.target.textContent = isNowIn ? 'Remove from Watchlist' : 'Add to Watchlist';
    e.target.classList.toggle('in-watchlist', isNowIn);
  });

  const reviewsKey = `kiosh_reviews_${id}`;
  const loadReviews = () => {
    const reviews = JSON.parse(localStorage.getItem(reviewsKey)) || [];
    const listEl = document.getElementById('reviewsList');
    if(reviews.length === 0) {
      listEl.innerHTML = '<span style="color:#777;">No reviews yet. Be the first to leave one!</span>';
    } else {
      listEl.innerHTML = reviews.map(r => `<div>• ${r}</div>`).join('');
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
          b.style.background = 'var(--btn-bg)';
          b.style.color = 'var(--text-color)';
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
    b.style.background = 'var(--btn-bg)';
    b.style.color = 'var(--text-color)';
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
