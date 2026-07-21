document.addEventListener('DOMContentLoaded', () => {
  // Apply theme override instantly on load
  const currentTheme = localStorage.getItem('neon_settings_theme') || 'default';
  if (currentTheme !== 'default') {
    document.body.classList.add(`theme-${currentTheme}`);
  }

  // Elements
  const profileUsername = document.getElementById('profileUsername');
  const bestScoreVal = document.getElementById('bestScoreVal');
  const highestLevelVal = document.getElementById('highestLevelVal');
  const statTotalGames = document.querySelector('.stats-cards-grid .stat-card:nth-child(1) .stat-number');
  const statWinRate = document.querySelector('.stats-cards-grid .stat-card:nth-child(2) .stat-number');
  
  const bioForm = document.getElementById('bioForm');
  const bioInput = document.getElementById('bioInput');
  const bioCounter = document.getElementById('bioCounter');
  const saveBioBtn = document.getElementById('saveBioBtn');
  const saveBioText = document.getElementById('saveBioText');

  // Achievements elements
  const badgeSeqMaster = document.getElementById('badge-seq-master');
  const badgeSpeedDemon = document.getElementById('badge-speed-demon');
  const badgeElitePilot = document.getElementById('badge-elite-pilot');
  const badgeDecryptExpert = document.getElementById('badge-decrypt-expert');
  const badgePerfectMemory = document.getElementById('badge-perfect-memory');
  const badgeSyndicateChamp = document.getElementById('badge-syndicate-champ');

  // Audio Context (Web Audio API)
  let audioCtx = null;
  
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playConfirmChime() {
    initAudio();
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch(e){}
  }

  // 1. Sync Pilot Callsign from LocalStorage
  const savedEmail = localStorage.getItem('neon_pilot_email');
  if (savedEmail) {
    const callsign = savedEmail.split('@')[0].toUpperCase();
    profileUsername.textContent = `PILOT_${callsign}`;
  }

  // 2. Fetch Player XP Stats
  const totalXp = parseInt(localStorage.getItem('neon_total_xp')) || 0;
  const calculatedLevel = Math.floor(totalXp / 500) + 1;
  const gamesPlayed = parseInt(localStorage.getItem('neon_games_played')) || 28;

  // 3. Find Absolute Best Score across modes
  const modes = ['classic', 'timer', 'survival', 'daily'];
  const arenas = ['normal', 'advanced'];
  let absoluteBestScore = 0;
  
  modes.forEach(mode => {
    arenas.forEach(arena => {
      const scoreKey = `neon_best_score_${mode}_${arena}`;
      const best = parseInt(localStorage.getItem(scoreKey)) || 0;
      if (best > absoluteBestScore) {
        absoluteBestScore = best;
      }
    });
  });

  // Default mock fallback values
  const finalBestScore = absoluteBestScore > 0 ? absoluteBestScore : 42905;
  const calculatedHighestLvl = absoluteBestScore > 0 ? Math.max(1, Math.floor(absoluteBestScore / 10) + 1) : 84;

  bestScoreVal.textContent = finalBestScore.toLocaleString();
  highestLevelVal.textContent = String(calculatedHighestLvl).padStart(2, '0');
  statTotalGames.textContent = String(gamesPlayed).padStart(2, '0');
  
  const accuracyBase = 92.5 + (calculatedLevel * 0.15);
  const finalAccuracy = Math.min(99.8, accuracyBase).toFixed(1);
  statWinRate.textContent = `${finalAccuracy}%`;

  // 4. Achievement unlocking evaluation
  function evaluateBadges() {
    // Badge 1: Seq Master (Score >= 50)
    if (finalBestScore >= 50) {
      badgeSeqMaster.classList.remove('locked');
      badgeSeqMaster.classList.add('unlocked');
    }
    // Badge 2: Speed Demon (Level >= 3)
    if (calculatedLevel >= 3) {
      badgeSpeedDemon.classList.remove('locked');
      badgeSpeedDemon.classList.add('unlocked');
    }
    // Badge 3: Elite Pilot (Level >= 10)
    if (calculatedLevel >= 10) {
      badgeElitePilot.classList.remove('locked');
      badgeElitePilot.classList.add('unlocked');
    }
    // Badge 4: Decrypt Expert (Games >= 5)
    if (gamesPlayed >= 5) {
      badgeDecryptExpert.classList.remove('locked');
      badgeDecryptExpert.classList.add('unlocked');
    }
    // Badge 5: Perfect Memory (Score >= 120)
    if (finalBestScore >= 120) {
      badgePerfectMemory.classList.remove('locked');
      badgePerfectMemory.classList.add('unlocked');
    }
    // Badge 6: Syndicate Champ (Level >= 20)
    if (calculatedLevel >= 20) {
      badgeSyndicateChamp.classList.remove('locked');
      badgeSyndicateChamp.classList.add('unlocked');
    }
  }
  evaluateBadges();

  // 5. Unlocked cosmetics listings details
  function updateCosmeticsList() {
    const rewardsList = document.querySelector('.rewards-list');
    if (!rewardsList) return;

    // Check unlocks
    const amberUnlocked = totalXp >= 2000;
    const synthwaveUnlocked = totalXp >= 5000;
    const toxicUnlocked = totalXp >= 10000;

    rewardsList.innerHTML = `
      <li class="reward-item active-reward">
        <span class="ri-dot"></span>
        <span class="ri-label">Theme 1:</span>
        <span class="ri-val text-glow-green">NEON_CORE (ACTIVE)</span>
      </li>
      <li class="reward-item ${amberUnlocked ? 'active-reward' : ''}">
        <span class="ri-dot ${amberUnlocked ? '' : 'gray'}"></span>
        <span class="ri-label">Theme 2:</span>
        <span class="ri-val ${amberUnlocked ? 'text-glow-cyan' : ''}">AMBER_RETRO ${amberUnlocked ? '(UNLOCKED)' : '(LOCKED)'}</span>
      </li>
      <li class="reward-item ${synthwaveUnlocked ? 'active-reward' : ''}">
        <span class="ri-dot ${synthwaveUnlocked ? '' : 'gray'}"></span>
        <span class="ri-label">Theme 3:</span>
        <span class="ri-val ${synthwaveUnlocked ? 'text-glow-cyan' : ''}">SYNTH_WAVE ${synthwaveUnlocked ? '(UNLOCKED)' : '(LOCKED)'}</span>
      </li>
      <li class="reward-item ${toxicUnlocked ? 'active-reward' : ''}">
        <span class="ri-dot ${toxicUnlocked ? '' : 'gray'}"></span>
        <span class="ri-label">Theme 4:</span>
        <span class="ri-val ${toxicUnlocked ? 'text-glow-cyan' : ''}">TOXIK_CORE ${toxicUnlocked ? '(UNLOCKED)' : '(LOCKED)'}</span>
      </li>
    `;
  }
  updateCosmeticsList();

  // 6. Persistent Bios record Form handlers
  const savedBio = localStorage.getItem('neon_pilot_bio') || '';
  bioInput.value = savedBio;
  updateBioCounter();

  function updateBioCounter() {
    const length = bioInput.value.length;
    bioCounter.textContent = `${length} / 160`;
    if (length >= 160) {
      bioCounter.style.color = 'var(--neon-red)';
    } else {
      bioCounter.style.color = '';
    }
  }

  bioInput.addEventListener('input', updateBioCounter);

  bioForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const bioText = bioInput.value.trim();
    localStorage.setItem('neon_pilot_bio', bioText);
    
    playConfirmChime();

    saveBioBtn.disabled = true;
    saveBioText.textContent = 'PROTOCOL_SAVED!';
    saveBioBtn.style.borderColor = 'var(--neon-green)';
    saveBioBtn.style.boxShadow = '0 0 15px var(--neon-green)';
    
    setTimeout(() => {
      saveBioBtn.disabled = false;
      saveBioText.textContent = 'SAVE PROTOCOL';
      saveBioBtn.style.borderColor = '';
      saveBioBtn.style.boxShadow = '';
    }, 1500);
  });

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
