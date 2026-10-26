// ===== ADMIN BOX =====
const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');

document.getElementById('adminLoginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    if (v('adminPass') === '0707') {
        adminLogin.classList.add('hidden'); adminDashboard.classList.remove('hidden');
        renderAdminAll(); startClock();
    } else { alert('Invalid credentials.'); }
});

document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    adminDashboard.classList.add('hidden'); adminLogin.classList.remove('hidden'); stopClock();
});

let clockInterval;
function startClock() {
    function tick() { document.getElementById('adminTime').textContent = new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    tick(); clockInterval = setInterval(tick, 1000);
}
function stopClock() { clearInterval(clockInterval); }

// Tab switching
document.querySelectorAll('.admin-box-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-box-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-box-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('abox-' + tab.dataset.tab).classList.add('active');
    });
});

function renderAdminAll() {
    renderOverview(); renderAdminVolunteers(); renderAdminTasks();
    renderAdminRequests(); renderStatistics(); renderAdminCerts();
    renderAdminCare(); renderReports(); renderCompleteRecords();
    renderCustomers(); renderPlants(); renderActivity();
}
document.getElementById('admSearchRecords')?.addEventListener('input', renderCompleteRecords);
document.getElementById('admFilterRecType')?.addEventListener('change', renderCompleteRecords);
['admFilterRecCustomer', 'admFilterRecVol', 'admFilterRecCity', 'admFilterRecStatus', 'admDateFrom', 'admDateTo'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', renderCompleteRecords);
});
document.getElementById('admClearFilters')?.addEventListener('click', () => {
    ['admSearchRecords'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
    ['admFilterRecCustomer', 'admFilterRecVol', 'admFilterRecCity', 'admFilterRecStatus'].forEach(id => { const e = document.getElementById(id); if (e) e.value = 'all'; });
    ['admDateFrom', 'admDateTo'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
    const t = document.getElementById('admFilterRecType'); if (t) t.value = 'all';
    renderCompleteRecords();
});
document.getElementById('admSearchCust')?.addEventListener('input', renderCustomers);
document.getElementById('admFilterCustStatus')?.addEventListener('change', renderCustomers);
document.getElementById('admFilterCustCity')?.addEventListener('change', renderCustomers);
document.getElementById('admExportCust')?.addEventListener('click', exportCustomers);
document.getElementById('admSearchAct')?.addEventListener('input', renderActivity);
document.getElementById('admFilterActType')?.addEventListener('change', renderActivity);
document.getElementById('admFilterActPerson')?.addEventListener('change', renderActivity);
document.getElementById('admActFrom')?.addEventListener('change', renderActivity);
document.getElementById('admActTo')?.addEventListener('change', renderActivity);
document.getElementById('admExportAct')?.addEventListener('click', exportActivity);

// ===== OVERVIEW =====
function renderOverview() {
    const s = getAdminStats();
    document.getElementById('ovTotalVols').textContent = s.totalVols;
    document.getElementById('ovActiveVols').textContent = s.activeVols;
    document.getElementById('ovPendingVols').textContent = s.pendingVols;
    document.getElementById('ovTotalTasks').textContent = s.totalTasks;
    document.getElementById('ovCompletedTasks').textContent = s.completedTasks;
    document.getElementById('ovTotalPlants').textContent = s.totalPlants;
    document.getElementById('ovTotalCerts').textContent = s.totalCerts;
    document.getElementById('ovTotalRequests').textContent = requests.length;
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set('ovTotalCustomers', s.totalCustomers);
    set('ovTotalUsers', s.totalUsers);
    set('ovPendingReq', s.reqPending);
    set('ovApprovedReq', s.reqApproved);
    set('ovRejectedReq', s.reqRejected);
    set('ovOpenTasks', s.availableTasks);
    set('ovPendingVerify', s.pendingVerifications);
    set('ovPlantsPlanted', s.plantsPlanted);
    set('ovAreasCovered', s.areasCount);
    set('ovCertsAwarded', s.certsAwarded);

    // Activity feed
    const feed = document.getElementById('adminActivityFeed');
    if (activities.length === 0) {
        feed.innerHTML = '<p style="color:var(--g600);font-size:.85rem">No recent activity.</p>';
    } else {
        feed.innerHTML = activities.slice(-20).reverse().map(a => `
            <div class="activity-item">
                <div class="activity-dot"></div>
                <div>
                    <div class="activity-text">${a.text}</div>
                    <div class="activity-time">${new Date(a.date).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }

    // Top contributors
    renderTopContributors('overviewTopContributors', s.topContributors);
}

function renderTopContributors(containerId, list) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (list.length === 0) {
        el.innerHTML = '<p style="color:var(--g600);font-size:.85rem">No contributors yet.</p>';
        return;
    }
    el.innerHTML = list.map((c, i) => `
        <div class="top-item">
            <div class="top-rank">${i + 1}</div>
            <div class="top-info">
                <strong>${c.name}</strong>
                <small>${c.city || ''} · ${c.completedTasks} tasks · ${c.totalPlants} plants</small>
            </div>
            <div class="top-score">${c.completedTasks + Math.round(c.totalPlants / 10)} pts</div>
        </div>
    `).join('');
}

// ===== VOLUNTEERS =====
let selectedVolunteer = null;
document.getElementById('admSearchVol')?.addEventListener('input', renderAdminVolunteers);
document.getElementById('admFilterVolStatus')?.addEventListener('change', renderAdminVolunteers);

function renderAdminVolunteers() {
    const search = (document.getElementById('admSearchVol')?.value || '').toLowerCase();
    const filter = document.getElementById('admFilterVolStatus')?.value || 'all';
    let f = volunteers.filter(vol => {
        if (filter !== 'all' && vol.status !== filter) return false;
        if (search && !vol.name.toLowerCase().includes(search) && !vol.email.toLowerCase().includes(search) && !vol.city.toLowerCase().includes(search)) return false;
        return true;
    });
    const tb = document.getElementById('admVolTable');
    if (!tb) return;
    tb.innerHTML = f.length === 0 ? '<tr><td colspan="9" class="empty-cell">No volunteers found.</td></tr>' :
        f.map(vol => {
            const myTasks = getVolunteerTasks(vol.id);
            const completed = myTasks.filter(t => t.status === 'completed').length;
            return `<tr>
                <td><strong>${vol.name}</strong></td>
                <td>${vol.age}</td>
                <td><small>${vol.email}</small></td>
                <td>${vol.city}</td>
                <td><small>${(vol.skills||[]).map(s=>s.replace('_',' ')).join(', ') || '-'}</small></td>
                <td>${completed}/${myTasks.length}</td>
                <td>${vol.plantsPlanted || 0}</td>
                <td><span class="status-badge status-${vol.status}">${STATUS_LABELS[vol.status]||vol.status}</span></td>
                <td><div class="vol-row-actions">
                    ${vol.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="approveVol('${vol.id}')" title="Approve">✓</button>` : ''}
                    <button class="btn btn-outline btn-sm" onclick="viewVolDetail('${vol.id}')" title="View Details">👁</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteVol('${vol.id}')" title="Remove">🗑</button>
                </div></td>
            </tr>`;
        }).join('');
}

window.approveVol = id => {
    const vol = volunteers.find(x => x.id === id);
    if (!vol) return;
    vol.status = 'approved';
    DB.set('volunteers', volunteers);
    logActivity(`✅ Volunteer approved: ${vol.name}`, { action: 'volunteer', person: vol.name, status: 'approved', ref: vol.id });
    renderAdminAll();
};

window.deleteVol = id => {
    if (!confirm('Remove this volunteer?')) return;
    const vol = volunteers.find(x => x.id === id);
    const idx = volunteers.findIndex(x => x.id === id);
    if (idx > -1) { volunteers.splice(idx, 1); DB.set('volunteers', volunteers); }
    logActivity(`🗑 Volunteer removed: ${id}`, { action: 'volunteer', person: (vol ? vol.name : id), status: 'removed', ref: id });
    renderAdminAll();
};

window.viewVolDetail = id => {
    const vol = volunteers.find(x => x.id === id);
    if (!vol) return;
    const stats = getVolunteerStats(id);
    const myTasks = getVolunteerTasks(id);
    document.getElementById('volDetailPanel').innerHTML = `
        <div class="vol-detail-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
                <h4 style="color:var(--g800)">👤 ${vol.name} — Volunteer Detail</h4>
                <button class="btn btn-outline btn-sm" onclick="document.getElementById('volDetailPanel').innerHTML=''">✕ Close</button>
            </div>
            <div class="vol-detail-grid">
                <div class="vol-detail-cell"><div class="lbl">Email</div><div class="val">${vol.email}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Phone</div><div class="val">${vol.phone}</div></div>
                <div class="vol-detail-cell"><div class="lbl">City</div><div class="val">${vol.city}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Area</div><div class="val">${vol.area||'-'}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Age</div><div class="val">${vol.age}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Availability</div><div class="val">${(vol.availability||'').replace('_',' ')}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Experience</div><div class="val">${(vol.experience||'').replace('_',' ')}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Volunteer ID</div><div class="val">${vol.id}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Joined</div><div class="val">${new Date(vol.createdAt).toLocaleDateString()}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Tasks</div><div class="val">${stats ? stats.completed : 0} / ${stats ? stats.totalJoined : 0} completed</div></div>
                <div class="vol-detail-cell"><div class="lbl">Plants</div><div class="val">${vol.plantsPlanted||0}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Certificates</div><div class="val">${certificates.filter(c=>c.volId===vol.id).length}</div></div>
            </div>
            ${vol.skills && vol.skills.length ? `<div style="margin-top:.75rem"><strong style="font-size:.8rem;color:var(--g700)">Skills:</strong> ${vol.skills.map(s=>s.replace('_',' ')).join(', ')}</div>` : ''}
            ${vol.motivation ? `<div style="margin-top:.5rem"><strong style="font-size:.8rem;color:var(--g700)">Motivation:</strong> ${vol.motivation}</div>` : ''}
            <div style="margin-top:1rem">
                <strong style="font-size:.85rem;color:var(--g800)">Assigned / Joined Tasks:</strong>
                <div style="margin-top:.5rem">
                    ${myTasks.length === 0 ? '<p style="color:var(--g600);font-size:.85rem">No tasks yet.</p>' :
                        myTasks.map(t => `
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem .75rem;background:#fff;border-radius:6px;margin-bottom:.35rem;border:1px solid var(--g100)">
                                <span style="font-size:.85rem;color:var(--g800)">${t.name}</span>
                                <span class="status-badge status-${t.status}" style="font-size:.7rem">${STATUS_LABELS[t.status]||t.status}</span>
                            </div>
                        `).join('')}
                </div>
            </div>
            <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap">
                ${vol.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="approveVol('${vol.id}');document.getElementById('volDetailPanel').innerHTML=''">✓ Approve Volunteer</button>` : ''}
            </div>
        </div>
    `;
    document.getElementById('volDetailPanel').scrollIntoView({ behavior: 'smooth' });
};

// ===== TASKS =====
document.getElementById('admSearchTask')?.addEventListener('input', renderAdminTasks);
document.getElementById('admFilterTaskStatus')?.addEventListener('change', renderAdminTasks);
document.getElementById('admCreateTask')?.addEventListener('click', () => {
    document.getElementById('taskModal').classList.remove('hidden');
    populateVolunteerSelect();
});
document.getElementById('closeTaskModal')?.addEventListener('click', () => document.getElementById('taskModal').classList.add('hidden'));

document.getElementById('taskAutoAssign')?.addEventListener('change', function() {
    document.getElementById('autoAssignOptions').classList.toggle('hidden', !this.checked);
});

function populateVolunteerSelect() {
    const list = document.getElementById('volunteerSelectList');
    const approved = volunteers.filter(x => x.status === 'approved' || x.status === 'active');
    if (approved.length === 0) {
        list.innerHTML = '<p style="color:var(--g600);font-size:.85rem;padding:.5rem">No approved volunteers yet. Approve volunteers first.</p>';
        return;
    }
    list.innerHTML = approved.map(vol => `
        <label class="volunteer-select-item">
            <input type="checkbox" name="assignVol" value="${vol.id}">
            <div>
                <div class="vsi-name">${vol.name}</div>
                <div class="vsi-meta">${vol.city} · ${vol.availability?.replace('_',' ')||''} · ${(vol.skills||[]).map(s=>s.replace('_',' ')).join(', ')||'No skills'}</div>
            </div>
        </label>
    `).join('');
    list.addEventListener('change', updateSelectedCount);
}

function updateSelectedCount() {
    const count = document.querySelectorAll('input[name="assignVol"]:checked').length;
    const el = document.getElementById('selectedVolCount');
    if (el) el.textContent = count;
}

document.getElementById('taskForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const selectedVols = Array.from(document.querySelectorAll('input[name="assignVol"]:checked')).map(c => c.value);
    const isAssigned = document.getElementById('taskAutoAssign').checked && selectedVols.length > 0;

    const task = {
        id: 'TASK-' + Date.now().toString(36).toUpperCase(),
        name: v('taskName'),
        area: v('taskArea'),
        city: v('taskCity'),
        location: v('taskLocation'),
        date: v('taskDate'),
        time: v('taskTime'),
        estimatedHours: parseInt(v('taskHours')) || null,
        plantType: v('taskPlantType'),
        plantName: v('taskPlantName'),
        quantity: parseInt(v('taskQuantity')) || 0,
        maxVol: parseInt(v('taskMaxVol')) || 10,
        details: v('taskDesc'),
        instructions: v('taskInstructions'),
        status: isAssigned ? 'assigned' : 'open',
        volunteers: isAssigned ? selectedVols : [],
        assignedTo: isAssigned ? selectedVols[0] : null,
        assignedVolunteers: isAssigned ? selectedVols : [],
        joined: isAssigned ? selectedVols.length : 0,
        createdAt: new Date().toISOString()
    };
    tasks.push(task);
    DB.set('tasks', tasks);

    // Update volunteer records
    if (isAssigned) {
        selectedVols.forEach(volId => {
            const vol = volunteers.find(x => x.id === volId);
            if (vol) {
                vol.tasksJoined = (vol.tasksJoined || 0) + 1;
            }
        });
        DB.set('volunteers', volunteers);
        logActivity(`🌳 Task created & assigned: "${task.name}" → ${selectedVols.length} volunteer(s)`, { action: 'task', person: 'Admin', status: task.status, ref: task.id });
    } else {
        logActivity(`🌳 New task created: "${task.name}"`, { action: 'task', person: 'Admin', status: task.status, ref: task.id });
    }

    document.getElementById('taskForm').reset();
    document.getElementById('taskModal').classList.add('hidden');
    renderAdminAll();
});

function renderAdminTasks() {
    const search = (document.getElementById('admSearchTask')?.value || '').toLowerCase();
    const filter = document.getElementById('admFilterTaskStatus')?.value || 'all';
    let f = tasks.filter(t => {
        if (filter !== 'all' && t.status !== filter) return false;
        if (search && !t.name.toLowerCase().includes(search) && !t.area.toLowerCase().includes(search)) return false;
        return true;
    });
    const tb = document.getElementById('admTaskTable');
    if (!tb) return;
    tb.innerHTML = f.length === 0 ? '<tr><td colspan="8" class="empty-cell">No tasks found.</td></tr>' :
        f.map(t => {
            const assignedNames = (t.assignedVolunteers || []).map(vid => {
                const vol = volunteers.find(x => x.id === vid);
                return vol ? vol.name : 'Unknown';
            });
            if (t.assignedTo && !t.assignedVolunteers?.length) {
                const vol = volunteers.find(x => x.id === t.assignedTo);
                if (vol) assignedNames.unshift(vol.name);
            }
            return `<tr>
                <td><strong>${PLANT_ICONS[t.plantType]||'🌱'} ${t.name}</strong><br><small style="color:var(--g600)">${t.id}</small></td>
                <td>${t.area}${t.city?', '+t.city:''}</td>
                <td>${t.date ? (t.date + (t.time ? ' ' + t.time : '')) : (t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-')}</td>
                <td>${t.quantity||0}</td>
                <td>${t.joined||0}/${t.maxVol||10}</td>
                <td><small>${assignedNames.length ? assignedNames.join(', ') : '—'}</small></td>
                <td><span class="status-badge status-${isTaskVerified(t) ? 'completed' : t.status}">${isTaskVerified(t) ? 'Verified' : (STATUS_LABELS[t.status] || t.status)}</span></td>
                <td><div class="action-btns">${taskActions(t)}</div></td>
            </tr>`;
        }).join('');
}

// Assign Modal
document.getElementById('closeAssignModal')?.addEventListener('click', () => document.getElementById('assignModal').classList.add('hidden'));

window.openAssignModal = function(taskId) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    document.getElementById('assignTaskId').value = taskId;
    document.getElementById('assignTaskName').value = t.name;
    const list = document.getElementById('assignVolunteerList');
    const approved = volunteers.filter(x => x.status === 'approved' || x.status === 'active');
    if (approved.length === 0) {
        list.innerHTML = '<p style="color:var(--g600);font-size:.85rem;padding:.5rem">No approved volunteers. Approve volunteers first.</p>';
    } else {
        list.innerHTML = approved.map(vol => {
            const alreadyAssigned = (t.assignedVolunteers||[]).includes(vol.id) || t.assignedTo === vol.id;
            return `
            <label class="volunteer-select-item ${alreadyAssigned ? 'selected' : ''}">
                <input type="radio" name="assignRadio" value="${vol.id}" ${alreadyAssigned ? 'checked' : ''} ${alreadyAssigned ? 'disabled' : ''}>
                <div>
                    <div class="vsi-name">${vol.name} ${alreadyAssigned ? '✅' : ''}</div>
                    <div class="vsi-meta">${vol.city} · ${vol.availability?.replace('_',' ')||''} · ${vol.tasksCompleted||0} completed</div>
                </div>
            </label>`;
        }).join('');
    }
    document.getElementById('assignModal').classList.remove('hidden');
};

document.getElementById('assignForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const taskId = document.getElementById('assignTaskId').value;
    const selected = document.querySelector('input[name="assignRadio"]:checked');
    if (!selected) return alert('Select a volunteer.');
    const volId = selected.value;
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;

    if (!t.volunteers) t.volunteers = [];
    if (!t.assignedVolunteers) t.assignedVolunteers = [];
    if (!t.volunteers.includes(volId)) {
        t.volunteers.push(volId);
        t.joined = t.volunteers.length;
    }
    if (!t.assignedVolunteers.includes(volId)) t.assignedVolunteers.push(volId);
    if (!t.assignedTo) t.assignedTo = volId;
    if (t.status === 'open') t.status = 'assigned';

    DB.set('tasks', tasks);
    const vol = volunteers.find(x => x.id === volId);
    if (vol && !vol.tasksJoined) vol.tasksJoined = (vol.tasksJoined||0) + 1;
    DB.set('volunteers', volunteers);

    logActivity(`📌 Task "${t.name}" assigned to ${vol?.name || volId}`, { action: 'task', person: vol ? vol.name : volId, status: t.status, ref: t.id });
    document.getElementById('assignModal').classList.add('hidden');
    renderAdminAll();
});

// Verify Task
window.verifyTask = id => {
    const t = tasks.find(x => x.id === id); if (!t) return;
    if (!confirm(`Verify task "${t.name}" as completed? Certificates will be generated for all assigned volunteers.`)) return;
    t.status = 'completed'; t.verifiedAt = new Date().toISOString();
    t.verification = 'verified'; t.completedAt = t.completedAt || t.verifiedAt;
    DB.set('tasks', tasks);
    const plantsPerVol = Math.ceil((t.quantity || 5) / Math.max(1, (t.volunteers || []).length));
    (t.volunteers || []).forEach(volId => {
        const vol = volunteers.find(x => x.id === volId);
        const existingCert = certificates.find(c => c.taskId === id && c.volId === volId);
        if (!existingCert) {
            const cert = {
                id: 'CERT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
                volId, volName: vol?.name || 'Unknown',
                taskId: id, taskName: t.name,
                plants: plantsPerVol, location: t.area,
                completedAt: t.verifiedAt, issuedAt: t.verifiedAt,
                status: 'issued', verifiedBy: 'Admin'
            };
            certificates.push(cert);
            if (vol) {
                vol.plantsPlanted = (vol.plantsPlanted || 0) + plantsPerVol;
                vol.tasksCompleted = (vol.tasksCompleted || 0) + 1;
                vol.certificates = (vol.certificates || 0) + 1;
                vol.hours = (vol.hours || 0) + (t.estimatedHours || 4);
                if (!vol.badges) vol.badges = [];
                const cc = vol.tasksCompleted;
                if (cc >= 1 && !vol.badges.includes('🌱 First Plantation')) vol.badges.push('🌱 First Plantation');
                if (cc >= 5 && !vol.badges.includes('🌿 5 Tasks')) vol.badges.push('🌿 5 Tasks');
                if (cc >= 10 && !vol.badges.includes('🌳 10 Tasks')) vol.badges.push('🌳 10 Tasks');
                if (cc >= 25 && !vol.badges.includes('🏆 25 Tasks')) vol.badges.push('🏆 25 Tasks');
                if (cc >= 50 && !vol.badges.includes('🌍 Environmental Champion')) vol.badges.push('🌍 Environmental Champion');
            }
        }
    });
    DB.set('certificates', certificates);
    DB.set('volunteers', volunteers);
    logActivity(`✅ Task verified & completed: ${t.name}. Certificates issued.`, { action: 'verification', person: 'Admin', status: 'verified', ref: t.id });
    renderAdminAll();
};

window.deleteTask = id => {
    if (!confirm('Delete this task?')) return;
    const idx = tasks.findIndex(t => t.id === id);
    if (idx > -1) { tasks.splice(idx, 1); DB.set('tasks', tasks); }
    renderAdminAll();
};

// ===== REQUESTS =====
document.getElementById('admSearchReq')?.addEventListener('input', renderAdminRequests);
document.getElementById('admFilterStatus')?.addEventListener('change', renderAdminRequests);

function renderAdminRequests() {
    const search = (document.getElementById('admSearchReq')?.value || '').toLowerCase();
    const filter = document.getElementById('admFilterStatus')?.value || 'all';
    let f = requests.filter(r => {
        if (filter !== 'all' && r.status !== filter) return false;
        if (search && !r.name.toLowerCase().includes(search) && !r.area.toLowerCase().includes(search) && !r.id.toLowerCase().includes(search)) return false;
        return true;
    });
    const tb = document.getElementById('admReqTable');
    if (!tb) return;
    tb.innerHTML = f.length === 0 ? '<tr><td colspan="7" class="empty-cell">No requests found.</td></tr>' :
        f.map(r => `<tr>
            <td><small>${r.id}</small></td>
            <td>${r.name}<br><small>${r.phone}</small></td>
            <td>${PLANT_ICONS[r.plantType]||'🌱'} ${r.plantName||r.plantType}</td>
            <td>${r.quantity}</td>
            <td>${r.area}, ${r.city}</td>
            <td><span class="status-badge status-${r.status}">${STATUS_LABELS[r.status]}</span></td>
            <td><div class="action-btns">
                ${r.status!=='completed'&&r.status!=='rejected'?`<button class="action-btn approve" onclick="advanceReq('${r.id}')" title="Advance">▶</button>`:''}
                ${r.status!=='rejected'?`<button class="action-btn reject" onclick="rejectReq('${r.id}')" title="Reject">✗</button>`:''}
                <button class="action-btn view" onclick="viewReqHistory('${r.id}')" title="View Request History">🕘</button>
                <button class="action-btn delete" onclick="deleteReq('${r.id}')" title="Delete">🗑</button>
            </div></td>
        </tr>`).join('');
}

window.advanceReq = id => {
    const r = requests.find(x => x.id === id); if (!r) return;
    const i = STATUS_FLOW.indexOf(r.status);
    if (i < STATUS_FLOW.length - 1) {
        r.status = STATUS_FLOW[i + 1];
        if (!r.history) r.history = [];
        r.history.push({ status: r.status, date: new Date().toISOString() });
    }
    DB.set('requests', requests);
    logActivity(`✅ Request ${r.id} → ${STATUS_LABELS[r.status]}`, { action: 'request', person: r.name || 'Customer', status: r.status, ref: r.id });
    renderAdminAll();
};

window.rejectReq = id => {
    const r = requests.find(x => x.id === id); if (!r) return;
    r.status = 'rejected';
    if (!r.history) r.history = [];
    r.history.push({ status: 'rejected', date: new Date().toISOString() });
    DB.set('requests', requests);
    logActivity(`❌ Request ${r.id} rejected`, { action: 'request', person: r.name || 'Customer', status: 'rejected', ref: r.id });
    renderAdminAll();
};

window.deleteReq = id => {
    if (!confirm('Delete request?')) return;
    const idx = requests.findIndex(r => r.id === id);
    if (idx > -1) { requests.splice(idx, 1); DB.set('requests', requests); }
    renderAdminAll();
};

// ===== STATISTICS =====
function renderStatistics() {
    const s = getAdminStats();
    document.getElementById('stTotalVols').textContent = s.totalVols;
    document.getElementById('stActiveVols').textContent = s.activeVols;
    document.getElementById('stAssignedTasks').textContent = s.assignedTasks;
    document.getElementById('stCompletedTasks').textContent = s.completedTasks;
    document.getElementById('stTotalPlants').textContent = s.totalPlants;
    document.getElementById('stTotalCerts').textContent = s.totalCerts;
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set('stTotalCustomers', s.totalCustomers);
    set('stTotalUsers', s.totalUsers);
    set('stPlantsRequested', s.plantsRequested);
    set('stAreas', s.areasCount);
    set('stPendingVerify', s.pendingVerifications);
    set('stActivities', s.completedActivities);
    set('stPendingReq', s.reqPending);
    set('stApprovedReq', s.reqApproved);

    renderBarChart('chartCity', s.cityMap);
    renderBarChart('chartMonthly', s.monthMap);
    renderBarChart('chartYear', s.yearMap);
    renderBarChart('chartPlantMonth', s.plantByMonth);
    renderImpactSummary(s);
    renderRequestStatusDist();
    renderTopContributors('statsTopContributors', s.topContributors);

    // Task status distribution
    const statusCounts = {};
    tasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
    const distEl = document.getElementById('taskStatusDist');
    if (distEl) {
        const total = tasks.length || 1;
        distEl.innerHTML = Object.entries(statusCounts).map(([status, count]) => {
            const pct = Math.round((count / total) * 100);
            return `
                <div style="margin-bottom:.75rem">
                    <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.25rem">
                        <span style="color:var(--g700)">${STATUS_LABELS[status]||status}</span>
                        <span style="color:var(--g700);font-weight:700">${count} (${pct}%)</span>
                    </div>
                    <div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div>
                </div>
            `;
        }).join('') || '<p style="color:var(--g600);font-size:.85rem">No tasks yet.</p>';
    }
}

function renderBarChart(containerId, data) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (entries.length === 0) {
        el.innerHTML = '<p style="color:var(--g600);font-size:.85rem">No data yet.</p>';
        return;
    }
    const max = Math.max(...entries.map(e => e[1]));
    el.innerHTML = entries.map(([label, count]) => {
        const h = Math.max(4, Math.round((count / max) * 130));
        return `
            <div class="bar-item">
                <div class="bar-value">${count}</div>
                <div class="bar" style="height:${h}px"></div>
                <div class="bar-label">${label.length > 8 ? label.substring(0, 7) + '…' : label}</div>
            </div>
        `;
    }).join('');
}

// ===== CERTIFICATES =====
document.getElementById('admSearchCert')?.addEventListener('input', renderAdminCerts);
document.getElementById('admCertFilter')?.addEventListener('change', renderAdminCerts);

function renderAdminCerts() {
    const search = (document.getElementById('admSearchCert')?.value || '').toLowerCase();
    const filter = document.getElementById('admCertFilter')?.value || 'all';
    let f = certificates.filter(c => {
        if (filter !== 'all' && c.status !== filter) return false;
        if (search && !c.volName.toLowerCase().includes(search) && !c.taskName.toLowerCase().includes(search) && !c.id.toLowerCase().includes(search)) return false;
        return true;
    });
    const tb = document.getElementById('admCertTable');
    if (!tb) return;
    tb.innerHTML = f.length === 0 ? '<tr><td colspan="7" class="empty-cell">No certificates found.</td></tr>' :
        f.map(c => `<tr>
            <td><small>${c.id}</small></td>
            <td>${c.volName}</td>
            <td>${c.taskName}</td>
            <td>${c.plants}</td>
            <td>${c.location}</td>
            <td><span class="status-badge status-${c.status}">${STATUS_LABELS[c.status]||c.status}</span></td>
            <td><div class="action-btns">
                <button class="action-btn view" onclick="viewCert('${c.id}')" title="View">👁</button>
                <button class="action-btn delete" onclick="deleteCert('${c.id}')" title="Delete">🗑</button>
            </div></td>
        </tr>`).join('');
}

window.viewCert = id => window.open('certificate.html?id=' + id, '_blank');
window.deleteCert = id => {
    if (!confirm('Delete certificate?')) return;
    const idx = certificates.findIndex(c => c.id === id);
    if (idx > -1) { certificates.splice(idx, 1); DB.set('certificates', certificates); }
    renderAdminAll();
};

// ===== PLANT CARE =====
document.getElementById('admAddCare')?.addEventListener('click', () => document.getElementById('careModal').classList.remove('hidden'));
document.getElementById('closeCareModal')?.addEventListener('click', () => document.getElementById('careModal').classList.add('hidden'));
document.getElementById('careForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const careId = 'CARE-' + Date.now().toString(36).toUpperCase();
    careRecords.push({
        id: careId,
        plantName: v('carePlantName'), location: v('careLocation'),
        status: v('careStatus'), date: v('careDate'), notes: v('careNotes'),
        createdAt: new Date().toISOString()
    });
    DB.set('care', careRecords);
    logActivity(`🩺 Care record added: ${v('carePlantName')} (${v('careStatus')})`, { action: 'care', person: 'Admin', status: v('careStatus'), ref: careId });
    document.getElementById('careForm').reset();
    document.getElementById('careModal').classList.add('hidden');
    renderAdminCare();
});
document.getElementById('admCareFilter')?.addEventListener('change', renderAdminCare);

function renderAdminCare() {
    const f = document.getElementById('admCareFilter')?.value || 'all';
    let data = careRecords.filter(c => f === 'all' || c.status === f);
    const tb = document.getElementById('admCareTable');
    if (!tb) return;
    tb.innerHTML = data.length === 0 ? '<tr><td colspan="6" class="empty-cell">No care records.</td></tr>' :
        data.map(c => `<tr>
            <td>${c.plantName}</td><td>${c.location}</td><td>${c.date}</td>
            <td><span class="status-badge status-${c.status}">${STATUS_LABELS[c.status]}</span></td>
            <td><small>${c.notes||'-'}</small></td>
            <td><button class="action-btn delete" onclick="deleteCare('${c.id}')">🗑</button></td>
        </tr>`).join('');
}

window.deleteCare = id => {
    if (!confirm('Delete?')) return;
    const idx = careRecords.findIndex(c => c.id === id);
    if (idx > -1) { careRecords.splice(idx, 1); DB.set('care', careRecords); }
    renderAdminCare();
};

// ===== REPORTS =====
function renderReports() {
    const r1 = document.getElementById('rptRequests'), r2 = document.getElementById('rptVolunteers');
    const r3 = document.getElementById('rptTasks'), r4 = document.getElementById('rptCare');
    const r5 = document.getElementById('rptCerts');
    if (r1) r1.textContent = requests.length;
    if (r2) r2.textContent = volunteers.length;
    if (r3) r3.textContent = tasks.length;
    if (r4) r4.textContent = careRecords.length;
    if (r5) r5.textContent = certificates.length;
}

function download(csv, name) {
    const b = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click();
}

window.exportRequests = () => {
    if (!requests.length) return alert('No data.');
    let csv = 'ID,Name,Phone,City,Area,Plant,Qty,Status\n';
    requests.forEach(r => csv += `"${r.id}","${r.name}","${r.phone}","${r.city}","${r.area}","${r.plantType}",${r.quantity},"${r.status}"\n`);
    download(csv, 'requests.csv');
};
window.exportVolunteers = () => {
    if (!volunteers.length) return alert('No data.');
    let csv = 'ID,Name,Age,Email,City,Skills,Experience,Status,TasksCompleted,Plants\n';
    volunteers.forEach(x => csv += `"${x.id}","${x.name}",${x.age},"${x.email}","${x.city}","${(x.skills||[]).join('|')}","${x.experience||''}","${x.status}",${x.tasksCompleted||0},${x.plantsPlanted||0}\n`);
    download(csv, 'volunteers.csv');
};
window.exportTasks = () => {
    if (!tasks.length) return alert('No data.');
    let csv = 'ID,Name,Area,City,Date,Quantity,Volunteers,Status,AssignedTo\n';
    tasks.forEach(t => csv += `"${t.id}","${t.name}","${t.area}","${t.city||''}","${t.date}",${t.quantity||0},${t.joined||0},"${t.status}","${t.assignedTo||''}"\n`);
    download(csv, 'tasks.csv');
};
window.exportCare = () => {
    if (!careRecords.length) return alert('No data.');
    let csv = 'Plant,Location,Date,Status,Notes\n';
    careRecords.forEach(c => csv += `"${c.plantName}","${c.location}","${c.date}","${c.status}","${c.notes||''}"\n`);
    download(csv, 'care.csv');
};
window.exportCerts = () => {
    if (!certificates.length) return alert('No data.');
    let csv = 'ID,Volunteer,Task,Plants,Location,Status,Issued\n';
    certificates.forEach(c => csv += `"${c.id}","${c.volName}","${c.taskName}",${c.plants},"${c.location}","${c.status}","${c.issuedAt||''}"\n`);
    download(csv, 'certificates.csv');
};

// Settings
document.getElementById('admSaveSettings')?.addEventListener('click', () => alert('Settings saved!'));
document.getElementById('admExportAll')?.addEventListener('click', () => {
    let csv = 'Type,ID,Name,Status\n';
    requests.forEach(r => csv += `Request,${r.id},${r.name},${r.status}\n`);
    volunteers.forEach(x => csv += `Volunteer,${x.id},${x.name},${x.status}\n`);
    tasks.forEach(t => csv += `Task,${t.id},"${t.name}",${t.status}\n`);
    download(csv, 'all-data.csv');
});
document.getElementById('admClearAll')?.addEventListener('click', () => {
    if (!confirm('Clear ALL data?')) return;
    if (!confirm('Are you sure? This cannot be undone.')) return;
    requests.length = 0; volunteers.length = 0; tasks.length = 0;
    careRecords.length = 0; certificates.length = 0; activities.length = 0;
    DB.set('requests', requests); DB.set('volunteers', volunteers);
    DB.set('tasks', tasks); DB.set('care', careRecords);
    DB.set('certificates', certificates); DB.set('activities', activities);
    renderAdminAll(); alert('All data cleared.');
});
function fillSelect(id, values, keep) {
  const el = document.getElementById(id); if (!el) return;
  const cur = keep ? el.value : null;
  const first = el.options[0] ? el.options[0].outerHTML : '';
  el.innerHTML = first + values.map(v => '<option value="' + v + '">' + v + '</option>').join('');
  if (keep && cur) { try { el.value = cur; } catch (e) {} if (el.selectedIndex < 0) el.selectedIndex = 0; }
}
function renderCompleteRecords(){
  const tbody=document.getElementById('admRecordsTable');
  if(!tbody) return;
  const sq=document.getElementById('admSearchRecords');
  const st=document.getElementById('admFilterRecType');
  const q=(sq&&sq.value||'').toLowerCase();
  const t=(st&&st.value||'all');
  let rows=[];
  function push(x){rows.push(x);}
  requests.forEach(function(r){
    if(t!=='all'&&t!=='request') return;
    if(q){var m=((r.name||'')+(r.email||'')+(r.address||'')+(r.area||'')+(r.id||'')).toLowerCase(); if(m.indexOf(q)<0) return;}
    push({type:'Request',id:r.id,reqBy:(r.name||'-')+'<br>'+(r.email||'-'),dt:r.createdAt||r.submittedAt,plant:r.plantType||'-',qty:r.quantity||1,loc:(r.city||'-')+'/'+(r.area||'-'),address:r.address||'-',ass:'-',compBy:'-',assAt:'-',compAt:r.completedAt||'-',taskSt:'-',reqSt:r.status,plantSt:r.plantationStatus||'-',careSt:r.careStatus||'-',notes:r.notes||'',
      _cust:(r.email||r.name||'').toLowerCase(),_vol:'',_city:((r.city||'')+' '+(r.area||'')).toLowerCase(),_status:r.status,_dt:r.createdAt||r.submittedAt||''});
  });
  tasks.forEach(function(r){
    if(t!=='all'&&t!=='task') return;
    if(q){var m=((r.name||'')+(r.area||'')+(r.city||'')+(r.location||'')+(r.id||'')).toLowerCase(); if(m.indexOf(q)<0) return;}
    var avs=(r.assignedVolunteers||[]).map(function(v){return (volunteers.find(function(x){return x.id===v;})||{}).name||v;});
    if(r.assignedTo && !avs.length){ var a=(volunteers.find(function(x){return x.id===r.assignedTo;})||{}).name; if(a) avs.push(a); }
    push({type:'Task',id:r.id,reqBy:'-',dt:r.createdAt,plant:r.plantName||r.plantType||'-',qty:r.quantity||0,loc:(r.city||'-')+'/'+(r.area||'-'),address:r.location||'-',ass:avs.join(', ')||'-',compBy:r.completedBy||'-',assAt:r.assignedAt||'-',compAt:r.completedAt||'-',taskSt:isTaskVerified(r)?'verified':r.status,reqSt:'-',plantSt:r.plantationStatus||(isTaskDone(r)?'Completed':'-'),careSt:r.careStatus||'-',notes:r.description||r.instructions||'',
      _cust:'',_vol:(avs.join(' ')+' '+((volunteers.find(function(x){return x.id===r.assignedTo;})||{}).name||'')).toLowerCase(),_city:((r.city||'')+' '+(r.area||'')+' '+(r.location||'')).toLowerCase(),_status:isTaskVerified(r)?'verified':r.status,_dt:r.createdAt||''});
  });
  volunteers.forEach(function(r){
    if(t!=='all'&&t!=='volunteer') return;
    if(q){var m=((r.name||'')+(r.email||'')+(r.city||'')+(r.id||'')).toLowerCase(); if(m.indexOf(q)<0) return;}
    push({type:'Volunteer',id:r.id,reqBy:(r.name||'-')+'<br>'+(r.email||'-'),dt:r.createdAt,plant:'-',qty:'-',loc:(r.city||'-')+'/'+(r.area||'-'),address:r.address||'-',ass:'-',compBy:'-',assAt:'-',compAt:'-',taskSt:r.status,reqSt:'-',plantSt:'-',careSt:'-',notes:(r.skills||'').join? (r.skills||[]).join(', '):(r.skills||''),
      _cust:'',_vol:((r.name||'')+' '+(r.email||'')).toLowerCase(),_city:((r.city||'')+' '+(r.area||'')).toLowerCase(),_status:r.status,_dt:r.createdAt||''});
  });
  certificates.forEach(function(r){
    if(t!=='all'&&t!=='certificate') return;
    var vname=(volunteers.find(function(v){return v.id===r.volId;})||{}).name||r.volId||'-';
    if(q){var m=((r.id||'')+vname).toLowerCase(); if(m.indexOf(q)<0) return;}
    push({type:'Certificate',id:r.id,reqBy:vname,dt:r.createdAt||r.issuedAt,plant:'-',qty:'-',loc:r.location||'-',address:'-',ass:'-',compBy:vname,assAt:'-',compAt:r.issuedAt||r.verifiedAt||'-',taskSt:r.status,reqSt:'-',plantSt:'-',careSt:'-',notes:r.taskId||'',
      _cust:'',_vol:vname.toLowerCase(),_city:(r.location||'').toLowerCase(),_status:r.status,_dt:r.issuedAt||r.createdAt||''});
  });
  careRecords.forEach(function(r){
    if(t!=='all'&&t!=='care') return;
    if(q){var m=((r.plantName||'')+(r.location||'')).toLowerCase(); if(m.indexOf(q)<0) return;}
    push({type:'Care',id:r.id||'care-'+Math.floor(Math.random()*9999),reqBy:'-',dt:r.date,plant:r.plantName||'-',qty:'-',loc:r.location||'-',address:'-',ass:'-',compBy:'-',assAt:'-',compAt:'-',taskSt:'-',reqSt:'-',plantSt:'-',careSt:r.status,notes:r.notes||'',
      _cust:'',_vol:'',_city:(r.location||'').toLowerCase(),_status:r.status,_dt:r.date||r.createdAt||''});
  });

  const g = id => (document.getElementById(id) ? document.getElementById(id).value : '');
  const fCust = g('admFilterRecCustomer'), fVol = g('admFilterRecVol'), fCity = g('admFilterRecCity'), fStatus = g('admFilterRecStatus');
  const fCustL = (fCust || '').toLowerCase(), fVolL = (fVol || '').toLowerCase();
  const dFrom = g('admDateFrom'), dTo = g('admDateTo');
  rows = rows.filter(x => {
    if (fCust && fCust !== 'all' && x._cust.indexOf(fCustL) < 0) return false;
    if (fVol && fVol !== 'all' && x._vol.indexOf(fVolL) < 0) return false;
    if (fCity && fCity !== 'all' && x._city.indexOf(fCity.toLowerCase()) < 0) return false;
    if (fStatus && fStatus !== 'all' && x._status !== fStatus) return false;
    const d = (x._dt || x.dt || '').slice(0, 10);
    if (dFrom && d && d < dFrom) return false;
    if (dTo && d && d > dTo) return false;
    return true;
  });

  const fcEl = document.getElementById('admFilterRecCustomer');
  if (fcEl && !fcEl.dataset.filled) {
    const custs = [], vols = [], cities = [];
    getCustomers().forEach(c => { if (c.email && c.email !== '-') custs.push(c.email); else if (c.name) custs.push(c.name); });
    volunteers.forEach(v => { if (v.name) vols.push(v.name); });
    requests.forEach(r => { if (r.city) cities.push(r.city); });
    tasks.forEach(r => { if (r.city) cities.push(r.city); });
    fillSelect('admFilterRecCustomer', custs.filter((v, i, a) => a.indexOf(v) === i).sort(), true);
    fillSelect('admFilterRecVol', vols.filter((v, i, a) => a.indexOf(v) === i).sort(), true);
    fillSelect('admFilterRecCity', cities.filter((v, i, a) => a.indexOf(v) === i).sort(), true);
    document.getElementById('admFilterRecCustomer').dataset.filled = '1';
  }

  tbody.innerHTML=rows.length?rows.map(function(x){
    return '<tr><td>'+x.type+'</td><td>'+x.id+'</td><td>'+x.reqBy+'</td><td>'+(x.dt||'-')+'</td><td>'+x.plant+'</td><td>'+x.qty+'</td><td>'+x.loc+'</td><td>'+x.address+'</td><td>'+x.ass+'</td><td>'+x.compBy+'</td><td>'+x.assAt+'</td><td>'+x.compAt+'</td><td>'+x.taskSt+'</td><td>'+x.reqSt+'</td><td>'+x.plantSt+'</td><td>'+x.careSt+'</td><td>'+(x.notes||'-')+'</td></tr>';
  }).join(''):'<tr><td colspan="17" class="empty-cell">No records found.</td></tr>';
  var c=document.getElementById('admRecordsCount'); if(c) c.textContent=rows.length+' records';
}
document.getElementById('admExportAllRecords')?.addEventListener('click', () => {
    const headers = ['Type','ID','Requested By','Date/Time','Plant Type','Qty','Location','Address','Assigned To','Completed By','Assigned At','Completed At','Task Status','Request Status','Plantation Status','Care Status','Notes'];
    const rows = [headers.join(',')];
    document.querySelectorAll('#admRecordsTable tr').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => '"' + td.textContent.replace(/"/g, '""') + '"');
        if (cells.length > 1) rows.push(cells.join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'complete-records-' + Date.now() + '.csv';
    a.click();
});

// ===== TASK STATUS FLOW: Pending -> Approved -> Assigned -> In Progress -> Completed -> Verified =====
function taskActions(t) {
    const id = "'" + t.id + "'";
    let html = '';
    if (t.status === 'open') html += '<button class="action-btn approve" onclick="approveTask(' + id + ')" title="Approve Task">✓</button>';
    if (t.status === 'open' || t.status === 'approved' || t.status === 'assigned') {
        html += '<button class="action-btn approve" onclick="openAssignModal(' + id + ')" title="Assign Volunteer">📌</button>';
    }
    if (t.status === 'submitted_for_review') {
        html += '<button class="action-btn approve" onclick="verifyTask(' + id + ')" title="Verify & Complete">✅</button>';
        html += '<button class="action-btn reject" onclick="rejectCompletion(' + id + ')" title="Send Back to Volunteer">↩</button>';
    }
    if (t.status === 'completed' && !isTaskVerified(t)) {
        html += '<button class="action-btn approve" onclick="verifyTask(' + id + ')" title="Verify & Issue Certificates">✅</button>';
        html += '<button class="action-btn reject" onclick="reopenTask(' + id + ')" title="Reopen Task">↩</button>';
    }
    if (isTaskVerified(t)) {
        html += '<button class="action-btn view" onclick="viewTaskCerts(' + id + ')" title="View Certificates">🎓</button>';
        html += '<button class="action-btn reject" onclick="reopenTask(' + id + ')" title="Reopen Task">↩</button>';
    }
    html += '<button class="action-btn delete" onclick="deleteTask(' + id + ')" title="Delete">🗑</button>';
    return html;
}

window.approveTask = id => {
    const t = tasks.find(x => x.id === id); if (!t) return;
    if (t.status !== 'open') return;
    t.status = 'approved'; t.approvedAt = new Date().toISOString();
    DB.set('tasks', tasks);
    logActivity('✅ Task approved: ' + t.name, { action: 'task', person: 'Admin', status: 'approved', ref: t.id });
    renderAdminAll();
};

window.rejectCompletion = id => {
    const t = tasks.find(x => x.id === id); if (!t) return;
    if (!confirm('Send "' + t.name + '" back to the volunteer for correction?')) return;
    t.status = 'in_progress';
    t.verification = '';
    t.reviewNote = 'Sent back by admin on ' + new Date().toLocaleDateString();
    DB.set('tasks', tasks);
    logActivity('↩ Task sent back: ' + t.name, { action: 'task', person: 'Admin', status: 'in_progress', ref: t.id });
    renderAdminAll();
};

window.reopenTask = id => {
    const t = tasks.find(x => x.id === id); if (!t) return;
    if (!confirm('Reopen task "' + t.name + '"? Verification and certificates for this task will be removed.')) return;
    t.status = 'in_progress'; t.verification = ''; t.verifiedAt = null;
    const rm = certificates.filter(c => c.taskId === id);
    rm.forEach(c => {
        const idx = certificates.indexOf(c);
        if (idx > -1) certificates.splice(idx, 1);
        const vol = volunteers.find(v => v.id === c.volId);
        if (vol) {
            vol.plantsPlanted = Math.max(0, (vol.plantsPlanted || 0) - (c.plants || 0));
            vol.tasksCompleted = Math.max(0, (vol.tasksCompleted || 0) - 1);
            vol.certificates = Math.max(0, (vol.certificates || 0) - 1);
        }
    });
    DB.set('certificates', certificates); DB.set('volunteers', volunteers); DB.set('tasks', tasks);
    logActivity('↩ Task reopened: ' + t.name + (rm.length ? ' (' + rm.length + ' certificate(s) revoked)' : ''), { action: 'task', person: 'Admin', status: 'in_progress', ref: t.id });
    renderAdminAll();
};

window.viewTaskCerts = id => {
    const t = tasks.find(x => x.id === id); if (!t) return;
    const certs = certificates.filter(c => c.taskId === id);
    if (!certs.length) return alert('No certificates issued for this task yet.');
    if (certs.length === 1) return window.open('certificate.html?id=' + certs[0].id, '_blank');
    alert('Certificates for "' + t.name + '":\n\n' + certs.map(c => c.volName + ' — ' + c.id).join('\n'));
};

// ===== REQUEST HISTORY =====
window.viewReqHistory = id => {
    const r = requests.find(x => x.id === id); if (!r) return;
    const panel = document.getElementById('reqHistoryPanel');
    if (!panel) return;
    const hist = (r.history && r.history.length) ? r.history : [{ status: r.status, date: r.createdAt || r.submittedAt || new Date().toISOString() }];
    const rel = tasks.filter(t => (r.taskId && t.id === r.taskId) || (t.requestId === r.id));
    panel.innerHTML = `
        <div class="vol-detail-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
                <h4 style="color:var(--g800)">🕘 Request History — ${r.id}</h4>
                <button class="btn btn-outline btn-sm" onclick="document.getElementById('reqHistoryPanel').innerHTML=''">✕ Close</button>
            </div>
            <div class="vol-detail-grid">
                <div class="vol-detail-cell"><div class="lbl">Request ID</div><div class="val">${r.id}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Submitted By</div><div class="val">${r.name || '-'}${r.email ? ' · ' + r.email : ''}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Location</div><div class="val">${r.area || '-'}, ${r.city || '-'}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Plant</div><div class="val">${PLANT_ICONS[r.plantType] || '🌱'} ${r.plantName || r.plantType || '-'} × ${r.quantity || 0}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Current Status</div><div class="val"><span class="status-badge status-${r.status}">${STATUS_LABELS[r.status] || r.status}</span></div></div>
                <div class="vol-detail-cell"><div class="lbl">Submitted</div><div class="val">${r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</div></div>
            </div>
            <div style="margin-top:1rem">
                <strong style="font-size:.85rem;color:var(--g800)">Status Timeline:</strong>
                <div style="margin-top:.5rem">
                    ${hist.map(h => `<div style="display:flex;justify-content:space-between;padding:.5rem .75rem;background:#fff;border-radius:6px;margin-bottom:.35rem;border:1px solid var(--g100);font-size:.83rem">
                        <span style="color:var(--g800)"><span class="status-badge status-${h.status}">${STATUS_LABELS[h.status] || h.status}</span></span>
                        <span style="color:var(--g600)">${h.date ? new Date(h.date).toLocaleString() : '-'}</span>
                    </div>`).join('')}
                </div>
            </div>
            <div style="margin-top:.75rem;font-size:.83rem;color:var(--g700)">
                <strong>Related tasks:</strong> ${rel.length ? rel.map(t => t.id + ' (' + (STATUS_LABELS[t.status] || t.status) + ')').join(', ') : 'None'}
            </div>
        </div>
    `;
    panel.scrollIntoView({ behavior: 'smooth' });
};

// ===== CUSTOMER RECORDS =====
function renderCustomers() {
    const tb = document.getElementById('admCustTable');
    if (!tb) return;
    const search = (document.getElementById('admSearchCust')?.value || '').toLowerCase();
    const fStatus = document.getElementById('admFilterCustStatus')?.value || 'all';
    const fCity = document.getElementById('admFilterCustCity')?.value || 'all';

    const all = getCustomers();
    const citySet = {};
    all.forEach(c => (c.cities || []).forEach(ct => citySet[ct] = true));
    fillSelect('admFilterCustCity', Object.keys(citySet).sort(), true);

    const list = all.filter(c => {
        if (search && !((c.name || '') + (c.email || '') + (c.phone || '')).toLowerCase().includes(search)) return false;
        if (fStatus === 'approved' && !c.approved) return false;
        if (fStatus === 'pending' && !c.pending) return false;
        if (fStatus === 'rejected' && !c.rejected) return false;
        if (fCity !== 'all' && !(c.cities || []).includes(fCity)) return false;
        return true;
    });

    tb.innerHTML = list.length === 0 ? '<tr><td colspan="10" class="empty-cell">No customers found.</td></tr>' :
        list.map((c, i) => `<tr>
            <td><strong>${c.name}</strong></td>
            <td><small>${c.email}</small></td>
            <td><small>${c.phone}</small></td>
            <td>${c.requests}</td>
            <td>${c.approved}</td>
            <td>${c.rejected}</td>
            <td>${c.plants}</td>
            <td><small>${(c.cities || []).join(', ') || '-'}${(c.areas || []).length ? '<br>' + c.areas.join(', ') : ''}</small></td>
            <td><small>${c.last ? new Date(c.last).toLocaleDateString() : '-'}</small></td>
            <td><div class="vol-row-actions">
                <button class="btn btn-outline btn-sm" onclick="viewCustDetail(${i})" title="View Requests">👁</button>
            </div></td>
        </tr>`).join('');
    window.__custList = list;
}

window.viewCustDetail = i => {
    const c = (window.__custList || [])[i];
    const panel = document.getElementById('custDetailPanel');
    if (!c || !panel) return;
    panel.innerHTML = `
        <div class="vol-detail-panel">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
                <h4 style="color:var(--g800)">👤 ${c.name} — Request Record</h4>
                <button class="btn btn-outline btn-sm" onclick="document.getElementById('custDetailPanel').innerHTML=''">✕ Close</button>
            </div>
            <div class="vol-detail-grid">
                <div class="vol-detail-cell"><div class="lbl">Email</div><div class="val">${c.email}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Phone</div><div class="val">${c.phone}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Total Requests</div><div class="val">${c.requests}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Approved / Rejected</div><div class="val">${c.approved} / ${c.rejected}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Plants Requested</div><div class="val">${c.plants}</div></div>
                <div class="vol-detail-cell"><div class="lbl">Cities / Areas</div><div class="val">${(c.cities || []).join(', ') || '-'} ${c.areas && c.areas.length ? '· ' + c.areas.join(', ') : ''}</div></div>
            </div>
            <div style="margin-top:1rem;overflow-x:auto">
                <table class="data-table">
                    <thead><tr><th>Request ID</th><th>Date</th><th>Location</th><th>Plant</th><th>Qty</th><th>Organizer</th><th>Request Status</th><th>Task Status</th><th>Plantation</th><th>Care</th><th>Notes</th></tr></thead>
                    <tbody>
                    ${c.list.map(r => {
                        const task = tasks.find(t => t.id === r.taskId);
                        const org = task && task.assignedTo ? ((volunteers.find(v => v.id === task.assignedTo) || {}).name || task.assignedTo) : (r.organizer || '-');
                        return `<tr>
                            <td><small>${r.id}</small></td>
                            <td><small>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</small></td>
                            <td>${r.area || '-'}, ${r.city || '-'}</td>
                            <td>${PLANT_ICONS[r.plantType] || '🌱'} ${r.plantName || r.plantType || '-'}</td>
                            <td>${r.quantity || 0}</td>
                            <td><small>${org}</small></td>
                            <td><span class="status-badge status-${r.status}">${STATUS_LABELS[r.status] || r.status}</span></td>
                            <td>${task ? (isTaskVerified(task) ? 'Verified' : (STATUS_LABELS[task.status] || task.status)) : '-'}</td>
                            <td>${r.plantationStatus || (task && isTaskDone(task) ? 'Completed' : '-')}</td>
                            <td>${r.careStatus || '-'}</td>
                            <td><small>${r.notes || '-'}</small></td>
                        </tr>`;
                    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    panel.scrollIntoView({ behavior: 'smooth' });
};

function exportCustomers() {
    const list = window.__custList || getCustomers();
    if (!list.length) return alert('No data.');
    let csv = 'Name,Email,Phone,Requests,Approved,Rejected,Pending,Plants,Cities,Areas,First Request,Last Request\n';
    list.forEach(c => csv += `"${c.name}","${c.email}","${c.phone}",${c.requests},${c.approved},${c.rejected},${c.pending},${c.plants},"${(c.cities || []).join('|')}","${(c.areas || []).join('|')}","${c.first || ''}","${c.last || ''}"\n`);
    download(csv, 'customers.csv');
}

// ===== PLANT & ENVIRONMENTAL RECORDS =====
function renderPlants() {
    const s = getAdminStats();
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set('plTotal', s.plantsRequested);
    set('plPlanted', s.plantsPlanted);
    set('plPending', s.plantsPending);
    set('plTypes', s.plantTypeCount);
    set('plLocations', s.plantLocations);
    set('plHealthy', s.healthyPlants);
    set('plCare', s.careNeeded);
    set('plCheck1', s.check1Done + '/' + s.check1Due);
    set('plCheck3', s.check3Done + '/' + s.check3Due);

    const tb = document.getElementById('admPlantTable');
    if (tb) {
        const types = s.plantTypes.map(pt => {
            const locs = {};
            tasks.forEach(t => { if ((t.plantName || t.plantType) === pt.name && t.area) locs[t.area] = true; });
            return { ...pt, locations: Object.keys(locs) };
        });
        tb.innerHTML = types.length === 0 ? '<tr><td colspan="7" class="empty-cell">No plantation records yet.</td></tr>' :
            types.map(pt => `<tr>
                <td><strong>${PLANT_ICONS[pt.type] || '🌱'} ${pt.name}</strong></td>
                <td>${pt.requested}</td>
                <td>${pt.planted}</td>
                <td>${Math.max(0, pt.requested - pt.planted)}</td>
                <td>${pt.tasks}</td>
                <td><small>${pt.locations.join(', ') || '-'}</small></td>
                <td><span class="status-badge status-${pt.planted >= pt.requested && pt.requested > 0 ? 'completed' : pt.planted > 0 ? 'pending' : 'open'}">${pt.planted >= pt.requested && pt.requested > 0 ? 'Completed' : pt.planted > 0 ? 'In Progress' : 'Pending'}</span></td>
            </tr>`).join('');
    }

    const hist = document.getElementById('plantHistoryList');
    if (hist) {
        const reqs = requests.slice().reverse();
        hist.innerHTML = reqs.length === 0 ? '<p style="color:var(--g600);font-size:.85rem">No plantation requests yet.</p>' :
            reqs.slice(0, 12).map(r => `<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.45rem .65rem;background:#fff;border:1px solid var(--g100);border-radius:6px;margin-bottom:.35rem;font-size:.82rem">
                <span style="color:var(--g800)">${PLANT_ICONS[r.plantType] || '🌱'} ${r.plantName || r.plantType} × ${r.quantity} <small style="color:var(--g600)">· ${r.area || ''}, ${r.city || ''}</small></span>
                <span class="status-badge status-${r.status}">${STATUS_LABELS[r.status] || r.status}</span>
            </div>`).join('');
    }

    const care = document.getElementById('careCheckList');
    if (care) {
        const byStatus = {};
        careRecords.forEach(c => byStatus[c.status] = (byStatus[c.status] || 0) + 1);
        care.innerHTML = `
            <div style="font-size:.83rem;color:var(--g700);margin-bottom:.6rem">
                1-month checks: <strong>${s.check1Done}/${s.check1Due}</strong> completed &nbsp;·&nbsp;
                3-month checks: <strong>${s.check3Done}/${s.check3Due}</strong> completed
            </div>
            ${Object.keys(byStatus).length === 0 ? '<p style="color:var(--g600);font-size:.85rem">No care records yet.</p>' :
            Object.entries(byStatus).map(([st, n]) => `<div style="display:flex;justify-content:space-between;padding:.4rem .65rem;background:#fff;border:1px solid var(--g100);border-radius:6px;margin-bottom:.3rem;font-size:.82rem">
                <span class="status-badge status-${st}">${STATUS_LABELS[st] || st}</span><strong style="color:var(--g800)">${n}</strong>
            </div>`).join('')}`;
    }
}

// ===== ACTIVITY HISTORY =====
function renderActivity() {
    const tb = document.getElementById('admActTable');
    if (!tb) return;
    const q = (document.getElementById('admSearchAct')?.value || '').toLowerCase();
    const fType = document.getElementById('admFilterActType')?.value || 'all';
    const fPerson = document.getElementById('admFilterActPerson')?.value || 'all';
    const dFrom = document.getElementById('admActFrom')?.value || '';
    const dTo = document.getElementById('admActTo')?.value || '';

    const people = {};
    activities.forEach(a => people[a.person || 'Admin'] = true);
    fillSelect('admFilterActPerson', Object.keys(people).sort(), true);

    const list = activities.slice().reverse().filter(a => {
        const d = (a.date || '').slice(0, 10);
        if (fType !== 'all' && (a.action || 'general') !== fType) return false;
        if (fPerson !== 'all' && (a.person || 'Admin') !== fPerson) return false;
        if (dFrom && d && d < dFrom) return false;
        if (dTo && d && d > dTo) return false;
        if (q) {
            const hay = ((a.text || '') + ' ' + (a.person || '') + ' ' + (a.ref || '') + ' ' + (a.status || '')).toLowerCase();
            if (hay.indexOf(q) < 0) return false;
        }
        return true;
    });

    tb.innerHTML = list.length === 0 ? '<tr><td colspan="7" class="empty-cell">No activity recorded yet.</td></tr>' :
        list.map(a => {
            const dt = a.date ? new Date(a.date) : null;
            return `<tr>
                <td><span class="status-badge status-${a.action === 'verification' || a.action === 'certificate' ? 'completed' : a.action === 'request' ? 'pending' : 'active'}">${(a.action || 'general').replace('_', ' ')}</span></td>
                <td>${a.person || 'Admin'}</td>
                <td><small>${dt ? dt.toLocaleDateString() : '-'}</small></td>
                <td><small>${dt ? dt.toLocaleTimeString() : '-'}</small></td>
                <td>${a.status ? '<span class="status-badge status-' + a.status + '">' + (STATUS_LABELS[a.status] || a.status) + '</span>' : '—'}</td>
                <td><small>${a.ref || '—'}</small></td>
                <td><small>${a.text || ''}</small></td>
            </tr>`;
        }).join('');

    const cnt = document.getElementById('admActCount');
    if (cnt) cnt.textContent = list.length + ' of ' + activities.length + ' activities';
}

function exportActivity() {
    if (!activities.length) return alert('No data.');
    let csv = 'Date,Time,Action,Person,Status,Reference,Details\n';
    activities.slice().reverse().forEach(a => {
        const d = a.date ? new Date(a.date) : null;
        csv += `"${d ? d.toLocaleDateString() : ''}","${d ? d.toLocaleTimeString() : ''}","${a.action || 'general'}","${a.person || 'Admin'}","${a.status || ''}","${a.ref || ''}","${(a.text || '').replace(/"/g, '""')}"\n`;
    });
    download(csv, 'activity-history.csv');
}

// ===== IMPACT / REQUEST CHART HELPERS =====
function renderImpactSummary(s) {
    const el = document.getElementById('impactSummary');
    if (!el) return;
    const rows = [
        ['🌍 CO₂ absorbed (est.)', (s.plantsPlanted * 22) + ' kg / year'],
        ['💧 Water retained (est.)', (s.plantsPlanted * 15) + ' L / year'],
        ['🌳 Trees planted', s.plantsPlanted],
        ['📍 Locations planted', s.areasCount],
        ['👥 Volunteers engaged', s.activeVols],
        ['📜 Certificates issued', s.certsAwarded],
        ['🌤️ Shade created (est.)', Math.round(s.plantsPlanted * 2) + ' m²']
    ];
    el.innerHTML = rows.map(r => `<div style="display:flex;justify-content:space-between;padding:.45rem .65rem;background:#fff;border:1px solid var(--g100);border-radius:6px;margin-bottom:.35rem;font-size:.83rem">
        <span style="color:var(--g700)">${r[0]}</span><strong style="color:var(--g800)">${r[1]}</strong></div>`).join('');
}

function renderRequestStatusDist() {
    const el = document.getElementById('requestStatusDist');
    if (!el) return;
    const counts = {};
    requests.forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);
    const total = requests.length || 1;
    el.innerHTML = requests.length === 0 ? '<p style="color:var(--g600);font-size:.85rem">No requests yet.</p>' :
        Object.entries(counts).map(([st, n]) => {
            const pct = Math.round((n / total) * 100);
            return `<div style="margin-bottom:.7rem">
                <div style="display:flex;justify-content:space-between;font-size:.79rem;margin-bottom:.22rem">
                    <span style="color:var(--g700)">${STATUS_LABELS[st] || st}</span>
                    <span style="color:var(--g700);font-weight:700">${n} (${pct}%)</span>
                </div>
                <div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div>
            </div>`;
        }).join('');
}
