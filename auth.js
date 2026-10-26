// ===== AUTH SYSTEM =====

// Registration
document.getElementById('registerForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const passConfirm = document.getElementById('regPassConfirm').value;
    const type = document.querySelector('input[name="accountType"]:checked').value;

    if (pass !== passConfirm) return alert('Passwords do not match!');
    if (pass.length < 6) return alert('Password must be at least 6 characters!');
    if (users.find(u => u.email === email)) return alert('Email already registered! Please sign in.');

    const user = {
        id: 'USR-' + Date.now().toString(36).toUpperCase(),
        name, email, password: pass, type,
        createdAt: new Date().toISOString()
    };
    users.push(user);
    DB.set('users', users);
    logActivity(`👤 New ${type} registered: ${name}`);

    // Show success message
    document.getElementById('registerForm').innerHTML = `
        <div class="confirmation">
            <span class="confirmation-icon">✅</span>
            <h3>Account Created Successfully!</h3>
            <p>Please sign in to continue.</p>
            <a href="signin.html" class="btn btn-primary" style="margin-top:1rem">Sign In</a>
        </div>
    `;
});

// Sign In
document.getElementById('signinForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('signinEmail').value.trim();
    const pass = document.getElementById('signinPass').value;

    const user = users.find(u => u.email === email && u.password === pass);
    if (!user) return alert('Invalid email or password!');

    currentUser = user;
    DB.set('currentUser', currentUser);
    logActivity(`🔐 ${user.name} signed in`);

    // Redirect based on account type
    if (user.type === 'volunteer') {
        window.location.href = 'volunteer.html';
    } else {
        window.location.href = 'dashboard.html';
    }
});

// Auto-redirect if already signed in
if (currentUser && (window.location.pathname.includes('signin.html') || window.location.pathname.includes('register.html'))) {
    if (currentUser.type === 'volunteer') {
        window.location.href = 'volunteer.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Sign Out function
window.signOut = function() {
    currentUser = null;
    DB.set('currentUser', null);
    window.location.href = 'index.html';
};