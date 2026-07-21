document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const registerForm = document.getElementById('registerForm');
  
  const usernameInput = document.getElementById('usernameInput');
  const usernameGroup = document.getElementById('usernameGroup');
  const usernameError = document.getElementById('usernameError');
  
  const emailInput = document.getElementById('emailInput');
  const emailGroup = document.getElementById('emailGroup');
  const emailError = document.getElementById('emailError');
  
  const passwordInput = document.getElementById('passwordInput');
  const passwordGroup = document.getElementById('passwordGroup');
  const passwordError = document.getElementById('passwordError');
  const passwordToggle = document.getElementById('passwordToggle');
  
  const confirmPasswordInput = document.getElementById('confirmPasswordInput');
  const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
  const confirmPasswordError = document.getElementById('confirmPasswordError');
  const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
  
  const termsCheckbox = document.getElementById('termsCheckbox');
  const createAccountBtn = document.getElementById('createAccountBtn');
  const createBtnText = document.getElementById('createBtnText');
  
  const globalErrorBox = document.getElementById('globalErrorBox');
  const globalErrorMessage = document.getElementById('globalErrorMessage');
  
  const registerCard = document.getElementById('registerCard');

  // Strength Meter Segments & Label
  const strengthLabel = document.getElementById('strengthLabel');
  const seg1 = document.getElementById('seg-1');
  const seg2 = document.getElementById('seg-2');
  const seg3 = document.getElementById('seg-3');

  // 1. Password Visibility Toggle for Password
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    passwordToggle.innerHTML = isPassword
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });

  // 2. Password Visibility Toggle for Confirm Password
  confirmPasswordToggle.addEventListener('click', () => {
    const isPassword = confirmPasswordInput.getAttribute('type') === 'password';
    confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
    confirmPasswordToggle.innerHTML = isPassword
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });

  // 3. Password Strength Checker Logic
  function evaluatePasswordStrength(password) {
    if (!password) return { score: 0, label: 'EMPTY' };

    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    
    // Mixed case check
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    
    // Number check
    if (/\d/.test(password)) score++;
    
    // Special symbol check
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    let label = 'WEAK';
    if (score === 3) label = 'MEDIUM';
    if (score === 4) label = 'SECURE';

    return { score, label };
  }

  function updateStrengthMeter() {
    const val = passwordInput.value;
    const { score, label } = evaluatePasswordStrength(val);

    // Reset indicator classes
    seg1.className = 'strength-segment';
    seg2.className = 'strength-segment';
    seg3.className = 'strength-segment';
    
    // Update label text and colors
    strengthLabel.textContent = label;
    strengthLabel.style.textShadow = '';

    if (label === 'EMPTY') {
      strengthLabel.style.color = 'var(--text-muted)';
    } else if (score <= 2) {
      strengthLabel.style.color = 'var(--neon-red)';
      strengthLabel.style.textShadow = '0 0 5px var(--neon-red)';
      seg1.classList.add('weak');
    } else if (score === 3) {
      strengthLabel.style.color = 'var(--neon-yellow)';
      strengthLabel.style.textShadow = '0 0 5px var(--neon-yellow)';
      seg1.classList.add('medium');
      seg2.classList.add('medium');
    } else if (score === 4) {
      strengthLabel.style.color = 'var(--neon-green)';
      strengthLabel.style.textShadow = '0 0 5px var(--neon-green)';
      seg1.classList.add('strong');
      seg2.classList.add('strong');
      seg3.classList.add('strong');
    }
  }

  passwordInput.addEventListener('input', updateStrengthMeter);

  // 4. Input Validations
  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  }

  function checkUsername() {
    const usernameVal = usernameInput.value.trim();
    if (!usernameVal) {
      showError(usernameGroup, usernameError, 'SYS_ERR: CALLSIGN_REQUIRED');
      return false;
    } else if (!/^[a-zA-Z0-9_]{3,15}$/.test(usernameVal)) {
      showError(usernameGroup, usernameError, 'SYS_ERR: ALPHANUMERIC_OR_UNDERSCORE_3-15_CHARS');
      return false;
    } else {
      clearError(usernameGroup, usernameError);
      return true;
    }
  }

  function checkEmail() {
    const emailVal = emailInput.value.trim();
    if (!emailVal) {
      showError(emailGroup, emailError, 'SYS_ERR: NEURAL_ADDRESS_REQUIRED');
      return false;
    } else if (!validateEmail(emailVal)) {
      showError(emailGroup, emailError, 'SYS_ERR: INVALID_ADDRESS_FORMAT');
      return false;
    } else {
      clearError(emailGroup, emailError);
      return true;
    }
  }

  function checkPassword() {
    const passwordVal = passwordInput.value;
    if (!passwordVal) {
      showError(passwordGroup, passwordError, 'SYS_ERR: DECRYPT_KEY_REQUIRED');
      return false;
    } else if (passwordVal.length < 8) {
      showError(passwordGroup, passwordError, 'SYS_ERR: KEY_MUST_BE_>=_8_CHARS');
      return false;
    } else {
      clearError(passwordGroup, passwordError);
      return true;
    }
  }

  function checkConfirmPassword() {
    const confirmVal = confirmPasswordInput.value;
    const passwordVal = passwordInput.value;
    
    if (!confirmVal) {
      showError(confirmPasswordGroup, confirmPasswordError, 'SYS_ERR: CONFIRM_KEY_REQUIRED');
      return false;
    } else if (confirmVal !== passwordVal) {
      showError(confirmPasswordGroup, confirmPasswordError, 'SYS_ERR: SECURITY_KEYS_MISMATCH');
      return false;
    } else {
      clearError(confirmPasswordGroup, confirmPasswordError);
      return true;
    }
  }

  function showError(groupElement, errorElement, message) {
    groupElement.classList.add('invalid');
    errorElement.textContent = message;
  }

  function clearError(groupElement, errorElement) {
    groupElement.classList.remove('invalid');
    errorElement.textContent = '';
  }

  // Bind live check listeners
  usernameInput.addEventListener('input', checkUsername);
  emailInput.addEventListener('input', checkEmail);
  passwordInput.addEventListener('input', () => {
    checkPassword();
    if (confirmPasswordInput.value) checkConfirmPassword();
  });
  confirmPasswordInput.addEventListener('input', checkConfirmPassword);

  // 5. Submit Registration Form
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Reset global errors
    globalErrorBox.classList.add('hidden');
    
    // Perform all validations
    const isUserValid = checkUsername();
    const isEmailValid = checkEmail();
    const isPassValid = checkPassword();
    const isConfirmValid = checkConfirmPassword();
    
    // Check Terms checkbox
    let isTermsValid = true;
    if (!termsCheckbox.checked) {
      isTermsValid = false;
      globalErrorMessage.textContent = 'SYS_ERR: YOU_MUST_AGREE_TO_TERMS_AND_CONDITIONS_TO_PROCEED';
      globalErrorBox.classList.remove('hidden');
    }

    if (!isUserValid || !isEmailValid || !isPassValid || !isConfirmValid || !isTermsValid) {
      // Shake Card animation on validation error
      registerCard.style.animation = 'shake-error 0.4s ease';
      setTimeout(() => { registerCard.style.animation = ''; }, 400);
      return;
    }

    // Success validation: Start loading step state
    createAccountBtn.disabled = true;
    
    const steps = [
      'ALLOCATING SECTOR...',
      'CREATING NEURAL PROTOCOL...',
      'SYNCING SYNAPSE KEY...',
      'ESTABLISHING PROFILE HUD...'
    ];
    
    let stepIndex = 0;
    createBtnText.textContent = steps[stepIndex];
    
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        createBtnText.textContent = steps[stepIndex];
      }
    }, 600);

    setTimeout(() => {
      clearInterval(interval);
      
      // Perform screen flash green animation
      const flash = document.createElement('div');
      flash.style.position = 'fixed';
      flash.style.inset = '0';
      flash.style.background = 'var(--neon-green)';
      flash.style.opacity = '0.7';
      flash.style.zIndex = '999';
      flash.style.pointerEvents = 'none';
      flash.style.transition = 'opacity 0.6s ease';
      document.body.appendChild(flash);
      
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 600);
      }, 100);

      // Log success and redirect to login page (index.html)
      createBtnText.textContent = 'PROFILE SYNCED!';
      
      // Store temporary message or simulate database injection success
      localStorage.setItem('neon_registration_success', 'true');
      localStorage.setItem('neon_pilot_email', emailInput.value.trim());

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
      
    }, 2500);
  });

  // 6. Interactive 3D tilt effect on the card
  const handleMouseMove = (e) => {
    if (window.innerWidth <= 1024) {
      registerCard.style.transform = '';
      return;
    }
    
    const cardRect = registerCard.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    
    const mouseX = e.clientX - cardCenterX;
    const mouseY = e.clientY - cardCenterY;
    
    const maxTilt = 8;
    const tiltX = (mouseY / (window.innerHeight / 2)) * -maxTilt;
    const tiltY = (mouseX / (window.innerWidth / 2)) * maxTilt;
    
    registerCard.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };

  const handleMouseLeave = () => {
    registerCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  };

  document.addEventListener('mousemove', handleMouseMove);
  registerCard.addEventListener('mouseleave', handleMouseLeave);
});
