// ===== VOLUNTEER PAGE =====
const volunteerForm = document.getElementById('volunteerForm');
const volunteerFormSection = document.getElementById('volunteerFormSection');
const volunteerDashboard = document.getElementById('volunteerDashboard');
let activeVolunteer = DB.get('activeVolunteer', null);

document.getElementById('volAge')?.addEventListener('input', function() {
    document.getElementById('parentConsentSection').classList.toggle('hidden', parseInt(this.value) >= 18);
});

if (activeVolunteer) {
    const vol = volunteers.find(x => x.id === activeVolunteer);
    if (vol) showVolunteerDashboard();
    else { DB.set('activeVolunteer', null); activeVolunteer = null; }
}

volunteerForm?.addEventListener('submit', e => {
    e.preventDefault();
    const age = parseInt(v('volAge'));
    if (age < 14) return alert('Volunteers must be 14 or older.');
    if (age < 18) {
        if (!document.getElementById('parentConsent').checked) return alert('Parent consent required.');
        if (!v('parentName') || !v('parentPhone')) return alert('Parent info required.');
    }
    if (!document.getElementById('volTerms').checked) return alert('You must agree to guidelines.');

    const skills = Array.from(document.querySelectorAll('input[name="volSkills"]:checked')).map(c => c.value);
    const vol = {
        id: 'VOL-' + Date.now().toString(36).toUpperCase(),
        name: v('volName'), age,
        email: v('volEmail'), phone: v('volPhone'),
        city: v('volCity'), area: v('volArea'),
        availability: v('volAvailability'),
        skills: skills,
        experience: v('volExperience'),
        interests: v('volInterests'),
        motivation: v('volMotivation'),
        parentName: age < 18 ? v('parentName') : null,
        parentPhone: age < 18 ? v('parentPhone') : null,
        status: 'pending',
        tasksJoined: 0, tasksCompleted: 0, plantsPlanted: 0, hours: 0,
        certificates: 0, badges: [],
        createdAt: new Date().toISOString()
    };
    volunteers.push(vol); DB.set('volunteers', volunteers);
    activeVolunteer = vol.id; DB.set('activeVolunteer', activeVolunteer);
    logActivity(`🌿 New volunteer registered: ${vol.name} (${vol.city})`);
    volunteerForm.reset();
    document.getElementById('parentConsentSection').classList.add('hidden');
    document.getElementById('volunteerFormSection').classList.add('hidden');
    document.getElementById('regSuccess').classList.remove('hidden');
    document.getElementById('newVolId').textContent = vol.id;
});

function showVolunteerDashboard() {
    const vol = volunteers.find(x => x.id === activeVolunteer);
    if (!vol) return;

    volunteerFormSection.classList.add('hidden');
    const regSection = document.getElementById('volunteerRegSection');
    if (regSection) regSection.classList.add('hidden');
    volunteerDashboard.classList.remove('hidden');

    document.getElementById('volDisplayName').textContent = vol.name;
    document.getElementById('volAvatar').textContent = vol.age >= 18 ? '🌿' : '🌱';

    // Status badge
    const statusBadge = document.getElementById('volStatusBadge');
    statusBadge.textContent = STATUS_LABELS[vol.status] || vol.status;
    statusBadge.className = `status-badge status-${vol.status}`;

    // Level badge
    const completedCount = vol.tasksCompleted || 0;
    let levelName = 'New Volunteer';
    if (completedCount >= 50) levelName = '🌍 Environmental Champion';
    else if (completedCount >= 25) levelName = '🏆 25 Tasks';
    else if (completedCount >= 10) levelName = '🌳 10 Tasks';
    else if (completedCount >= 5) levelName = '🌿 5 Tasks';
    else if (completedCount >= 1) levelName = '🌱 First Plantation';
    document.getElementById('volBadge').textContent = levelName;

    // Stats
    const stats = getVolunteerStats(activeVolunteer);
    if (stats) {
        document.getElementById('volStatTotal').textContent = stats.totalJoined;
        document.getElementById('volStatCompleted').textContent = stats.completed;
        document.getElementById('volStatPending').textContent = stats.pending;
        document.getElementById('volStatPlants').textContent = stats.plantsPlanted;
        document.getElementById('volStatCerts').textContent = stats.certificates;
        document.getElementById('volStatAreas').textContent = stats.areasCovered;
    }

    renderAvailableTasks();
    renderMyTasks();
    renderVolImpact(vol);
    renderVolCerts(vol);
    renderVolProfile(vol);
}

