// ===== DASHBOARD PAGE =====
function updateDashboard() {
    if (!currentUser) {
        document.getElementById('dashNotLoggedIn').classList.remove('hidden');
        document.getElementById('dashLoggedIn').classList.add('hidden');
        return;
    }

    document.getElementById('dashNotLoggedIn').classList.add('hidden');
    document.getElementById('dashLoggedIn').classList.remove('hidden');
    document.getElementById('dashWelcome').innerHTML = `<h3>Welcome, ${currentUser.name}! 👋</h3><p>You're making a difference. Keep up the great work!</p>`;

    if (currentUser.type === 'volunteer') {
        document.getElementById('volDashTabs').classList.remove('hidden');
        document.getElementById('custDashTabs').classList.add('hidden');
        renderVolunteerDashboard();
    } else {
        document.getElementById('volDashTabs').classList.add('hidden');
        document.getElementById('custDashTabs').classList.remove('hidden');
        renderCustomerDashboard();
    }
}

// Dashboard Tabs
document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.dash-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

function renderVolunteerDashboard() {
    const vol = volunteers.find(v => v.email === currentUser.email);
    if (!vol) {
        document.getElementById('dashTasks').innerHTML = '<p class="empty-state">No tasks available.</p>';
        return;
    }

    // Available Tasks
    const openTasks = tasks.filter(t => t.status === 'open');
    document.getElementById('dashTasks').innerHTML = openTasks.length === 0 ? '<p class="empty-state">No tasks available right now.</p>' :
        openTasks.map(t => `
            <div class="task-card task-card-detail">
                <div class="task-info">
                    <h4>${PLANT_ICONS[t.plantType]||'🌱'} ${t.name}</h4>
                    <p>📍 ${t.area}${t.city ? ', '+t.city : ''} · 📅 ${t.date} · 👥 ${t.joined||0}/${t.maxVol}</p>
                    ${t.customerName ? `<p class="task-customer">👤 Requested by: ${t.customerName}</p>` : ''}
                    ${t.quantity ? `<p class="task-plants">🌱 Plants: ${t.quantity} ${t.plantType}${t.plantName ? ' ('+t.plantName+')' : ''}</p>` : ''}
                </div>
                <div class="task-actions">
                    <span class="task-status open">Open</span>
                    <a href="volunteer.html" class="btn btn-primary btn-sm">Apply</a>
                </div>
            </div>
        `).join('');

    // My Tasks
    const myTasks = tasks.filter(t => t.volunteers?.includes(vol.id));
    document.getElementById('dashMyTasks').innerHTML = myTasks.length === 0 ? '<p class="empty-state">No tasks joined yet.</p>' :
        myTasks.map(t => `<div class="task-card"><div class="task-info"><h4>${t.name}</h4><p>📍 ${t.area} · 📅 ${t.date}</p></div><div class="task-actions"><span class="task-status ${t.status==='completed'?'completed':'joined'}">${STATUS_LABELS[t.status]||t.status}</span></div></div>`).join('');

    // My Impact
    const completedCount = vol.tasksCompleted || 0;
    const areas = new Set(myTasks.map(t => t.area));
    document.getElementById('dashVolStats').innerHTML = `
        <div class="dash-stat-card"><span class="dash-stat-icon">✅</span><div><span class="dash-stat-num">${completedCount}</span><span class="dash-stat-label">Tasks Completed</span></div></div>
        <div class="dash-stat-card"><span class="dash-stat-icon">🌱</span><div><span class="dash-stat-num">${vol.plantsPlanted||0}</span><span class="dash-stat-label">Plants Contributed</span></div></div>
        <div class="dash-stat-card"><span class="dash-stat-icon">📍</span><div><span class="dash-stat-num">${areas.size}</span><span class="dash-stat-label">Areas Covered</span></div></div>
        <div class="dash-stat-card"><span class="dash-stat-icon">📜</span><div><span class="dash-stat-num">${(vol.certificates||0)}</span><span class="dash-stat-label">Certificates</span></div></div>
    `;

    // My Certificates
    const volCerts = certificates.filter(c => c.volId === vol.id);
    document.getElementById('dashCerts').innerHTML = volCerts.length === 0 ? '<p class="empty-state">No certificates yet. Complete and verify tasks to earn certificates!</p>' :
        volCerts.map(c => `<div class="task-card"><div class="task-info"><h4>🏆 ${c.taskName}</h4><p>📍 ${c.location} · 🌱 ${c.plants} plants · 📅 ${new Date(c.completedAt||c.issuedAt).toLocaleDateString()}</p></div><div class="task-actions"><a href="certificate.html?id=${c.id}" class="btn btn-primary btn-sm" target="_blank">View</a></div></div>`).join('');

    // Certificate Preview Images
    const certPreview = document.getElementById('dashCertsPreview');
    if (volCerts.length > 0) {
        certPreview.innerHTML = `<h4 style="color:var(--g800);margin:2rem 0 1rem">🖼️ Your Certificates</h4><div class="cert-image-grid"></div>`;
        const grid = certPreview.querySelector('.cert-image-grid');
        grid.innerHTML = volCerts.map(c => `
            <a href="certificate.html?id=${c.id}" target="_blank" class="cert-image-card">
                <div class="cert-img-frame"><div class="cert-img-inner">
                    <div class="cert-img-hdr"><span class="cert-img-tree">🌳</span><span class="cert-img-logo">🌱</span></div>
                    <div class="cert-img-org">ECO ROOTS</div>
                    <div class="cert-img-title">Certificate of Environmental Contribution</div>
                    <div class="cert-img-line"></div>
                    <div class="cert-img-awarded">This is to certify that</div>
                    <div class="cert-img-name">${c.volName}</div>
                    <div class="cert-img-msg">has successfully completed the plantation task</div>
                    <div class="cert-img-task">"${c.taskName}"</div>
                    <div class="cert-img-stats"><span>🌱 ${c.plants} Plants</span><span>📍 ${c.location}</span><span>📅 ${new Date(c.completedAt||c.issuedAt).toLocaleDateString()}</span></div>
                    <div class="cert-img-line"></div>
                    <div class="cert-img-sigs"><div class="cert-img-sig"><div class="cert-img-sigline"></div><small>Admin</small></div><div class="cert-img-seal">✅</div><div class="cert-img-sig"><div class="cert-img-sigline"></div><small>Platform</small></div></div>
                    <div class="cert-img-id">ID: ${c.id}</div>
                </div></div>
                <div class="cert-img-overlay"><span class="cert-img-view-btn">👁 Click to View</span></div>
            </a>
        `).join('');
    } else {
        certPreview.innerHTML = '';
    }

    // Profile
    document.getElementById('dashVolProfile').innerHTML = `
        <div class="vol-profile-card">
            <div class="profile-info">
                <p><strong>Name:</strong> ${vol.name}</p>
                <p><strong>Email:</strong> ${vol.email}</p>
                <p><strong>Age:</strong> ${vol.age}</p>
                <p><strong>City:</strong> ${vol.city}</p>
                <p><strong>Joined:</strong> ${new Date(vol.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

function renderCustomerDashboard() {
    // My Requests
    const myReqs = requests.filter(r => r.email === currentUser.email);
    document.getElementById('dashMyRequests').innerHTML = myReqs.length === 0 ? '<p class="empty-state">No requests yet. <a href="request.html">Submit one now!</a></p>' :
        myReqs.map(r => `<div class="task-card"><div class="task-info"><h4>${r.id}</h4><p>🌱 ${r.plantType} · 📍 ${r.area}, ${r.city} · 📅 ${r.date}</p></div><div class="task-actions"><span class="task-status status-${r.status}">${STATUS_LABELS[r.status]}</span></div></div>`).join('');

    // Request Status
    document.getElementById('dashRequestStatus').innerHTML = myReqs.length === 0 ? '<p class="empty-state">No requests yet.</p>' :
        myReqs.slice(-5).reverse().map(r => {
            const idx = STATUS_FLOW.indexOf(r.status);
            return `<div class="dash-status-item"><div class="dash-status-header"><strong>${r.id}</strong> <span class="status-badge status-${r.status}">${STATUS_LABELS[r.status]}</span></div><div class="dash-progress-steps">${STATUS_FLOW.map((s, i) => `<div class="mini-step ${i < idx ? 'done' : i === idx ? 'current' : ''}">${STATUS_LABELS[s]}</div>`).join('')}</div></div>`;
        }).join('');

    // Profile
    document.getElementById('dashCustProfile').innerHTML = `
        <div class="vol-profile-card">
            <div class="profile-info">
                <p><strong>Name:</strong> ${currentUser.name}</p>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Account Type:</strong> Customer</p>
                <p><strong>Member Since:</strong> ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', updateDashboard);