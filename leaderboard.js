document.addEventListener('DOMContentLoaded', () => {
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
  
  // Retrieve Player actual High score
  const userBestScore = parseInt(localStorage.getItem('neon_best_score')) || 42905;
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

  // MOCK DATABASE SCOPES
  const leaderboardData = {
    daily: {
      podium: [
        { rank: 1, name: 'CYBER_DRAGON', score: '104,500', level: 54, accuracy: 99.4 },
        { rank: 2, name: 'V_GHOST', score: '88,290', level: 42, accuracy: 97.8 },
        { rank: 3, name: 'ECHO_PULSE', score: '76,140', level: 38, accuracy: 96.9 }
      ],
      rows: [
        { rank: 4, name: 'ZENITH_ZERO', score: '68,402', accuracy: 98.4, streak: 412, level: 32 },
        { rank: 5, name: 'NOVA_RUNNER', score: '62,110', accuracy: 94.1, streak: 289, level: 29 },
        { rank: 6, name: 'PRISM_SHARD', score: '59,284', accuracy: 92.8, streak: 305, level: 27 },
        { rank: 7, name: `${userCallsign} (YOU)`, score: String(userBestScore).replace(/\B(?=(\d{3})+(?!\d))/g, ","), accuracy: 88.2, streak: 112, level: userBestLevel, isUser: true },
        { rank: 8, name: 'VECTOR_X', score: '38,150', accuracy: 96.4, streak: 198, level: 20 },
        { rank: 9, name: 'VOID_WALKER', score: '24,600', accuracy: 85.3, streak: 92, level: 14 },
        { rank: 10, name: 'CHRONO_KEYS', score: '18,200', accuracy: 91.0, streak: 84, level: 10 }
      ]
    },
    weekly: {
      podium: [
        { rank: 1, name: 'PILOT_X', score: '248,900', level: 86, accuracy: 99.7 },
        { rank: 2, name: 'CYBER_DRAGON', score: '194,500', level: 74, accuracy: 98.6 },
        { rank: 3, name: 'NEON_GOD', score: '161,200', level: 68, accuracy: 98.1 }
      ],
      rows: [
        { rank: 4, name: 'V_GHOST', score: '142,500', accuracy: 97.4, streak: 512, level: 60 },
        { rank: 5, name: 'ECHO_PULSE', score: '124,600', accuracy: 95.8, streak: 390, level: 52 },
        { rank: 6, name: 'ZENITH_ZERO', score: '98,400', accuracy: 98.2, streak: 412, level: 44 },
        { rank: 7, name: 'PRISM_SHARD', score: '82,900', accuracy: 93.9, streak: 320, level: 38 },
        { rank: 8, name: 'NOVA_RUNNER', score: '78,150', accuracy: 94.0, streak: 289, level: 35 },
        { rank: 9, name: 'VECTOR_X', score: '62,400', accuracy: 95.1, streak: 210, level: 28 },
        { rank: 42, name: `${userCallsign} (YOU)`, score: String(userBestScore).replace(/\B(?=(\d{3})+(?!\d))/g, ","), accuracy: 88.2, streak: 112, level: userBestLevel, isUser: true }
      ]
    },
    monthly: {
      podium: [
        { rank: 1, name: 'NEON_GOD', score: '584,200', level: 112, accuracy: 99.8 },
        { rank: 2, name: 'PILOT_X', score: '492,100', level: 98, accuracy: 99.2 },
        { rank: 3, name: 'CYBER_DRAGON', score: '382,900', level: 88, accuracy: 98.9 }
      ],
      rows: [
        { rank: 4, name: 'V_GHOST', score: '284,500', accuracy: 96.9, streak: 684, level: 74 },
        { rank: 5, name: 'ECHO_PULSE', score: '246,140', accuracy: 95.2, streak: 450, level: 66 },
        { rank: 6, name: 'ZENITH_ZERO', score: '198,400', accuracy: 98.0, streak: 412, level: 54 },
        { rank: 7, name: 'NOVA_RUNNER', score: '158,150', accuracy: 93.6, streak: 289, level: 48 },
        { rank: 58, name: `${userCallsign} (YOU)`, score: String(userBestScore).replace(/\B(?=(\d{3})+(?!\d))/g, ","), accuracy: 88.2, streak: 112, level: userBestLevel, isUser: true },
        { rank: 89, name: 'VECTOR_X', score: '38,150', accuracy: 96.4, streak: 198, level: 20 }
      ]
    },
    'all-time': {
      podium: [
        { rank: 1, name: 'NEON_GOD', score: '1,248,400', level: 184, accuracy: 99.9 },
        { rank: 2, name: 'PILOT_X', score: '984,920', level: 154, accuracy: 99.4 },
        { rank: 3, name: 'CYBER_DRAGON', score: '884,500', level: 142, accuracy: 99.1 }
      ],
      rows: [
        { rank: 4, name: 'V_GHOST', score: '788,290', accuracy: 97.8, streak: 984, level: 120 },
        { rank: 5, name: 'ECHO_PULSE', score: '676,140', accuracy: 96.9, streak: 820, level: 104 },
        { rank: 6, name: 'ZENITH_ZERO', score: '580,402', accuracy: 98.4, streak: 712, level: 90 },
        { rank: 7, name: 'NOVA_RUNNER', score: '462,110', accuracy: 94.1, streak: 584, level: 82 },
        { rank: 128, name: `${userCallsign} (YOU)`, score: String(userBestScore).replace(/\B(?=(\d{3})+(?!\d))/g, ","), accuracy: 88.2, streak: 112, level: userBestLevel, isUser: true }
      ]
    }
  };

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
    podium.forEach((player) => {
      const card = podiumCards[player.rank];
      if (!card) return;
      
      const usernameEl = card.querySelector('.podium-username');
      const scoreEl = card.querySelector('.ps-value');
      const metaEl = card.querySelector('.podium-meta');
      
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
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'scale(1) translateY(0)';
      }, player.rank === 1 ? 150 : (player.rank === 2 ? 300 : 450));
    });
  }

  // Reload page leaderboard data scope (transition sequence)
  function switchLeaderboardScope(scope) {
    playTickSound();
    
    // Set labels
    activeFilterLabel.textContent = `FILTER: ${scope.toUpperCase()}`;
    
    // Add fade out
    podiumSection.classList.add('table-fade-out');
    rankingsTableBody.classList.add('table-fade-out');
    
    setTimeout(() => {
      const data = leaderboardData[scope];
      renderPodium(data.podium);
      renderTableRows(filterSearch(data.rows, searchBar.value));
      
      podiumSection.classList.remove('table-fade-out');
      rankingsTableBody.classList.remove('table-fade-out');
      
      // Fade back in
      podiumSection.classList.add('table-fade-in');
      rankingsTableBody.classList.add('table-fade-in');
      
      setTimeout(() => {
        podiumSection.classList.remove('table-fade-in');
        rankingsTableBody.classList.remove('table-fade-in');
      }, 500);
      
    }, 300);
  }

  // Filter list rows based on search input
  function filterSearch(rows, query) {
    if (!query) return rows;
    const cleanQuery = query.trim().toLowerCase();
    return rows.filter(row => row.name.toLowerCase().includes(cleanQuery));
  }

  // Handle live search input keypresses
  searchBar.addEventListener('input', () => {
    // Determine current active filter scope
    const activeBtn = document.querySelector('.filter-btn.active');
    const scope = activeBtn ? activeBtn.getAttribute('data-filter') : 'daily';
    const data = leaderboardData[scope];
    
    // Filter rows
    const filteredRows = filterSearch(data.rows, searchBar.value);
    
    // Simple filter table row animations
    renderTableRows(filteredRows);
    
    // Filter podium cards (fade cards out if they don't match query)
    data.podium.forEach(player => {
      const card = podiumCards[player.rank];
      if (!card) return;
      
      if (searchBar.value && !player.name.toLowerCase().includes(searchBar.value.trim().toLowerCase())) {
        card.style.opacity = '0.15';
        card.style.pointerEvents = 'none';
      } else {
        card.style.opacity = '1';
        card.style.pointerEvents = 'all';
      }
    });
  });

  // Bind Scope Tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;
      
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterScope = btn.getAttribute('data-filter');
      switchLeaderboardScope(filterScope);
    });
  });

  // Initialize page load
  renderPodium(leaderboardData.daily.podium);
  renderTableRows(leaderboardData.daily.rows);
});
