document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const profileUsername = document.getElementById('profileUsername');
  const bestScoreVal = document.getElementById('bestScoreVal');
  const highestLevelVal = document.getElementById('highestLevelVal');
  
  const bioForm = document.getElementById('bioForm');
  const bioInput = document.getElementById('bioInput');
  const bioCounter = document.getElementById('bioCounter');
  const saveBioBtn = document.getElementById('saveBioBtn');
  const saveBioText = document.getElementById('saveBioText');

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
    } catch (e) {}
  }

  // 1. Sync Pilot Callsign from LocalStorage
  const savedEmail = localStorage.getItem('neon_pilot_email');
  if (savedEmail) {
    const callsign = savedEmail.split('@')[0].toUpperCase();
    profileUsername.textContent = `PILOT_${callsign}`;
  }

  // 2. Sync High Score & Levels from LocalStorage
  const bestScore = localStorage.getItem('neon_best_score');
  if (bestScore) {
    const scoreInt = parseInt(bestScore);
    bestScoreVal.textContent = String(scoreInt).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    const calculatedLevel = Math.max(1, Math.floor(scoreInt / 10) + 1);
    if (calculatedLevel > parseInt(highestLevelVal.textContent)) {
      highestLevelVal.textContent = String(calculatedLevel).padStart(2, '0');
    }
  }

  // 3. Load Persistent Bio from LocalStorage
  const savedBio = localStorage.getItem('neon_pilot_bio') || '';
  bioInput.value = savedBio;
  updateBioCounter();

  // Word counter updater
  function updateBioCounter() {
    const length = bioInput.value.length;
    bioCounter.textContent = `${length} / 160`;
    
    // Highlight counter red when max limit reached
    if (length >= 160) {
      bioCounter.style.color = 'var(--neon-red)';
    } else {
      bioCounter.style.color = '';
    }
  }

  bioInput.addEventListener('input', updateBioCounter);

  // 4. Save Bio Submission
  bioForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const bioText = bioInput.value.trim();
    localStorage.setItem('neon_pilot_bio', bioText);
    
    // Sound chime cue
    playConfirmChime();

    // Visual button state transition
    saveBioBtn.disabled = true;
    saveBioText.textContent = 'PROTOCOL_SAVED!';
    saveBioBtn.style.borderColor = 'var(--neon-green)';
    
    // Animate outline flash
    saveBioBtn.style.boxShadow = '0 0 15px var(--neon-green)';
    
    setTimeout(() => {
      saveBioBtn.disabled = false;
      saveBioText.textContent = 'SAVE PROTOCOL';
      saveBioBtn.style.borderColor = '';
      saveBioBtn.style.boxShadow = '';
    }, 1500);
  });
});