document.getElementById('volLogoutBtn')?.addEventListener('click', () => {
    activeVolunteer = null; DB.set('activeVolunteer', null);
    volunteerDashboard.classList.add('hidden');
    document.getElementById('volunteerFormSection').classList.remove('hidden');
    const regSection = document.getElementById('volunteerRegSection');
    if (regSection) regSection.classList.remove('hidden');
});

// Tab switching
document.querySelectorAll('.vol-tab-enhanced').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.vol-tab-enhanced').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.vol-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('vtab-' + tab.dataset.tab).classList.add('active');
    });
});

// ===== RENDER AVAILABLE TASKS =====
function renderAvailableTasks() {
    const c = document.getElementById('availableTasks');
    const open = tasks.filter(t => t.status === 'open' || t.status === 'approved' || t.status === 'assigned');
    if (open.length === 0) {
        c.innerHTML = '<div class="empty-enhanced"><div class="empty-icon">📋</div><h4>No Available Tasks</h4><p>Check back later for new plantation opportunities!</p></div>';
        return;
    }
    c.innerHTML = open.map(t => `
        <div class="task-card-full">
            <div class="task-header">
                <div>
                    <div class="task-title">${PLANT_ICONS[t.plantType]||'🌱'} ${t.name}</div>
                    <span class="status-badge status-${t.status}">${STATUS_LABELS[t.status]||t.status}</span>
                </div>
                <div style="text-align:right">
                    <small style="color:var(--g600)">${t.joined||0}/${t.maxVol||10} volunteers</small>
                </div>
            </div>
            <div class="task-meta">
                <span>📍 ${t.area}${t.city ? ', '+t.city : ''}</span>
                <span>📅 ${t.date}</span>
                <span>🌱 ${t.quantity||t.plantsPerVol||0} plants</span>
                ${t.plantName ? `<span>🌿 ${t.plantName}</span>` : ''}
                ${t.estimatedHours ? `<span>⏱ ${t.estimatedHours} hours</span>` : ''}
            </div>
            ${t.customerName ? `<div style="font-size:.85rem;color:var(--g700);margin:.5rem 0">👤 Requested by: <strong>${t.customerName}</strong></div>` : ''}
            ${t.details ? `<p style="color:var(--g600);font-size:.85rem;margin:.5rem 0">${t.details.substring(0,120)}${t.details.length>120?'...':''}</p>` : ''}
            <div class="task-actions">
                <button class="btn btn-outline btn-sm" onclick="viewTask('${t.id}')">👁 View Details</button>
                <button class="btn btn-primary btn-sm" onclick="joinTask('${t.id}')">🤝 Join Task</button>
            </div>
        </div>
    `).join('');
}

