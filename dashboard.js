document.addEventListener('DOMContentLoaded', () => {
  // Apply theme override instantly on load
  const currentTheme = localStorage.getItem('neon_settings_theme') || 'default';
  if (currentTheme !== 'default') {
    document.body.classList.add(`theme-${currentTheme}`);
  }

  // Elements
  const profileUsername = document.getElementById('profileUsername');
  const xpFillBar = document.getElementById('xpFillBar');
  const xpText = document.getElementById('xpText');
  const xpLevelBadge = document.getElementById('xpLevelBadge');

  const statTotalScore = document.getElementById('statTotalScore');
  const statHighestLevel = document.getElementById('statHighestLevel');
  const statAvgAccuracy = document.getElementById('statAvgAccuracy');
  const statGamesPlayed = document.getElementById('statGamesPlayed');
  
  const chartNodes = document.querySelectorAll('.chart-node');
  const chartTooltip = document.getElementById('chartTooltip');
  const chartLinePath = document.getElementById('chartLinePath');

  // 1. Sync User Callsign Profile Info from LocalStorage
  const savedEmail = localStorage.getItem('neon_pilot_email');
  if (savedEmail) {
    const callsign = savedEmail.split('@')[0].toUpperCase();
    profileUsername.textContent = `PILOT_${callsign}`;
  }

  // 2. XP level calculations & animations
  const totalXp = parseInt(localStorage.getItem('neon_total_xp')) || 0;
  const calculatedLevel = Math.floor(totalXp / 500) + 1;
  const currentXpValue = totalXp % 500;
  const progressPercentage = (currentXpValue / 500) * 100;

  xpLevelBadge.textContent = `LVL ${calculatedLevel}`;
  xpText.textContent = `${currentXpValue.toLocaleString()} / 500 XP`;

  // Start from 0 width and animate to progress percentage
  setTimeout(() => {
    xpFillBar.style.width = `${progressPercentage}%`;
  }, 100);

  // 3. Sync Dynamic Statistics
  // Read all best score combinations
  const modes = ['classic', 'timer', 'survival', 'daily'];
  const arenas = ['normal', 'advanced'];
  
  let summedScores = 0;
  let highestLevelAcrossModes = 1;
  
  modes.forEach(mode => {
    arenas.forEach(arena => {
      const scoreKey = `neon_best_score_${mode}_${arena}`;
      const best = parseInt(localStorage.getItem(scoreKey)) || 0;
      summedScores += best;
      
      // Calculate level achieved based on score (10 score per level)
      const calculatedLvl = Math.max(1, Math.floor(best / 10) + 1);
      if (calculatedLvl > highestLevelAcrossModes) {
        highestLevelAcrossModes = calculatedLvl;
      }
    });
  });

  // Default mock values if first time loading dashboard
  const finalTotalScore = summedScores > 0 ? summedScores : 45200;
  const finalHighestLevel = summedScores > 0 ? highestLevelAcrossModes : 42;
  const finalGamesPlayed = parseInt(localStorage.getItem('neon_games_played')) || 28;

  statTotalScore.textContent = finalTotalScore.toLocaleString();
  statHighestLevel.textContent = String(finalHighestLevel).padStart(2, '0');
  statGamesPlayed.textContent = String(finalGamesPlayed).padStart(2, '0');
  
  // Set mock Avg Accuracy based on games played to keep theme tech
  const accuracyBase = 92.5 + (calculatedLevel * 0.15);
  const finalAccuracy = Math.min(99.8, accuracyBase).toFixed(1);
  statAvgAccuracy.textContent = `${finalAccuracy}%`;

  // 4. Interactive SVG Chart Node Tooltips
  chartNodes.forEach((node, index) => {
    node.style.transition = 'all 0.2s ease';
    node.style.transformOrigin = 'center';
    node.style.transform = 'scale(0)';
    
    setTimeout(() => {
      node.style.transform = 'scale(1)';
    }, 1200 + index * 150);

    node.addEventListener('mouseenter', (e) => {
      const val = node.getAttribute('data-val');
      const svg = node.ownerSVGElement;
      const point = svg.createSVGPoint();
      point.x = parseFloat(node.getAttribute('cx'));
      point.y = parseFloat(node.getAttribute('cy'));
      
      const matrix = node.getScreenCTM();
      const screenPoint = point.matrixTransform(matrix);
      
      const viewportRect = svg.getBoundingClientRect();
      const tooltipX = screenPoint.x - window.scrollX - viewportRect.left + 5;
      const tooltipY = screenPoint.y - window.scrollY - viewportRect.top - 10;
      
      chartTooltip.textContent = `SCORE: ${val}`;
      chartTooltip.style.left = `${tooltipX}px`;
      chartTooltip.style.top = `${tooltipY}px`;
      chartTooltip.classList.add('visible');
    });

    node.addEventListener('mouseleave', () => {
      chartTooltip.classList.remove('visible');
    });
  });

  // 5. Connection latency ticking HUD
  const connectionText = document.querySelector('.hud-connection-text');
  if (connectionText) {
    setInterval(() => {
      const activeState = Math.random() > 0.1 ? 'ON' : 'CALIBRATING';
      if (activeState === 'ON') {
        const mockLatency = Math.floor(Math.random() * 8) + 8; // 8-15ms
        connectionText.textContent = `CORE_SIM_ACTIVE [${mockLatency}ms]`;
      } else {
        connectionText.textContent = 'CORE_SIM_SYNCING...';
      }
    }, 4000);
  }

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
