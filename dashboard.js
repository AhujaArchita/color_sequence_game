document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const profileUsername = document.getElementById('profileUsername');
  const xpFillBar = document.getElementById('xpFillBar');
  const xpText = document.getElementById('xpText');
  
  const chartNodes = document.querySelectorAll('.chart-node');
  const chartTooltip = document.getElementById('chartTooltip');
  const chartLinePath = document.getElementById('chartLinePath');

  // 1. Sync User Callsign Profile Info from LocalStorage
  const savedEmail = localStorage.getItem('neon_pilot_email');
  if (savedEmail) {
    const callsign = savedEmail.split('@')[0].toUpperCase();
    profileUsername.textContent = `PILOT_${callsign}`;
  }

  // Sync high level score if user played in this browser
  const bestScore = localStorage.getItem('neon_best_score');
  if (bestScore) {
    // If they have a high score, calculate a mock level based on it
    // E.g., if best score is 30, level is 4 (10 score per level)
    const mockLevel = Math.max(1, Math.floor(parseInt(bestScore) / 10) + 1);
    
    // We can display this high score or level in the stats
    const statsNumbers = document.querySelectorAll('.stat-number');
    if (statsNumbers && statsNumbers.length >= 2) {
      // statsNumbers[0] is Total Score, statsNumbers[1] is Highest Level
      // Let's set Highest Level to mockLevel if it's greater than default
      const currentHighestLevel = parseInt(statsNumbers[1].textContent);
      if (mockLevel > currentHighestLevel) {
        statsNumbers[1].textContent = String(mockLevel).padStart(2, '0');
      }
    }
  }

  // 2. Animate XP Battery Progress Bar on page load
  // Start from 0 width and animate to 84.5%
  setTimeout(() => {
    xpFillBar.style.width = '84.5%';
  }, 100);

  // 3. Interactive SVG Chart Node Tooltips
  chartNodes.forEach((node, index) => {
    // Set node scale-up transition delay
    node.style.transition = 'all 0.2s ease';
    node.style.transformOrigin = 'center';
    node.style.transform = 'scale(0)';
    
    // Animate scale in sequentially
    setTimeout(() => {
      node.style.transform = 'scale(1)';
    }, 1200 + index * 150);

    // Hover tooltip interactions
    node.addEventListener('mouseenter', (e) => {
      const val = node.getAttribute('data-val');
      
      // Get SVG bounding box coordinates to align tooltip
      const svg = node.ownerSVGElement;
      const point = svg.createSVGPoint();
      point.x = parseFloat(node.getAttribute('cx'));
      point.y = parseFloat(node.getAttribute('cy'));
      
      // Transform SVG coordinates to screen coordinates
      const matrix = node.getScreenCTM();
      const screenPoint = point.matrixTransform(matrix);
      
      // Transform screen coordinates back to viewport relative offset
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

  // 4. Interactive Telemetry Latency Log ticker
  // Update latency periodically to make it feel alive
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
});