// ===== RENDER MY TASKS =====
function renderMyTasks() {
    const c = document.getElementById('myTasks');
    const mine = getVolunteerTasks(activeVolunteer);
    if (mine.length === 0) {
        c.innerHTML = '<div class="empty-enhanced"><div class="empty-icon">🌳</div><h4>No Tasks Yet</h4><p>Join available tasks or wait for admin assignment.</p></div>';
        return;
    }
    c.innerHTML = mine.map(t => {
        const isAssigned = t.assignedTo === activeVolunteer;
        const hasJoined = (t.volunteers||[]).includes(activeVolunteer);
        let actions = '';
        let progressHtml = '';

        if ((t.status === 'open' || t.status === 'approved') && hasJoined) {
            actions = `
                <button class="btn btn-outline btn-sm" onclick="leaveTask('${t.id}')">Leave</button>
                <button class="btn btn-primary btn-sm" onclick="startTaskProgress('${t.id}')">📊 Update Progress</button>
            `;
        } else if (t.status === 'assigned' && isAssigned) {
            actions = `
                <button class="btn btn-primary btn-sm" onclick="startTaskProgress('${t.id}')">📊 Update Progress</button>
            `;
        } else if (t.status === 'in_progress') {
            progressHtml = `<div class="task-progress-bar"><div class="task-progress-fill" style="width:50%"></div></div><small style="color:var(--g600)">In progress - update when done</small>`;
            actions = `
                <button class="btn btn-primary btn-sm" onclick="startTaskProgress('${t.id}')">📊 Update Progress</button>
            `;
        } else if (t.status === 'submitted_for_review') {
            progressHtml = `<div style="font-size:.85rem;color:var(--g600);margin:.5rem 0">⏳ Submitted for admin verification...</div>`;
        } else if (t.status === 'completed') {
            const cert = certificates.find(x => x.taskId === t.id && x.volId === activeVolunteer);
            if (cert) {
                actions = `<a href="certificate.html?id=${cert.id}" class="btn btn-primary btn-sm" target="_blank">🏆 View Certificate</a>`;
            } else {
                actions = `<span style="font-size:.8rem;color:var(--g600)">✅ Completed - awaiting certificate</span>`;
            }
        }

        const statusClass = t.status === 'completed' ? 'completed' :
                           t.status === 'submitted_for_review' ? 'pending' :
                           t.status === 'in_progress' ? 'active' :
                           t.status === 'assigned' ? 'assigned' : 'open';

        return `
            <div class="task-card-full">
                <div class="task-header">
                    <div>
                        <div class="task-title">${PLANT_ICONS[t.plantType]||'🌱'} ${t.name}</div>
                        <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin-top:.25rem">
                            <span class="status-badge status-${statusClass}">${STATUS_LABELS[t.status]||t.status}</span>
                            ${isAssigned ? '<span style="font-size:.7rem;color:var(--g600)">📌 Assigned to you</span>' : ''}
                            ${hasJoined && !isAssigned ? '<span style="font-size:.7rem;color:var(--g600)">🤝 You joined</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="task-meta">
                    <span>📍 ${t.area}${t.city ? ', '+t.city : ''}</span>
                    <span>📅 ${t.date}${t.time ? ' at '+t.time : ''}</span>
                    <span>🌱 ${t.quantity||t.plantsPerVol||0} plants</span>
                    ${t.plantName ? `<span>🌿 ${t.plantName}</span>` : ''}
                </div>
                ${progressHtml}
                ${t.progressNotes ? `<div style="font-size:.85rem;color:var(--g700);background:var(--g50);padding:.6rem;border-radius:8px;margin:.5rem 0"><strong>Notes:</strong> ${t.progressNotes}</div>` : ''}
                <div class="task-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewTask('${t.id}')">👁 Details</button>
                    ${actions}
                </div>
            </div>
        `;
    }).join('');
}

