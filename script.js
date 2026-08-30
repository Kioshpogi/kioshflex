const API_KEY = '5959ee7103e0456dc8c681afb1462d4a'; 

const IMG_PATH = 'https://image.tmdb.org/t/p/w500';

const movieGrid = document.getElementById('movieGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sectionTitle = document.getElementById('sectionTitle');
const modal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const btnMovies = document.getElementById('btnMovies');
const btnTV = document.getElementById('btnTV');
const genreSelect = document.getElementById('genreSelect');

let currentType = 'movie';

async function getMedia(url, type) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if(data.results && data.results.length > 0) {
      showMedia(data.results, type);
    } else {
      movieGrid.innerHTML = '<p style="color:#aaa;">Walang nahanap.</p>';
    }
  } catch (error) {
    movieGrid.innerHTML = '<p style="color:#e50914;">May problema sa pag-load ng data.</p>';
  }
}

function showMedia(items, type) {
  movieGrid.innerHTML = '';
  items.forEach(item => {
    const title = item.title || item.name;
    const { poster_path, vote_average, overview, id } = item;
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

    card.addEventListener('click', () => openModal(title, overview, id, type));
    movieGrid.appendChild(card);
  });
}

function loadContent() {
  const genreId = genreSelect ? genreSelect.value : '';
  let url = '';

  if (genreId) {
    const selectedText = genreSelect.options[genreSelect.selectedIndex].text;
    sectionTitle.textContent = `${selectedText} (${currentType === 'movie' ? 'Movies' : 'TV Shows'})`;
    url = `https://api.themoviedb.org/3/discover/${currentType}?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`;
  } else {
    sectionTitle.textContent = `Trending ${currentType === 'movie' ? 'Movies' : 'TV Series'}`;
    url = `https://api.themoviedb.org/3/trending/${currentType}/week?api_key=${API_KEY}`;
  }

  getMedia(url, currentType);
}

// Category Switcher
if (btnMovies && btnTV) {
  btnMovies.addEventListener('click', () => {
    currentType = 'movie';
    btnMovies.classList.add('active');
    btnTV.classList.remove('active');
    loadContent();
  });

  btnTV.addEventListener('click', () => {
    currentType = 'tv';
    btnTV.classList.add('active');
    btnMovies.classList.remove('active');
    loadContent();
  });
}

// Genre Dropdown Event
if (genreSelect) {
  genreSelect.addEventListener('change', loadContent);
}

// Search Feature
if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if(query) {
      sectionTitle.textContent = `Search Results: ${query}`;
      getMedia(`https://api.themoviedb.org/3/search/${currentType}?api_key=${API_KEY}&query=${query}`, currentType);
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });
}

// Player Modal Na May Season & Episode Selector para sa TV/Anime
function openModal(title, overview, id, type) {
  let season = 1;
  let episode = 1;

  function getLinks(s, e) {
    if (type === 'tv') {
      return {
        s1: `https://vidlink.pro/tv/${id}/${s}/${e}`,
        s2: `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
        s3: `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
        s4: `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`
      };
    } else {
      return {
        s1: `https://vidlink.pro/movie/${id}`,
        s2: `https://vidsrc.cc/v2/embed/movie/${id}`,
        s3: `https://www.2embed.cc/embed/${id}`,
        s4: `https://vidsrc.pro/embed/movie/${id}`
      };
    }
  }

  let links = getLinks(season, episode);

  modalBody.innerHTML = `
    <h3 style="margin-bottom:8px; font-size:16px; color:#fff;">${title}</h3>
    
    ${type === 'tv' ? `
      <div class="episode-selector">
        <div class="select-group">
          <label style="font-size:11px; color:#aaa;">Season:</label>
          <select id="seasonSelect">
            ${Array.from({length: 10}, (_, i) => `<option value="${i+1}" ${i+1 === season ? 'selected' : ''}>Season ${i+1}</option>`).join('')}
          </select>
        </div>
        <div class="select-group">
          <label style="font-size:11px; color:#aaa;">Episode:</label>
          <select id="episodeSelect">
            ${Array.from({length: 30}, (_, i) => `<option value="${i+1}" ${i+1 === episode ? 'selected' : ''}>Episode ${i+1}</option>`).join('')}
          </select>
        </div>
      </div>
    ` : ''}

    <div style="display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;" id="serverButtons">
      <button onclick="changeServer('${links.s1}', this)" class="server-btn active-server" style="padding:6px 12px; font-size:12px; background:#e50914; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Server 1</button>
      <button onclick="changeServer('${links.s2}', this)" class="server-btn" style="padding:6px 12px; font-size:12px; background:#22252f; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Server 2</button>
      <button onclick="changeServer('${links.s3}', this)" class="server-btn" style="padding:6px 12px; font-size:12px; background:#22252f; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Server 3</button>
      <button onclick="changeServer('${links.s4}', this)" class="server-btn" style="padding:6px 12px; font-size:12px; background:#22252f; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Server 4</button>
    </div>

    <iframe id="playerIframe" src="${links.s1}" width="100%" height="250" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" style="border-radius:6px; background:#000;"></iframe>
    <p style="margin-top:10px; color:#ccc; font-size:12px; max-height:80px; overflow-y:auto;">${overview}</p>
  `;

  modal.style.display = 'flex';

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
          b.classList.add('active-server');
        } else {
          b.style.background = '#22252f';
          b.classList.remove('active-server');
        }
      });
    };

    seasonSelect.addEventListener('change', updatePlayerSource);
    episodeSelect.addEventListener('change', updatePlayerSource);
  }
}

// Global helper para sa pagpapalit ng server buttons color at iframe
window.changeServer = function(url, btn) {
  document.getElementById('playerIframe').src = url;
  const buttons = document.querySelectorAll('#serverButtons button');
  buttons.forEach(b => {
    b.style.background = '#22252f';
  });
  btn.style.background = '#e50914';
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

// Initial Load
loadContent();
