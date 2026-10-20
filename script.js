const API_KEY = '5959ee7103e0456dc8c681afb1462d4a'; 
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

const CURRENT_APP_VERSION = "2.0.3"; 

const movieGrid = document.getElementById('movieGrid');
const top10Carousl = document.getElementById('top10Carousel');
const continueCarousel = document.getElementById('continueCarousel');
const continueSection = document.getElementById('continueSection');
const carouselSection = document.getElementById('carouselSection');
const heroBanner = document.getElementById('heroBanner');
const heroTitle = document.getElementById('heroTitle');
const heroPlayBtn = document.getElementById('heroPlayBtn');
const heroBadge = document.getElementById('heroBadge');
const searchInput = document.getElementById('searchInput');
const sectionTitle = document.getElementById('sectionTitle');
const modal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const themeToggleBtn = document.getElementById('themeToggleBtn');

const mainHeader = document.getElementById('mainHeader');
const searchViewSection = document.getElementById('searchViewSection');
const searchListContainer = document.getElementById('searchListContainer');
const bottomNav = document.getElementById('bottomNav');

const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');

// Filter state variables
let selectedGenre = '';
let selectedLanguage = '';
let selectedSort = 'popularity.desc';
let selectedYear = '';

// Setup Year Input Type & Search functionality
const yearInput = document.getElementById('yearInput');
const yearDropdown = document.getElementById('yearDropdown');
const yearOptionsContainer = document.getElementById('yearOptionsContainer');

for (let y = 2026; y >= 2000; y--) {
  const opt = document.createElement('div');
  opt.className = 'custom-option';
  opt.setAttribute('data-value', y);
  opt.textContent = y;
  opt.addEventListener('click', () => {
    yearInput.value = y;
    selectedYear = y.toString();
    yearDropdown.classList.remove('open');
    loadContent(true);
    closeSidebarMenu();
  });
  yearOptionsContainer.appendChild(opt);
}

yearInput.addEventListener('focus', () => {
  yearDropdown.classList.add('open');
});

yearInput.addEventListener('click', (e) => {
  e.stopPropagation();
  yearDropdown.classList.add('open');
});

yearInput.addEventListener('input', (e) => {
  const val = e.target.value.trim();
  selectedYear = val;
  
  const options = yearOptionsContainer.querySelectorAll('.custom-option');
  options.forEach(opt => {
    const text = opt.textContent;
    if (text.includes(val) || val === '') {
      opt.style.display = 'block';
    } else {
      opt.style.display = 'none';
    }
  });

  loadContent(true);
});

yearOptionsContainer.querySelector('.custom-option[data-value=""]').addEventListener('click', () => {
  yearInput.value = '';
  selectedYear = '';
  yearDropdown.classList.remove('open');
  loadContent(true);
  closeSidebarMenu();
});

let currentType = 'movie';
let currentPage = 1;
let currentFetchUrl = '';
let isLoadingMore = false;
let featuredItem = null;

let currentActiveTab = 'home';

let searchPage = 1;
let currentSearchKeyword = '';
let isSearchLoading = false;
let hasMoreSearchResults = true;

const globalStyle = document.createElement('style');
globalStyle.innerHTML = `
  * {
    -webkit-tap-highlight-color: transparent !important;
    -webkit-touch-callout: none !important;
  }
  body, img, button, div, span, h1, h2, h3, p {
    user-select: none !important;
    -webkit-user-select: none !important;
  }
  input {
    user-select: text !important;
    -webkit-user-select: text !important;
  }

  /* Premium Custom Dropdown Styles */
  .custom-select-wrapper {
    position: relative;
    user-select: none;
    margin-top: 6px;
  }
  .custom-select-trigger {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 8px;
    padding: 10px 14px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: border-color 0.2s;
  }
  .custom-select-trigger:hover {
    border-color: #e50914;
  }
  .custom-select-trigger::after {
    content: '▼';
    font-size: 9px;
    color: #a1a1aa;
    transition: transform 0.2s;
  }
  .custom-select-wrapper.open .custom-select-trigger::after {
    transform: rotate(180deg);
  }
  .custom-options {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.85);
    z-index: 1000;
    max-height: 220px;
    overflow-y: auto;
    display: none;
  }
  .custom-select-wrapper.open .custom-options {
    display: block;
  }
  .custom-option {
    padding: 10px 14px;
    font-size: 13px;
    color: #d4d4d8;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .custom-option:hover {
    background: rgba(229, 9, 20, 0.15);
    color: #fff;
  }
  .custom-option.selected {
    color: #e50914;
    font-weight: 600;
    background: rgba(229, 9, 20, 0.08);
  }

  .kiosh-toast {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(20, 20, 20, 0.9);
    color: #fff;
    padding: 10px 18px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    z-index: 99999;
    box-shadow: 0 4px 16px rgba(0,0,0,0.6);
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
    pointer-events: none;
  }

  .kiosh-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(-5px);
  }
`;
document.head.appendChild(globalStyle);

