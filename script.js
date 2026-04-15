  const API_KEY = '885fdc3d5edf565b21927cce315cb253';
  const BASE    = 'https://api.themoviedb.org/3';
  const IMG     = 'https://image.tmdb.org/t/p/w500';

  const section    = document.getElementById('section');
  const searchbar  = document.getElementById('searchbar');
  const genreSel   = document.getElementById('genre-select');
  const sortSel    = document.getElementById('sort-select');
  const label      = document.getElementById('section-label');

  let currentCategory = 'popular';
  let currentGenre    = '';
  let searchTimeout   = null;

  // ── Helpers ─────────────────────────────────────────────
  function showLoader() {
    section.innerHTML = `<div class="loader"><div class="spinner"></div><p>Loading movies…</p></div>`;
  }

  function getRatingColor(r) {
    if (r >= 7.5) return '#4caf50';
    if (r >= 5)   return '#f5c518';
    return '#e63946';
  }

  function getYear(date) {
    return date ? date.slice(0, 4) : 'N/A';
  }

  // ── Fetch & Display ──────────────────────────────────────
  async function fetchMovies(url) {
    showLoader();
    try {
      const res  = await fetch(url);
      const data = await res.json();
      displayMovies(data.results || []);
    } catch {
      section.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>Something went wrong. Check your API key!</p></div>`;
    }
  }

  function displayMovies(movies) {
    if (!movies.length) {
      section.innerHTML = `<div class="empty-state"><div class="icon">🎬</div><p>No movies found.</p></div>`;
      return;
    }

    section.innerHTML = movies.map(m => {
      const rating  = m.vote_average ? m.vote_average.toFixed(1) : 'N/A';
      const color   = m.vote_average ? getRatingColor(m.vote_average) : 'gray';
      const year    = getYear(m.release_date);
      const poster  = m.poster_path ? IMG + m.poster_path : 'https://via.placeholder.com/300x450/10111c/7b7d8e?text=No+Image';
      const isNew   = m.release_date && new Date(m.release_date) > new Date(Date.now() - 30*24*60*60*1000);

      return `
        <div class="card" onclick="openTrailer('${m.title.replace(/'/g,"\\'")}')">
          ${isNew ? '<span class="badge">New</span>' : ''}
          <img src="${poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/10111c/7b7d8e?text=No+Image'"/>
          <div class="overlay"><div class="play-btn">▶</div></div>
          <div class="card-info">
            <p class="card-title">${m.title}</p>
            <div class="card-meta">
              <span class="rating" style="color:${color}">
                <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                ${rating}
              </span>
              <span class="year">${year}</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function openTrailer(title) {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(title)}+trailer`, '_blank');
  }

  // ── Category Tabs ────────────────────────────────────────
  function loadCategory(cat) {
    currentCategory = cat;
    currentGenre    = '';
    genreSel.value  = '';
    searchbar.value = '';

    const sort = sortSel.value;
    let url;

    if (cat === 'popular' || cat === 'now_playing' || cat === 'upcoming' || cat === 'top_rated') {
      url = `${BASE}/movie/${cat}?api_key=${API_KEY}&page=1`;
    }

    const niceName = cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    label.innerHTML = `<span>${niceName}</span> Movies`;
    fetchMovies(url);
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadCategory(btn.dataset.url);
    });
  });

  // ── Genre Filter ─────────────────────────────────────────
  async function loadGenres() {
    try {
      const res  = await fetch(`${BASE}/genre/movie/list?api_key=${API_KEY}`);
      const data = await res.json();
      (data.genres || []).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        genreSel.appendChild(opt);
      });
    } catch {}
  }

  genreSel.addEventListener('change', () => {
    currentGenre    = genreSel.value;
    searchbar.value = '';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    if (!currentGenre) { loadCategory(currentCategory); return; }

    const sort = sortSel.value;
    label.innerHTML = `<span>${genreSel.options[genreSel.selectedIndex].text}</span> Movies`;
    fetchMovies(`${BASE}/discover/movie?api_key=${API_KEY}&with_genres=${currentGenre}&sort_by=${sort}&page=1`);
  });

  // ── Sort ─────────────────────────────────────────────────
  sortSel.addEventListener('change', () => {
    if (searchbar.value.trim()) return;
    if (currentGenre) {
      genreSel.dispatchEvent(new Event('change'));
    } else {
      loadCategory(currentCategory);
    }
  });

  // ── Search ───────────────────────────────────────────────
  searchbar.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = searchbar.value.trim();
    if (!q) { loadCategory(currentCategory); return; }
    searchTimeout = setTimeout(() => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      label.innerHTML = `Results for <span>"${q}"</span>`;
      fetchMovies(`${BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(q)}&page=1`);
    }, 400);
  });

  // ── Init ─────────────────────────────────────────────────
  loadGenres();
  loadCategory('popular');