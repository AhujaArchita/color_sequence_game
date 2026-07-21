document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('emailInput');
  const emailGroup = document.getElementById('emailGroup');
  const emailError = document.getElementById('emailError');
  
  const passwordInput = document.getElementById('passwordInput');
  const passwordGroup = document.getElementById('passwordGroup');
  const passwordError = document.getElementById('passwordError');
  const passwordToggle = document.getElementById('passwordToggle');
  
  const rememberCheckbox = document.getElementById('rememberCheckbox');
  const signInBtn = document.getElementById('signInBtn');
  const signInBtnText = document.getElementById('signInBtnText');
  
  const globalErrorBox = document.getElementById('globalErrorBox');
  const globalErrorMessage = document.getElementById('globalErrorMessage');
  
  const successOverlay = document.getElementById('successOverlay');
  const successUsername = document.getElementById('successUsername');
  const continueToGameBtn = document.getElementById('continueToGameBtn');
  
  const loginCard = document.getElementById('loginCard');
  const appContainer = document.getElementById('appContainer');

  // Load Saved Email if Remember Me was selected or registration was successful
  const isRegistered = localStorage.getItem('neon_registration_success') === 'true';
  const savedEmail = localStorage.getItem('neon_pilot_email');
  if (savedEmail) {
    emailInput.value = savedEmail;
    rememberCheckbox.checked = true;
  }

  if (isRegistered) {
    globalErrorBox.classList.add('success');
    globalErrorBox.classList.remove('hidden');
    globalErrorMessage.textContent = 'SYS_MSG: PILOT CALLSIGN ALLOCATED SUCCESSFULLY! DECRYPT KEY TO SIGN IN.';
    // Update icon to checkmark
    globalErrorBox.querySelector('.error-icon').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    localStorage.removeItem('neon_registration_success');
  }

  // 1. Password Visibility Toggle
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    // Toggle Eye SVG Icon state
    passwordToggle.innerHTML = isPassword
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });

  // 2. Real-time / Live Form Validation
  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  }

  function checkEmail() {
    const emailVal = emailInput.value.trim();
    if (!emailVal) {
      showError(emailGroup, emailError, 'SYS_ERR: EMAIL_FIELD_REQUIRED');
      return false;
    } else if (!validateEmail(emailVal)) {
      showError(emailGroup, emailError, 'SYS_ERR: INVALID_NEURAL_ADDRESS_FORMAT');
      return false;
    } else {
      clearError(emailGroup, emailError);
      return true;
    }
  }

  function checkPassword() {
    const passwordVal = passwordInput.value;
    if (!passwordVal) {
      showError(passwordGroup, passwordError, 'SYS_ERR: ACCESS_KEY_REQUIRED');
      return false;
    } else if (passwordVal.length < 8) {
      showError(passwordGroup, passwordError, 'SYS_ERR: DECRYPT_KEY_MUST_BE_>=_8_CHARS');
      return false;
    } else {
      clearError(passwordGroup, passwordError);
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

  emailInput.addEventListener('input', checkEmail);
  passwordInput.addEventListener('input', checkPassword);

  // 3. Form Submission with Simulated Decryption Loading
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Trigger validation
    const isEmailValid = checkEmail();
    const isPasswordValid = checkPassword();
    
    // Hide global error box
    globalErrorBox.classList.add('hidden');
    globalErrorBox.classList.remove('success');
    // Restore default error icon
    globalErrorBox.querySelector('.error-icon').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    if (!isEmailValid || !isPasswordValid) {
      // Trigger a light haptic tilt animation on card for desktop
      loginCard.style.animation = 'shake-error 0.4s ease';
      setTimeout(() => { loginCard.style.animation = ''; }, 400);
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Start loading state
    signInBtn.disabled = true;
    
    // Simulated high-tech step phase messages
    const steps = [
      'ESTABLISHING UPLINK...',
      'INJECTING CREDENTIALS...',
      'DECRYPTING ACCESS KEYS...',
      'RESOLVING NEURAL SIGNATURE...'
    ];
    
    let stepIndex = 0;
    signInBtnText.textContent = steps[stepIndex];
    
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        signInBtnText.textContent = steps[stepIndex];
      }
    }, 600);

    setTimeout(() => {
      clearInterval(interval);
      
      // MOCK AUTHENTICATION CHECK
      // If email is 'error@neonsequence.net' or password is 'wrongpassword', simulate failure
      if (email === 'error@neonsequence.net' || password === '12345678') {
        signInBtn.disabled = false;
        signInBtnText.textContent = 'DECRYPT & SIGN IN';
        
        globalErrorMessage.textContent = 'ACCESS_DENIED: NEURAL_SIGNATURE_MISMATCH_OR_KEY_EXPIRED';
        globalErrorBox.classList.remove('hidden');
        
        // Shake animation
        loginCard.style.animation = 'shake-error 0.4s ease';
        setTimeout(() => { loginCard.style.animation = ''; }, 400);
      } else {
        // SUCCESS state
        // Save email if Remember Me checked
        if (rememberCheckbox.checked) {
          localStorage.setItem('neon_pilot_email', email);
        } else {
          localStorage.removeItem('neon_pilot_email');
        }

        // Custom transition success scan animation on body
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.inset = '0';
        flash.style.background = '#ffffff';
        flash.style.opacity = '0.7';
        flash.style.zIndex = '999';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.5s ease';
        document.body.appendChild(flash);
        
        setTimeout(() => {
          flash.style.opacity = '0';
          setTimeout(() => flash.remove(), 500);
        }, 100);

        // Customize username in the success overlay
        const pilotName = email.split('@')[0].toUpperCase();
        successUsername.textContent = `>>> DECRYPTING PROFILE: PILOT_${pilotName}_FOUND`;
        
        // Show success overlay
        successOverlay.classList.remove('hidden');
      }
    }, 2500);
  });

  // 4. Continue to Game Simulation Click
  continueToGameBtn.addEventListener('click', () => {
    // Add screen flash transition
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.inset = '0';
    flash.style.background = 'var(--neon-green)';
    flash.style.opacity = '0.9';
    flash.style.zIndex = '999';
    flash.style.pointerEvents = 'none';
    flash.style.transition = 'opacity 0.6s ease';
    document.body.appendChild(flash);

    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        flash.remove();
        window.location.href = 'game.html';
      }, 600);
    }, 200);
  });

  // 5. Interactive 3D tilt effect on the login card
  const handleMouseMove = (e) => {
    if (window.innerWidth <= 1024) {
      // Disable 3D tilt on smaller devices where layout is single column
      loginCard.style.transform = '';
      return;
    }
    
    const cardRect = loginCard.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    
    const mouseX = e.clientX - cardCenterX;
    const mouseY = e.clientY - cardCenterY;
    
    // Normalize and scale the tilt
    const maxTilt = 8; // Max tilt angle in degrees
    const tiltX = (mouseY / (window.innerHeight / 2)) * -maxTilt;
    const tiltY = (mouseX / (window.innerWidth / 2)) * maxTilt;
    
    loginCard.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };

  const handleMouseLeave = () => {
    loginCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  };

  document.addEventListener('mousemove', handleMouseMove);
  loginCard.addEventListener('mouseleave', handleMouseLeave);
});