function setupDropdown(wrapperId, triggerId, containerId, type) {
  const wrapper = document.getElementById(wrapperId);
  const trigger = document.getElementById(triggerId);
  const container = document.getElementById(containerId);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.custom-select-wrapper').forEach(w => {
      if (w !== wrapper) w.classList.remove('open');
    });
    wrapper.classList.toggle('open');
  });

  container.querySelectorAll('.custom-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const val = opt.getAttribute('data-value');
      const text = opt.textContent;
      selectOption(type, val, text);
      wrapper.classList.remove('open');
    });
  });
}

function selectOption(type, value, text) {
  if (type === 'genre') {
    selectedGenre = value;
    document.querySelector('#genreTrigger span').textContent = text;
    updateOptionsActiveState('genreOptionsContainer', value);
  } else if (type === 'language') {
    selectedLanguage = value;
    document.querySelector('#languageTrigger span').textContent = text;
    updateOptionsActiveState('languageOptionsContainer', value);
  } else if (type === 'sort') {
    selectedSort = value;
    document.querySelector('#sortTrigger span').textContent = text;
    updateOptionsActiveState('sortOptionsContainer', value);
  }
  loadContent(true);
  closeSidebarMenu();
}

function updateOptionsActiveState(containerId, value) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.custom-option').forEach(opt => {
    if (opt.getAttribute('data-value') === value) {
      opt.classList.add('selected');
    } else {
      opt.classList.remove('selected');
    }
  });
}

window.addEventListener('click', () => {
  document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
});

setupDropdown('genreDropdown', 'genreTrigger', 'genreOptionsContainer', 'genre');
setupDropdown('languageDropdown', 'languageTrigger', 'languageOptionsContainer', 'language');
setupDropdown('sortDropdown', 'sortTrigger', 'sortOptionsContainer', 'sort');

function showToast(message) {
  let toast = document.querySelector('.kiosh-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'kiosh-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

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
  if (bottomNav) bottomNav.style.display = 'none';
});

const closeSidebarMenu = () => {
  sidebar.classList.remove('open');
  sidebarOverlay.style.display = 'none';
  if (bottomNav) bottomNav.style.display = 'flex';
};

closeSidebar.addEventListener('click', closeSidebarMenu);
sidebarOverlay.addEventListener('click', closeSidebarMenu);

const donateBtn = document.getElementById('donateBtn');
const donateModal = document.getElementById('donateModal');
const closeDonateModal = document.getElementById('closeDonateModal');

if (donateBtn && donateModal) {
  donateBtn.addEventListener('click', () => {
    donateModal.style.display = 'flex';
    closeSidebarMenu();
  });

  if (closeDonateModal) {
    closeDonateModal.addEventListener('click', () => {
      donateModal.style.display = 'none';
    });
  }

  donateModal.addEventListener('click', (e) => {
    if (e.target === donateModal) {
      donateModal.style.display = 'none';
    }
  });
}

    document.body.appendChild(updateBanner);

    document.getElementById('updateLaterBtn').addEventListener('click', () => {
        sessionStorage.setItem('update_dismissed', 'true');
        updateBanner.remove();
    });

    document.getElementById('updateNowBtn').addEventListener('click', (e) => {
        e.preventDefault();
        window.open(url, '_system');
        updateBanner.remove();
    });
}

const bottomNavBtns = document.querySelectorAll('#bottomNav .nav-item');
const clipsContainer = document.getElementById('clipsContainer');
const exploreSection = document.getElementById('exploreSection');

bottomNavBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    bottomNavBtns.forEach(b => {
      b.style.color = '#a1a1aa';
      b.style.background = 'transparent';
      b.classList.remove('active');
    });

    btn.style.color = '#fff';
    btn.style.background = 'rgba(255, 255, 255, 0.12)';
    btn.classList.add('active');

    const tab = btn.getAttribute('data-tab');
    handleTabSwitch(tab);
  });
});

