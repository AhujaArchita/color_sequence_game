document.addEventListener('DOMContentLoaded', () => {
  // Apply theme override instantly on load
  const currentTheme = localStorage.getItem('neon_settings_theme') || 'default';
  if (currentTheme !== 'default') {
    document.body.classList.add(`theme-${currentTheme}`);
  }

  // Elements
  const podiumSection = document.getElementById('podiumSection');
  const rankingsTableBody = document.getElementById('rankingsTableBody');
  const activeFilterLabel = document.getElementById('activeFilterLabel');
  const searchBar = document.getElementById('searchBar');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Top 3 Podium Card DOM structures
  const podiumCards = {
    1: document.getElementById('podium-1'),
    2: document.getElementById('podium-2'),
    3: document.getElementById('podium-3')
  };

  // Retrieve PlayerCallsng from LocalStorage
  const savedEmail = localStorage.getItem('neon_pilot_email');
  const userCallsign = savedEmail ? savedEmail.split('@')[0].toUpperCase() : 'NEON PILOT';
  
  // Retrieve Player actual High score across all modules
  const modesList = ['classic', 'timer', 'survival', 'daily'];
  const arenasList = ['normal', 'advanced'];
  let absoluteBest = 0;
  modesList.forEach(m => {
    arenasList.forEach(a => {
      const best = parseInt(localStorage.getItem(`neon_best_score_${m}_${a}`)) || 0;
      if (best > absoluteBest) absoluteBest = best;
    });
  });
  
  const userBestScore = absoluteBest > 0 ? absoluteBest : 42905;
  const userBestLevel = Math.max(1, Math.floor(userBestScore / 10) + 1);

  // Audio Synth Context
  let audioCtx = null;
  let isMuted = false; // Mock linkage, can fetch from settings if preferred

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playTickSound() {
    if (isMuted) return;
    initAudio();
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high tick
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  // Populate Table rows
  function renderTableRows(rows) {
    rankingsTableBody.innerHTML = '';
    
    if (rows.length === 0) {
      rankingsTableBody.innerHTML = `
        <div class="table-row" style="grid-template-columns: 1fr; justify-content: center; opacity: 0.5;">
          <div style="text-align: center; font-family: var(--font-tech);">NO_DATA_MATCHES_CALLSIGN</div>
        </div>
      `;
      return;
    }

    rows.forEach((row, index) => {
      const tr = document.createElement('div');
      tr.className = `table-row ${row.isUser ? 'highlight-user' : ''}`;
      
      // Animate slide in sequentially
      tr.style.opacity = '0';
      tr.style.transform = 'translateY(10px)';
      tr.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      
      tr.innerHTML = `
        <div class="row-rank">${String(row.rank).padStart(2, '0')}</div>
        <div class="row-player">
          <div class="row-player-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <span class="row-username">${row.name}</span>
        </div>
        <div class="row-accuracy">
          <span class="accuracy-pct">${row.accuracy}%</span>
          <div class="accuracy-bar-container">
            <div class="accuracy-bar" style="width: ${row.accuracy}%;"></div>
          </div>
        </div>
        <div class="row-streak">x${row.streak}</div>
        <div class="row-level">${String(row.level).padStart(2, '0')}</div>
        <div class="row-score">${row.score}</div>
      `;
      
      rankingsTableBody.appendChild(tr);
      
      setTimeout(() => {
        tr.style.opacity = '1';
        tr.style.transform = 'translateY(0)';
      }, index * 80);
    });
  }

  // Populate Podium Top 3 Cards
  function renderPodium(podium) {
    [1, 2, 3].forEach((rank) => {
      const card = podiumCards[rank];
      if (!card) return;
      
      const player = podium.find(p => p.rank === rank);
      const usernameEl = card.querySelector('.podium-username');
      const scoreEl = card.querySelector('.ps-value');
      const metaEl = card.querySelector('.podium-meta');
      
      if (player) {
        usernameEl.textContent = player.name;
        scoreEl.textContent = player.score;
        metaEl.innerHTML = `
          <span>LVL ${player.level}</span>
          <span class="${player.rank === 1 ? 'text-glow-green' : 'text-glow-cyan'}">${player.accuracy}% ACC</span>
        `;
        
        // Animate entry scale
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9) translateY(15px)';
        card.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15)';
        card.style.pointerEvents = 'all';
        
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1) translateY(0)';
        }, rank === 1 ? 150 : (rank === 2 ? 300 : 450));
      } else {
        usernameEl.textContent = 'NO_PILOT';
        scoreEl.textContent = '0';
        metaEl.innerHTML = `
          <span>LVL 0</span>
          <span>0.0% ACC</span>
        `;
        card.style.opacity = '0.4';
        card.style.transform = 'scale(0.95)';
        card.style.pointerEvents = 'none';
      }
    });
  }

  let currentScope = 'daily';

  // Fetch leaderboard data from API
  function fetchLeaderboard(scope, searchQuery = '') {
    // Add fade out class
    podiumSection.classList.add('table-fade-out');
    rankingsTableBody.classList.add('table-fade-out');
    
    const url = `backend/api/scores/leaderboard.php?time_scope=${scope}&q=${encodeURIComponent(searchQuery)}`;
    
    fetch(url)
      .then(response => response.json())
      .then(resData => {
        if (resData.success && resData.data && resData.data.rows) {
          const records = resData.data.rows;
          
          const podium = records.filter(r => r.rank <= 3);
          const rows = records.filter(r => r.rank > 3);
          
          renderPodium(podium);
          renderTableRows(rows);
        } else {
          renderPodium([]);
          renderTableRows([]);
        }
        
        podiumSection.classList.remove('table-fade-out');
        rankingsTableBody.classList.remove('table-fade-out');
        
        // Fade back in
        podiumSection.classList.add('table-fade-in');
        rankingsTableBody.classList.add('table-fade-in');
        
        setTimeout(() => {
          podiumSection.classList.remove('table-fade-in');
          rankingsTableBody.classList.remove('table-fade-in');
        }, 500);
      })
      .catch(error => {
        console.error("Leaderboard fetch error:", error);
        renderPodium([]);
        renderTableRows([]);
        podiumSection.classList.remove('table-fade-out');
        rankingsTableBody.classList.remove('table-fade-out');
      });
  }

  // Handle live search input keypresses
  searchBar.addEventListener('input', () => {
    fetchLeaderboard(currentScope, searchBar.value);
  });

  // Bind Scope Tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;
      
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentScope = btn.getAttribute('data-filter');
      activeFilterLabel.textContent = `FILTER: ${currentScope.toUpperCase()}`;
      playTickSound();
      fetchLeaderboard(currentScope, searchBar.value);
    });
  });

  // Initialize page load
  fetchLeaderboard(currentScope);

  // Global Neural Loader count-up animation
  const loader = document.getElementById('neuralLoader');
  const loaderPct = document.getElementById('loaderPct');
  if (loader && loaderPct) {
    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.floor(Math.random() * 20) + 10;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add('loaded');
        }, 150);
      }
      loaderPct.textContent = pct + '%';
    }, 60);
  }
});