// ===== RENDER IMPACT =====
function renderVolImpact(vol) {
    const stats = getVolunteerStats(activeVolunteer);
    if (!stats) return;

    document.getElementById('volImpactCards').innerHTML = `
        <div class="impact-tile"><span class="big-icon">🌱</span><span class="big-num">${stats.plantsPlanted}</span><span class="big-label">Total Plants Planted</span></div>
        <div class="impact-tile"><span class="big-icon">✅</span><span class="big-num">${stats.completed}</span><span class="big-label">Tasks Completed</span></div>
        <div class="impact-tile"><span class="big-icon">📋</span><span class="big-num">${stats.totalJoined}</span><span class="big-label">Total Tasks Joined</span></div>
        <div class="impact-tile"><span class="big-icon">🏆</span><span class="big-num">${stats.certificates}</span><span class="big-label">Certificates Earned</span></div>
        <div class="impact-tile"><span class="big-icon">📍</span><span class="big-num">${stats.areasCovered}</span><span class="big-label">Areas Covered</span></div>
        <div class="impact-tile"><span class="big-icon">⏱</span><span class="big-num">${stats.hours}</span><span class="big-label">Hours Contributed</span></div>
        <div class="impact-tile"><span class="big-icon">🌳</span><span class="big-num">${Math.round(stats.plantsPlanted * 22)}</span><span class="big-label">kg CO₂ Absorbed/Year</span></div>
        <div class="impact-tile"><span class="big-icon">💧</span><span class="big-num">${Math.round(stats.plantsPlanted * 10)}</span><span class="big-label">Litres Water Saved/Year</span></div>
    `;

    // Badges
    const badges = [];
    const completed = stats.completed;
    if (completed >= 1) badges.push({ icon: '🌱', name: 'First Plantation', desc: 'Complete your first task' });
    if (completed >= 5) badges.push({ icon: '🌿', name: '5 Completed Tasks', desc: 'Great dedication!' });
    if (completed >= 10) badges.push({ icon: '🌳', name: '10 Completed Tasks', desc: 'Keep growing!' });
    if (completed >= 25) badges.push({ icon: '🏆', name: '25 Completed Tasks', desc: 'Outstanding contribution' });
    if (completed >= 50) badges.push({ icon: '🌍', name: 'Environmental Champion', desc: 'True hero of nature' });
    if (stats.plantsPlanted >= 50) badges.push({ icon: '🌻', name: '50+ Plants', desc: 'Master planter' });
    if (stats.plantsPlanted >= 100) badges.push({ icon: '🌳', name: '100+ Plants', desc: 'Forest builder' });
    if (stats.certificates >= 5) badges.push({ icon: '📜', name: 'Certified Volunteer', desc: '5 certificates earned' });

    document.getElementById('volAchievements').innerHTML = badges.length === 0
        ? '<p style="color:var(--g600);font-size:.9rem">Complete verified tasks to earn badges!</p>'
        : badges.map(b => `<div class="achievement"><span class="achievement-icon">${b.icon}</span><span class="achievement-name">${b.name}</span><small style="color:var(--g600);display:block;font-size:.7rem">${b.desc}</small></div>`).join('');

    // Contribution History
    const history = stats.myTasks.filter(isTaskDone).slice(-5).reverse();
    document.getElementById('volContributionHistory').innerHTML = history.length === 0
        ? '<p style="color:var(--g600);font-size:.9rem">No completed tasks yet.</p>'
        : history.map(t => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:.75rem;background:var(--g50);border-radius:8px;margin-bottom:.5rem;border:1px solid var(--g100)">
                <div>
                    <strong style="color:var(--g800);font-size:.9rem">${t.name}</strong>
                    <div style="font-size:.8rem;color:var(--g600)">📍 ${t.area} · 📅 ${t.date}</div>
                </div>
                <span class="status-badge status-completed">✅ Completed</span>
            </div>
        `).join('');
}

// ===== RENDER CERTIFICATES =====
function renderVolCerts(vol) {
    const stats = getVolunteerStats(activeVolunteer);
    if (!stats) return;
    const volCerts = stats.certs;

    const list = document.getElementById('volCertsList');
    if (volCerts.length === 0) {
        list.innerHTML = '<div class="empty-enhanced"><div class="empty-icon">🏆</div><h4>No Certificates Yet</h4><p>Complete and verify tasks to earn certificates!</p></div>';
    } else {
        list.innerHTML = `<div class="cert-list-grid">${volCerts.map(c => `
            <div class="cert-list-card">
                <div class="cert-list-info">
                    <h4>🏆 ${c.taskName}</h4>
                    <p>📍 ${c.location} · 🌱 ${c.plants} plants</p>
                    <p>📅 ${new Date(c.completedAt || c.issuedAt).toLocaleDateString()} · <small>${c.id}</small></p>
                </div>
                <div style="display:flex;flex-direction:column;gap:.5rem">
                    <span class="status-badge status-${c.status}">${STATUS_LABELS[c.status] || c.status}</span>
                    <a href="certificate.html?id=${c.id}" class="btn btn-primary btn-sm" target="_blank">👁 View</a>
                </div>
            </div>
        `).join('')}</div>`;
    }

    // Achievement Levels
    const completedCount = stats.completed;
    const levels = [
        { icon: '🌱', name: 'First Plantation', req: 1, desc: 'Complete your first task' },
        { icon: '🌿', name: '5 Completed Tasks', req: 5, desc: 'Complete 5 tasks' },
        { icon: '🌳', name: '10 Completed Tasks', req: 10, desc: 'Complete 10 tasks' },
        { icon: '🏆', name: '25 Completed Tasks', req: 25, desc: 'Complete 25 tasks' },
        { icon: '🌍', name: 'Environmental Champion', req: 50, desc: 'Complete 50 tasks' },
    ];
    document.getElementById('volAchievementLevels').innerHTML = levels.map(l => {
        const unlocked = completedCount >= l.req;
        const progress = Math.min(100, Math.round((completedCount / l.req) * 100));
        return `<div class="achievement-level ${unlocked ? 'unlocked' : ''}">
            <div class="alc-icon">${l.icon}</div>
            <div class="alc-info">
                <h5>${l.name}</h5>
                <p>${l.desc}</p>
                <div class="progress-bar" style="height:6px;margin-top:.5rem">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>
                <small>${completedCount}/${l.req}</small>
            </div>
            <div class="alc-status">${unlocked ? '✅' : '🔒'}</div>
        </div>`;
    }).join('');
}

// ===== RENDER PROFILE =====
function renderVolProfile(vol) {
    const stats = getVolunteerStats(activeVolunteer);
    if (!stats) return;

    document.getElementById('volProfileCard').innerHTML = `
        <div class="vol-profile-header">
            <div class="vol-avatar-large">${vol.age >= 18 ? '🌿' : '🌱'}</div>
            <div>
                <h3 style="color:var(--g800);margin-bottom:.25rem">${vol.name}</h3>
                <span class="status-badge status-${vol.status}">${STATUS_LABELS[vol.status]||vol.status}</span>
                <span class="vol-badge" style="margin-left:.5rem">${stats.completed >= 50 ? '🌍 Champion' : stats.completed >= 10 ? '🌳 10+ Tasks' : stats.completed >= 1 ? '🌱 Active' : 'New Volunteer'}</span>
            </div>
        </div>
        <div class="vol-profile-details">
            <div class="vol-detail-item"><div class="label">Email</div><div class="value">${vol.email}</div></div>
            <div class="vol-detail-item"><div class="label">Phone</div><div class="value">${vol.phone}</div></div>
            <div class="vol-detail-item"><div class="label">City</div><div class="value">${vol.city}</div></div>
            <div class="vol-detail-item"><div class="label">Area</div><div class="value">${vol.area || '-'}</div></div>
            <div class="vol-detail-item"><div class="label">Age</div><div class="value">${vol.age}</div></div>
            <div class="vol-detail-item"><div class="label">Availability</div><div class="value">${(vol.availability||'').replace('_',' ')}</div></div>
            <div class="vol-detail-item"><div class="label">Experience</div><div class="value">${(vol.experience||'').replace('_',' ')}</div></div>
            <div class="vol-detail-item"><div class="label">Volunteer ID</div><div class="value">${vol.id}</div></div>
            <div class="vol-detail-item"><div class="label">Joined</div><div class="value">${new Date(vol.createdAt).toLocaleDateString()}</div></div>
        </div>
        ${(vol.skills && vol.skills.length > 0) ? `
            <div style="margin-top:1rem">
                <div class="label" style="font-size:.7rem;color:var(--g600);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.5rem">Skills</div>
                <div style="display:flex;flex-wrap:wrap;gap:.4rem">
                    ${vol.skills.map(s => `<span class="status-badge status-approved" style="font-size:.7rem">${s.replace('_',' ')}</span>`).join('')}
                </div>
            </div>
        ` : ''}
        ${vol.interests ? `<div style="margin-top:1rem"><div class="label" style="font-size:.7rem;color:var(--g600);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.25rem">Interests</div><p style="color:var(--g700);font-size:.9rem">${vol.interests}</p></div>` : ''}
        ${vol.motivation ? `<div style="margin-top:1rem"><div class="label" style="font-size:.7rem;color:var(--g600);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.25rem">Motivation</div><p style="color:var(--g700);font-size:.9rem">${vol.motivation}</p></div>` : ''}
        <div class="vol-stats-grid" style="margin-top:1.5rem">
            <div class="vol-stat-tile"><span class="num">${stats.totalJoined}</span><span class="label">Tasks Joined</span></div>
            <div class="vol-stat-tile"><span class="num">${stats.completed}</span><span class="label">Completed</span></div>
            <div class="vol-stat-tile"><span class="num">${stats.plantsPlanted}</span><span class="label">Plants</span></div>
            <div class="vol-stat-tile"><span class="num">${stats.certificates}</span><span class="label">Certificates</span></div>
        </div>
    `;
}

// ===== TASK DETAIL MODAL =====
window.viewTask = function(id) {
    const t = tasks.find(x => x.id === id); if (!t) return;
    const modal = document.getElementById('taskDetailModal');
    const body = document.getElementById('taskDetailBody');
    const isAssigned = t.assignedTo === activeVolunteer;
    const hasJoined = (t.volunteers||[]).includes(activeVolunteer);

    body.innerHTML = `
        <div class="task-detail-content">
            <h3>${PLANT_ICONS[t.plantType]||'🌱'} ${t.name}</h3>
            <div class="task-detail-grid">
                <div class="task-detail-item"><span class="td-label">📍 Location</span><span class="td-value">${t.area}${t.city ? ', '+t.city : ''}</span></div>
                ${t.location ? `<div class="task-detail-item"><span class="td-label">📌 Address</span><span class="td-value">${t.location}</span></div>` : ''}
                <div class="task-detail-item"><span class="td-label">📅 Date</span><span class="td-value">${t.date}${t.time ? ' at '+t.time : ''}</span></div>
                <div class="task-detail-item"><span class="td-label">🌱 Plant Type</span><span class="td-value">${t.plantType}${t.plantName ? ' ('+t.plantName+')' : ''}</span></div>
                <div class="task-detail-item"><span class="td-label">🔢 Quantity</span><span class="td-value">${t.quantity||t.plantsPerVol||0} plants</span></div>
                <div class="task-detail-item"><span class="td-label">👥 Volunteers</span><span class="td-value">${t.joined||0} / ${t.maxVol||10}</span></div>
                ${t.estimatedHours ? `<div class="task-detail-item"><span class="td-label">⏱ Estimated Hours</span><span class="td-value">${t.estimatedHours} hours</span></div>` : ''}
                <div class="task-detail-item"><span class="td-label">📊 Status</span><span class="td-value"><span class="status-badge status-${t.status}">${STATUS_LABELS[t.status]||t.status}</span></span></div>
            </div>
            ${t.customerName ? `
                <div class="task-detail-section">
                    <h4>👤 Customer Details</h4>
                    <p><strong>Name:</strong> ${t.customerName}</p>
                    ${t.customerPhone ? `<p><strong>Phone:</strong> ${t.customerPhone}</p>` : ''}
                    ${t.customerEmail ? `<p><strong>Email:</strong> ${t.customerEmail}</p>` : ''}
                </div>
            ` : ''}
            ${t.reason ? `<div class="task-detail-section"><h4>📝 Reason</h4><p>${t.reason}</p></div>` : ''}
            ${t.details ? `<div class="task-detail-section"><h4>📋 Description</h4><p>${t.details}</p></div>` : ''}
            ${t.progressNotes ? `<div class="task-detail-section"><h4>📊 Progress Notes</h4><p>${t.progressNotes}</p></div>` : ''}
            ${t.requestId ? `<p class="task-detail-ref">Reference: ${t.requestId}</p>` : ''}
            <div class="task-detail-actions">
                ${!hasJoined && !isAssigned && (t.status === 'open' || t.status === 'approved' || t.status === 'assigned') ?
                    `<button class="btn btn-primary" onclick="joinTask('${t.id}');closeTaskModal()">🤝 Join Task</button>` : ''}
                ${isAssigned || hasJoined ?
                    `<button class="btn btn-primary" onclick="startTaskProgress('${t.id}');closeTaskModal()">📊 Update Progress</button>` : ''}
                <button class="btn btn-outline" onclick="closeTaskModal()">Close</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.closeTaskModal = function() {
    document.getElementById('taskDetailModal').classList.add('hidden');
};

// ===== JOIN / LEAVE TASK =====
window.joinTask = function(id) {
    const t = tasks.find(x => x.id === id); if (!t) return;
    if (!t.volunteers) t.volunteers = [];
    if (t.volunteers.includes(activeVolunteer) || t.assignedTo === activeVolunteer) return alert('Already joined or assigned.');
    t.volunteers.push(activeVolunteer); t.joined = t.volunteers.length;
    if (t.joined >= (t.maxVol||10) && (t.status === 'open' || t.status === 'approved')) t.status = 'full';
    DB.set('tasks', tasks);
    const vol = volunteers.find(x => x.id === activeVolunteer);
    if (vol) { vol.tasksJoined = (vol.tasksJoined||0) + 1; DB.set('volunteers', volunteers); }
    logActivity(`📋 ${vol?.name || 'Volunteer'} joined task: ${t.name}`);
    showVolunteerDashboard();
    alert('You joined the task! Check "My Tasks" for updates.');
};

window.leaveTask = function(id) {
    const t = tasks.find(x => x.id === id); if (!t) return;
    t.volunteers = (t.volunteers || []).filter(x => x !== activeVolunteer);
    t.joined = t.volunteers.length;
    if (t.status === 'full') t.status = 'open';
    DB.set('tasks', tasks);
    const vol = volunteers.find(x => x.id === activeVolunteer);
    if (vol && vol.tasksJoined > 0) { vol.tasksJoined--; DB.set('volunteers', volunteers); }
    showVolunteerDashboard();
};

// ===== TASK PROGRESS =====
window.startTaskProgress = function(id) {
    const t = tasks.find(x => x.id === id); if (!t) return;
    document.getElementById('progressTaskId').value = id;
    document.getElementById('progressStatus').value = t.status === 'in_progress' ? 'in_progress' : 'in_progress';
    document.getElementById('progressPlants').value = t.quantity || t.plantsPerVol || '';
    document.getElementById('progressHours').value = t.estimatedHours || '';
    document.getElementById('progressNotes').value = t.progressNotes || '';
    document.getElementById('progressLocation').value = t.location || '';
    document.getElementById('taskProgressModal').classList.remove('hidden');
};

window.closeProgressModal = function() {
    document.getElementById('taskProgressModal').classList.add('hidden');
};

document.getElementById('taskProgressForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('progressTaskId').value;
    const t = tasks.find(x => x.id === id); if (!t) return;

    t.status = v('progressStatus');
    if (v('progressPlants')) t.quantity = parseInt(v('progressPlants'));
    if (v('progressHours')) t.estimatedHours = parseInt(v('progressHours'));
    t.progressNotes = v('progressNotes');
    if (v('progressLocation')) t.location = v('progressLocation');
    t.updatedAt = new Date().toISOString();

    DB.set('tasks', tasks);
    logActivity(`📊 Task progress updated: ${t.name} → ${STATUS_LABELS[t.status]||t.status}`);
    document.getElementById('taskProgressForm').reset();
    document.getElementById('taskProgressModal').classList.add('hidden');
    showVolunteerDashboard();
});