function handleTabSwitch(tab) {
  currentActiveTab = tab;
  clipsContainer.style.display = 'none';
  searchViewSection.style.display = 'none';
  carouselSection.style.display = 'none';
  continueSection.style.display = 'none';
  heroBanner.style.display = 'none';
  exploreSection.style.display = 'none';
  mainHeader.style.display = 'flex';

  movieGrid.innerHTML = '';

  if (tab === 'home') {
    clipsContainer.innerHTML = '';
    carouselSection.style.display = 'block';
    continueSection.style.display = 'block';
    exploreSection.style.display = 'block';
    if (featuredItem && featuredItem.backdrop_path) heroBanner.style.display = 'flex';
    loadContent(true);
  } 
  else if (tab === 'clips') {
    clipsContainer.style.display = 'block';
    if (!clipsContainer.hasChildNodes()) {
      loadClipsFeed();
    }
  } 
  else if (tab === 'search') {
    clipsContainer.innerHTML = '';
    searchViewSection.style.display = 'block';
    mainHeader.style.display = 'none';
    searchPage = 1;
    currentSearchKeyword = '';
    loadDefaultSearchList(true);
  } 
  else if (tab === 'watchlist') {
    clipsContainer.innerHTML = '';
    exploreSection.style.display = 'block';
    sectionTitle.textContent = 'My Watchlist';
    
    const watchlistItems = getWatchlist();
    if(watchlistItems.length > 0) {
      showMedia(watchlistItems, currentType, false);
    } else {
      movieGrid.innerHTML = '<p style="color:#aaa; padding:20px;">Your Watchlist is empty.</p>';
    }
  }
}

async function loadClipsFeed() {
  clipsContainer.innerHTML = '<div style="color:#fff; text-align:center; padding-top:50vh; font-size:14px;">Loading Clips...</div>';
  try {
    const page = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=${page}`);
    const data = await res.json();
    clipsContainer.innerHTML = '';

    let results = data.results.sort(() => Math.random() - 0.5);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const iframe = entry.target.querySelector('iframe');
        if (iframe) {
          const src = iframe.getAttribute('data-src');
          if (entry.isIntersecting) {
            iframe.src = src; 
          } else {
            iframe.src = ''; 
          }
        }
      });
    }, { threshold: 0.6 });

    let validClipsCount = 0;

    for (let item of results) {
      if (validClipsCount >= 12) break;

      const vidRes = await fetch(`https://api.themoviedb.org/3/movie/${item.id}/videos?api_key=${API_KEY}`);
      const vidData = await vidRes.json();
      
      const trailer = vidData.results ? vidData.results.find(v => 
        (v.type === 'Trailer' || v.type === 'Teaser') && 
        v.site === 'YouTube'
      ) : null;

      if (trailer && trailer.key) {
        validClipsCount++;
        const clipCard = document.createElement('div');
        clipCard.className = 'clip-item';
        clipCard.style.cssText = 'width: 100vw; height: 100vh; scroll-snap-align: start; position: relative; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center;';
        
        const yearRelease = item.release_date ? item.release_date.split('-')[0] : '';
        const embedUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0&controls=1&loop=1&playlist=${trailer.key}&enablejsapi=1&playsinline=1&rel=0`;

        const isAlreadySaved = getWatchlist().some(i => i.id === item.id);

        clipCard.innerHTML = `
          <iframe data-src="${embedUrl}" style="position: absolute; width: 100%; height: 100%; border: none;" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          
          <div style="position: absolute; bottom: 95px; left: 16px; right: 75px; z-index: 10; color: #fff; pointer-events: none;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
              <h2 style="font-size: 18px; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.8); margin: 0; display: inline;">${item.title || item.name}</h2>
              ${yearRelease ? `<span style="color: #bbb; font-size: 13px; font-weight: 600; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">${yearRelease}</span>` : ''}
            </div>
            <p style="font-size: 11px; color: #ddd; line-height: 1.3; max-height: 35px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; text-shadow: 0 1px 4px rgba(0,0,0,0.8); margin: 0;">${item.overview || ''}</p>
          </div>

          <div style="position: absolute; bottom: 95px; right: 16px; z-index: 10; display: flex; flex-direction: column; gap: 16px; align-items: center;">

            <button class="clip-play-btn" title="Watch Full" style="background: rgba(229, 9, 20, 0.95); color: #fff; border: none; border-radius: 50%; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>

            <button class="clip-watchlist-btn" title="Add Watchlist" style="background: rgba(20,20,20,0.75); color: #fff; border: 1px solid ${isAlreadySaved ? '#e50914' : 'rgba(255,255,255,0.2)'}; border-radius: 50%; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(6px);">
              <svg class="watchlist-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${isAlreadySaved ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M12 5v14M5 12h14"/>'}
              </svg>
            </button>

          </div>
        `;

        clipCard.querySelector('.clip-play-btn').onclick = () => {
          openModal(item, 'movie');
        };

        const watchlistBtn = clipCard.querySelector('.clip-watchlist-btn');
        const watchlistIcon = clipCard.querySelector('.watchlist-icon');

        watchlistBtn.onclick = () => {
          toggleWatchlist(item);
          const inList = getWatchlist().some(i => i.id === item.id);
          if (inList) {
            watchlistIcon.innerHTML = '<path d="M20 6L9 17l-5-5"/>';
            watchlistBtn.style.borderColor = '#e50914';
            showToast('Saved to Watchlist!');
          } else {
            watchlistIcon.innerHTML = '<path d="M12 5v14M5 12h14"/>';
            watchlistBtn.style.borderColor = 'rgba(255,255,255,0.2)';
            showToast('Removed from Watchlist');
          }
        };

        clipsContainer.appendChild(clipCard);
        observer.observe(clipCard);
      }
    }
  } catch (e) {
    clipsContainer.innerHTML = '<div style="color:#fff; text-align:center; padding-top:50vh;">Failed to load clips.</div>';
  }
}

async function loadDefaultSearchList(reset = false) {
  if (isSearchLoading || !hasMoreSearchResults) return;
  isSearchLoading = true;

  if (reset) {
    searchPage = 1;
    searchListContainer.innerHTML = '';
    hasMoreSearchResults = true;
  }

  try {
    const fetchPage = reset ? (Math.floor(Math.random() * 5) + 1) : searchPage;
    const res = await fetch(`https://api.themoviedb.org/3/discover/${currentType}?api_key=${API_KEY}&sort_by=popularity.desc&page=${fetchPage}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      let randomizedResults = data.results.sort(() => Math.random() - 0.5);
      renderSearchList(randomizedResults, !reset);
      if (searchPage >= data.total_pages) hasMoreSearchResults = false;
    } else {
      hasMoreSearchResults = false;
    }
  } catch (e) {} finally {
    isSearchLoading = false;
  }
}

