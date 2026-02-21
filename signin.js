document.addEventListener('DOMContentLoaded', () => {

    // ===== Auto Redirect if user is already logged in =====
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.role) {
        if (storedUser.role === 'admin') {
            window.location.href = '/admin.html'; // route admin في Laravel
        } else {
            window.location.href = '/'; // route index في Laravel
        }
        return;
    }

    // ===== Toggle Sign In / Sign Up Panels =====
    const signUpBtn = document.getElementById('signUpBtn');
    const signInBtn = document.getElementById('signInBtn');
    const container = document.querySelector('.container');

    signUpBtn.addEventListener('click', () => container.classList.add('right-panel-active'));
    signInBtn.addEventListener('click', () => container.classList.remove('right-panel-active'));

    // ===== Toggle Password Visibility =====
    const signupPassword = document.getElementById('signupPassword');
    const signupToggle = document.querySelector('.toggle-password');
    if (signupToggle) {
        signupToggle.addEventListener('click', () => {
            const type = signupPassword.type === 'password' ? 'text' : 'password';
            signupPassword.type = type;
            signupToggle.classList.toggle('fa-eye');
            signupToggle.classList.toggle('fa-eye-slash');
        });
    }

    // ===== Confirm Password Check =====
    const signupConfirm = document.getElementById('signupConfirmPassword');
    const matchIndicator = signupConfirm?.parentElement.querySelector('.match-indicator');
    if (signupConfirm) {
        signupConfirm.addEventListener('input', () => {
            if (!signupConfirm.value) {
                matchIndicator.textContent = '';
                return;
            }
            if (signupPassword.value === signupConfirm.value) {
                matchIndicator.textContent = '✅';
                matchIndicator.style.color = 'green';
            } else {
                matchIndicator.textContent = '❌';
                matchIndicator.style.color = 'red';
            }
        });
    }

    // ===== Forms =====
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');

    // ===== Sign In =====
    signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('signinEmail').value;
        const password = document.getElementById('signinPassword').value;

        if (!validateEmail(email) || password.length < 6) {
            showMessage('Please check your credentials', 'error');
            return;
        }

        const button = e.target.querySelector('.submit-btn');
        const originalText = button.textContent;
        button.innerHTML = '<div class="loading"></div>';
        button.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(`Welcome ${data.user.name}!`, 'success');

                // حفظ الـ token وبيانات المستخدم
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect حسب نوع المستخدم
                if (data.user.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/';
                }

            } else {
                showMessage(data.message || 'Invalid credentials', 'error');
            }

        } catch (err) {
            console.error(err);
            showMessage('Network error - check server or CORS', 'error');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    });

    // ===== Sign Up =====
    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = signupPassword.value;
        const confirmPassword = signupConfirm.value;

        if (name.length < 2) { showMessage('Name must be at least 2 characters', 'error'); return; }
        if (!validateEmail(email)) { showMessage('Please enter a valid email', 'error'); return; }
        if (password.length < 6) { showMessage('Password must be at least 6 characters', 'error'); return; }
        if (password !== confirmPassword) { showMessage('Passwords do not match', 'error'); return; }

        const button = e.target.querySelector('.submit-btn');
        const originalText = button.textContent;
        button.innerHTML = '<div class="loading"></div>';
        button.disabled = true;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Account created successfully! Redirecting...', 'success');

                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('access_token', data.user.access_token || ''); // لو رجع token

                if (data.user.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/';
                }

            } else {
                showMessage(data.message || 'Signup failed', 'error');
            }

        } catch (err) {
            console.error(err);
            showMessage('Network error - check server or CORS', 'error');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    });

    // ===== Helper Functions =====
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function showMessage(text, type) {
        const existing = document.querySelector('.message');
        if (existing) existing.remove();

        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: ${
                type === 'success' ? '#4CAF50' :
                type === 'error' ? '#f44336' :
                '#2196F3'
            };
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(msg);

        setTimeout(() => {
            msg.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => msg.remove(), 300);
        }, 3000);
    }

});