async function searchMoviesAndTV(keyword, reset = false) {
  if (isSearchLoading) return;
  isSearchLoading = true;

  if (reset) {
    searchPage = 1;
    searchListContainer.innerHTML = '';
    hasMoreSearchResults = true;
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/${currentType}?api_key=${API_KEY}&query=${encodeURIComponent(keyword)}&page=${searchPage}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      renderSearchList(data.results, !reset);
      if (searchPage >= data.total_pages) hasMoreSearchResults = false;
    } else {
      if (reset) searchListContainer.innerHTML = '<p style="color:#aaa; text-align:center; padding:20px;">No results found.</p>';
      hasMoreSearchResults = false;
    }
  } catch (e) {} finally {
    isSearchLoading = false;
  }
}

function renderSearchList(items, append = false) {
  if (!append) searchListContainer.innerHTML = '';
  items.forEach(item => {
    const title = item.title || item.name;
    const poster = item.poster_path ? IMG_PATH + item.poster_path : 'https://via.placeholder.com/90x130?text=No+Image';
    const mediaType = currentType;

    const rowItem = document.createElement('div');
    rowItem.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: #121212; border-radius: 8px; overflow: hidden; padding: 6px 12px; gap: 12px; cursor: pointer;';
    
    rowItem.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; flex: 1; overflow: hidden;">
        <img src="${poster}" alt="${title}" style="width: 90px; height: 55px; object-fit: cover; border-radius: 6px;">
        <span style="color: #fff; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</span>
      </div>
      <button class="row-play-btn" style="background: transparent; border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg>
      </button>
    `;

    rowItem.onclick = () => openModal(item, mediaType);
    searchListContainer.appendChild(rowItem);
  });
}

let searchDebounceTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchDebounceTimeout);
  const keyword = e.target.value.trim();
  currentSearchKeyword = keyword;

  searchDebounceTimeout = setTimeout(() => {
    if (keyword.length === 0) {
      loadDefaultSearchList(true);
    } else {
      searchMoviesAndTV(keyword, true);
    }
  }, 400);
});

window.addEventListener('scroll', () => {
  if (searchViewSection.style.display !== 'none') {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 300 && !isSearchLoading && hasMoreSearchResults) {
      searchPage++;
      if (currentSearchKeyword.length > 0) {
        searchMoviesAndTV(currentSearchKeyword, false);
      } else {
        loadDefaultSearchList(false);
      }
    }
  }
});

const voiceSearchBtn = document.getElementById('voiceSearchBtn');
if (voiceSearchBtn) {
  voiceSearchBtn.addEventListener('click', async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        voiceSearchBtn.style.color = '#e50914';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          searchInput.value = transcript;
          searchInput.dispatchEvent(new Event('input'));
          voiceSearchBtn.style.color = '#a1a1aa';
        };

        recognition.onerror = () => {
          voiceSearchBtn.style.color = '#a1a1aa';
          searchInput.focus();
        };

        recognition.onend = () => {
          voiceSearchBtn.style.color = '#a1a1aa';
        };

        recognition.start();
      } catch (e) {
        voiceSearchBtn.style.color = '#a1a1aa';
        searchInput.focus();
      }
    } else {
      voiceSearchBtn.style.color = '#e50914';
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          voiceSearchBtn.style.color = '#a1a1aa';
          stream.getTracks().forEach(track => track.stop());
          searchInput.focus();
        } catch (err) {
          voiceSearchBtn.style.color = '#a1a1aa';
          searchInput.focus();
        }
      } else {
        voiceSearchBtn.style.color = '#a1a1aa';
        searchInput.focus();
      }
    }
  });
}

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
    const { poster_path, vote_average, release_date, first_air_date } = item;
    if(!poster_path) return;

    const yearRelease = release_date ? release_date.split('-')[0] : (first_air_date ? first_air_date.split('-')[0] : '');

    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <div style="position: relative; width: 100%; height: calc(100% - 50px);">
        <img class="card-img" src="${IMG_PATH + poster_path}" alt="${title}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div class="card-info">
        <h3>${title}</h3>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
          <span>★ ${vote_average ? vote_average.toFixed(1) : 'N/A'}</span>
          ${yearRelease ? `<span style="color: #888; font-size: 11px; font-weight: 500;">${yearRelease}</span>` : ''}
        </div>
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
        const title = featuredItem.title || featuredItem.name;
        heroTitle.textContent = title;
        
        const mediaType = featuredItem.media_type === 'tv' ? 'tv' : 'movie';
        if (heroBadge) heroBadge.textContent = mediaType === 'tv' ? 'SERIES' : 'MOVIE';
        
        heroBanner.style.backgroundImage = `url(${BACKDROP_PATH + featuredItem.backdrop_path})`;
        heroBanner.style.display = 'flex';
        heroPlayBtn.onclick = () => openModal(featuredItem, mediaType);
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
  carouselSection.style.display = 'block';
  heroBanner.style.display = featuredItem && featuredItem.backdrop_path ? 'flex' : 'none';
  loadContinueWatching();
  
  if (resetPage) currentPage = 1;
  sectionTitle.textContent = `Explore ${currentType === 'movie' ? 'Movies' : 'TV Series'}`;
  
  let yearParam = selectedYear ? (currentType === 'movie' ? `&primary_release_year=${selectedYear}` : `&first_air_date_year=${selectedYear}`) : '';
  let genreParam = selectedGenre ? `&with_genres=${selectedGenre}` : '';
  let langParam = selectedLanguage ? `&with_original_language=${selectedLanguage}` : '';
  let sortParam = selectedSort ? `&sort_by=${selectedSort}` : '&sort_by=popularity.desc';

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

function getWatchlist() { 
  let list = JSON.parse(localStorage.getItem('kiosh_watchlist')) || [];
  let uniqueList = Array.from(new Map(list.map(item => [item.id, item])).values());
  if (uniqueList.length !== list.length) {
    localStorage.setItem('kiosh_watchlist', JSON.stringify(uniqueList));
  }
  return uniqueList;
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
  
  if (currentActiveTab === 'watchlist') {
    handleTabSwitch('watchlist');
  }
}

window.addEventListener('scroll', () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoadingMore && exploreSection.style.display !== 'none') {
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
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-right: 20px;">
      <h3 style="font-size:18px; color:#fff; margin:0;">${title}</h3>
    </div>

    <div style="display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;">
      <button id="modalWatchlistBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:${isInWatchlist ? '#e50914' : '#222'}; color:#fff;">${isInWatchlist ? '✓ In Watchlist' : '+ Watchlist'}</button>
      <button id="trailerBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#222; color:#fff; display:flex; align-items:center; gap:5px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Trailer</button>
      <button id="shareBtn" style="padding:7px 12px; font-size:12px; border-radius:8px; border:none; cursor:pointer; background:#222; color:#fff;">Share</button>
    </div>
    
    ${type === 'tv' ? `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:10px; border-radius:10px; margin-bottom:12px;">
        <div style="display:flex; gap:6px; margin-bottom:8px; overflow-x:auto;" id="seasonTabsContainer">
          <span style="font-size:11px; color:#888; align-self:center;">Loading seasons...</span>
        </div>
        <div style="max-height: 110px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;" id="episodeListContainer">
          <span style="font-size:11px; color:#888;">Select a season...</span>
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
      <iframe id="playerIframe" src="${links.s1}" width="100%" height="260" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="display:block; background:#000;"></iframe>
    </div>
    
    <p style="color:#bbb; font-size:12px; line-height:1.4; margin-bottom:10px; max-height:50px; overflow-y:auto;">${overview || 'No overview available.'}</p>
  `;

  modal.style.display = 'flex';

  if (type === 'tv') {
    fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`)
      .then(res => res.json())
      .then(tvDetails => {
        const seasons = tvDetails.seasons ? tvDetails.seasons.filter(s => s.season_number > 0) : [];
        const seasonTabsContainer = document.getElementById('seasonTabsContainer');
        
        if (seasons.length > 0) {
          seasonTabsContainer.innerHTML = '';
          seasons.forEach(sObj => {
            const sNum = sObj.season_number;
            const btn = document.createElement('button');
            btn.className = `season-tab-btn ${sNum === season ? 'active' : ''}`;
            btn.textContent = sObj.name || `Season ${sNum}`;
            btn.style.cssText = `padding:5px 12px; font-size:11px; border-radius:6px; border:none; cursor:pointer; background:${sNum === season ? '#e50914' : '#222'}; color:#fff; white-space:nowrap;`;
            
            btn.onclick = () => {
              document.querySelectorAll('.season-tab-btn').forEach(b => { b.style.background = '#222'; b.classList.remove('active'); });
              btn.style.background = '#e50914';
              btn.classList.add('active');
              season = sNum;
              episode = 1;
              loadEpisodesForSeason(season);
              let nl = getLinks(season, episode);
              document.getElementById('playerIframe').src = nl.s1;
            };
            seasonTabsContainer.appendChild(btn);
          });
        }
      }).catch(e => {});

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
        } else {
          epContainer.innerHTML = '<span style="font-size:11px; color:#888;">No episodes available.</span>';
        }
      } catch (e) {}
    };

    loadEpisodesForSeason(season);
  }

  document.getElementById('trailerBtn').addEventListener('click', async () => {
    try {
      const vidRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`);
      const vidData = await vidRes.json();
      const trailer = vidData.results.find(v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube');
      if (trailer) {
        document.getElementById('playerIframe').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&enablejsapi=1&playsinline=1`;
      } else {
        showToast('Trailer not available');
      }
    } catch (e) {
      showToast('Error loading trailer');
    }
  });

  document.getElementById('shareBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied to clipboard!'));
  });

  document.getElementById('modalWatchlistBtn').addEventListener('click', (e) => {
    toggleWatchlist(item);
    const inList = getWatchlist().some(i => i.id === id);
    e.target.textContent = inList ? '✓ In Watchlist' : '+ Watchlist';
    e.target.style.background = inList ? '#e50914' : '#222';
    showToast(inList ? 'Saved to Watchlist!' : 'Removed from Watchlist');
  });
}

window.changeServer = function(url, btn) {
  document.getElementById('playerIframe').src = url;
  document.querySelectorAll('#serverButtons button').forEach(b => { b.style.background = '#222'; b.style.color = '#ccc'; });
  btn.style.background = '#e50914'; btn.style.color = '#fff';
};

const handleCloseModal = () => {
  modal.style.display = 'none';
  modalBody.innerHTML = '';
  
  if (currentActiveTab === 'clips') {
    clipsContainer.style.display = 'block';
  }
};

closeModal.addEventListener('click', handleCloseModal);
window.addEventListener('click', (e) => { 
  if (e.target === modal) { 
    handleCloseModal();
  } 
});

loadHeroAndTop10();
loadContent(true);

window.addEventListener('DOMContentLoaded', () => {
  checkForAppUpdates();
});
