// ===== SHARED DATA STORE =====
const DB = {
    get(k, d = []) { try { return JSON.parse(localStorage.getItem('gp_' + k)) || d; } catch { return d; } },
    set(k, v) { localStorage.setItem('gp_' + k, JSON.stringify(v)); }
};

const users = DB.get('users');
const requests = DB.get('requests');
const volunteers = DB.get('volunteers');
const tasks = DB.get('tasks');
const careRecords = DB.get('care');
const certificates = DB.get('certificates');
const activities = DB.get('activities');
let currentUser = DB.get('currentUser', null);

const STATUS_FLOW = ['submitted', 'under_review', 'location_verified', 'organizer_assigned', 'plantation_scheduled', 'completed'];
const TASK_FLOW = ['open', 'approved', 'assigned', 'in_progress', 'submitted_for_review', 'completed'];
const STATUS_LABELS = {
    submitted: 'Submitted', under_review: 'Under Review', location_verified: 'Location Verified',
    organizer_assigned: 'Organizer Assigned', plantation_scheduled: 'Scheduled',
    completed: 'Completed', rejected: 'Rejected', pending: 'Pending', approved: 'Approved',
    active: 'Active', open: 'Pending', full: 'Full', healthy: 'Healthy',
    needs_care: 'Needs Care', critical: 'Critical', watering: 'Needs Watering', diseased: 'Diseased',
    issued: 'Issued', verified: 'Verified', assigned: 'Assigned', in_progress: 'In Progress',
    submitted_for_review: 'Submitted for Review', inactive: 'Inactive', joined: 'Joined'
};
const PLANT_ICONS = { tree: '🌳', fruit: '🍎', flower: '🌸', shrub: '🌿', herb: '🌱', any: '🌱' };

function v(id) { return document.getElementById(id)?.value?.trim() || ''; }

function isTaskDone(t) { return t && (t.status === 'completed' || t.status === 'verified'); }
function isTaskVerified(t) { return !!t && (t.verification === 'verified' || t.status === 'verified'); }

function logActivity(text, meta) {
    meta = meta || {};
    const now = new Date();
    activities.push({
        text,
        date: now.toISOString(),
        action: meta.action || 'general',
        person: meta.person || 'Admin',
        status: meta.status || '',
        ref: meta.ref || ''
    });
    if (activities.length > 300) activities.shift();
    DB.set('activities', activities);
}

// ===== VOLUNTEER HELPERS =====
function getVolunteerTasks(volId) {
    return tasks.filter(t => (t.volunteers || []).includes(volId) || t.assignedTo === volId);
}
function getVolunteerStats(volId) {
    const vol = volunteers.find(x => x.id === volId);
    if (!vol) return null;
    const myTasks = getVolunteerTasks(volId);
    const completed = myTasks.filter(isTaskDone).length;
    const pending = myTasks.filter(t => ['open', 'approved', 'assigned', 'in_progress', 'submitted_for_review'].includes(t.status)).length;
    const plants = myTasks.reduce((s, t) => s + (t.quantity || t.plantsPerVol || 0), 0);
    const certs = certificates.filter(c => c.volId === volId);
    const areas = new Set(myTasks.filter(t => t.area).map(t => t.area));
    return {
        vol, totalJoined: myTasks.length, completed, pending,
        plantsPlanted: vol.plantsPlanted || plants, certificates: certs.length,
        areasCovered: areas.size, certs, myTasks,
        hours: vol.hours || myTasks.filter(isTaskDone).reduce((s, t) => s + (t.estimatedHours || 4), 0),
        badges: vol.badges || []
    };
}

// ===== CUSTOMER HELPERS =====
function getCustomers() {
    const map = {};
    requests.forEach(r => {
        const key = (r.email || r.name || 'unknown').toLowerCase();
        if (!map[key]) {
            map[key] = {
                name: r.name || 'Unknown', email: r.email || '-', phone: r.phone || '-',
                requests: 0, approved: 0, rejected: 0, pending: 0, plants: 0,
                cities: {}, areas: {}, first: '', last: '', list: []
            };
        }
        const c = map[key];
        c.requests++;
        if (r.status === 'rejected') c.rejected++;
        else if (['location_verified', 'organizer_assigned', 'plantation_scheduled', 'completed'].includes(r.status)) c.approved++;
        else c.pending++;
        c.plants += r.quantity || 0;
        if (r.city) c.cities[r.city] = true;
        if (r.area) c.areas[r.area] = true;
        const d = r.createdAt || r.submittedAt || '';
        if (d) {
            if (!c.first || d < c.first) c.first = d;
            if (!c.last || d > c.last) c.last = d;
        }
        c.list.push(r);
    });
    return Object.keys(map).map(k => {
        const c = map[k];
        c.cities = Object.keys(c.cities);
        c.areas = Object.keys(c.areas);
        return c;
    }).sort((a, b) => (b.last || '').localeCompare(a.last || ''));
}

// ===== ADMIN STATISTICS HELPERS =====
function getAdminStats() {
    const activeVols = volunteers.filter(x => x.status === 'approved' || x.status === 'active');
    const pendingVols = volunteers.filter(x => x.status === 'pending');
    const doneTasks = tasks.filter(isTaskDone);
    const verifiedTasks = tasks.filter(isTaskVerified);

    const plantsRequested = tasks.reduce((s, t) => s + (t.quantity || 0), 0) + requests.reduce((s, r) => s + (r.quantity || 0), 0);
    const plantsPlanted = doneTasks.reduce((s, t) => s + (t.quantity || 0), 0);
    const totalPlants = plantsRequested;

    const assignedTasks = tasks.filter(t => t.assignedTo || (t.volunteers || []).length > 0);
    const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'approved');
    const pendingVerifications = tasks.filter(t => t.status === 'submitted_for_review' || (t.status === 'completed' && t.verification !== 'verified'));

    const reqPending = requests.filter(r => ['submitted', 'under_review'].includes(r.status)).length;
    const reqApproved = requests.filter(r => ['location_verified', 'organizer_assigned', 'plantation_scheduled', 'completed'].includes(r.status)).length;
    const reqRejected = requests.filter(r => r.status === 'rejected').length;
    const reqCompleted = requests.filter(r => r.status === 'completed').length;

    const customers = getCustomers();
    const areaSet = {};
    doneTasks.forEach(t => { if (t.area) areaSet[t.area] = true; });
    requests.forEach(r => { if (r.area && r.status === 'completed') areaSet[r.area] = true; });
    const areasCovered = Object.keys(areaSet);

    const plantTypeMap = {};
    tasks.forEach(t => {
        const key = t.plantName || t.plantType || 'Other';
        if (!plantTypeMap[key]) plantTypeMap[key] = { name: key, type: t.plantType || 'tree', requested: 0, planted: 0, tasks: 0 };
        plantTypeMap[key].requested += t.quantity || 0;
        plantTypeMap[key].tasks++;
        if (isTaskDone(t)) plantTypeMap[key].planted += t.quantity || 0;
    });
    const plantTypes = Object.values(plantTypeMap);

    const healthyPlants = careRecords.filter(c => c.status === 'healthy').length;
    const careNeeded = careRecords.filter(c => ['needs_care', 'critical', 'watering', 'diseased'].includes(c.status)).length;

    const DAY = 86400000, now = Date.now();
    let check1Due = 0, check1Done = 0, check3Due = 0, check3Done = 0;
    doneTasks.forEach(t => {
        const end = new Date(t.verifiedAt || t.completedAt || t.createdAt || Date.now()).getTime();
        const linked = careRecords.filter(c => c.taskId === t.id || (c.location && c.location === t.area));
        if (now - end >= 30 * DAY) {
            check1Due++;
            if (linked.some(c => new Date(c.date || c.createdAt).getTime() >= end + 30 * DAY)) check1Done++;
        }
        if (now - end >= 90 * DAY) {
            check3Due++;
            if (linked.some(c => new Date(c.date || c.createdAt).getTime() >= end + 90 * DAY)) check3Done++;
        }
    });

    const cityMap = {};
    volunteers.forEach(x => { cityMap[x.city] = (cityMap[x.city] || 0) + 1; });
    const monthMap = {}, yearMap = {};
    const bump = (m, k) => m[k] = (m[k] || 0) + 1;
    volunteers.forEach(x => {
        const d = new Date(x.createdAt);
        bump(monthMap, d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    });
    const plantByMonth = {}, plantByYear = {};
    doneTasks.forEach(t => {
        const d = new Date(t.verifiedAt || t.completedAt || t.createdAt);
        const mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        plantByMonth[mk] = (plantByMonth[mk] || 0) + (t.quantity || 0);
        bump(plantByYear, String(d.getFullYear()));
    });
    volunteers.forEach(x => { const d = new Date(x.createdAt); bump(yearMap, String(d.getFullYear())); });

    const topContributors = [...volunteers]
        .map(x => ({ ...x, completedTasks: x.tasksCompleted || 0, totalPlants: x.plantsPlanted || 0 }))
        .sort((a, b) => (b.completedTasks + b.totalPlants / 10) - (a.completedTasks + a.totalPlants / 10))
        .slice(0, 10);

    const certsAwarded = certificates.filter(c => c.status === 'issued' || c.status === 'verified').length;
    const certsPending = tasks.filter(t => isTaskDone(t) && !(certificates.some(c => c.taskId === t.id))).length;

    return {
        totalVols: volunteers.length,
        activeVols: activeVols.length,
        pendingVols: pendingVols.length,
        totalTasks: tasks.length,
        assignedTasks: assignedTasks.length,
        completedTasks: doneTasks.length,
        verifiedTasks: verifiedTasks.length,
        openTasks: openTasks.length,
        availableTasks: openTasks.length,
        pendingVerifications: pendingVerifications.length,
        totalPlants,
        plantsRequested,
        plantsPlanted,
        plantsPending: Math.max(0, plantsRequested - plantsPlanted),
        totalCerts: certificates.length,
        certsAwarded, certsPending,
        totalUsers: users.length,
        totalCustomers: customers.length,
        customers,
        reqPending, reqApproved, reqRejected, reqCompleted, totalRequests: requests.length,
        areasCovered, areasCount: areasCovered.length,
        plantTypes, plantTypeCount: plantTypes.length,
        plantLocations: areasCovered.length,
        healthyPlants, careNeeded,
        check1Due, check1Done, check3Due, check3Done,
        cityMap, monthMap, yearMap, plantByMonth, plantByYear,
        completedActivities: activities.length,
        topContributors
    };
}

// Certificate Image Generator
function generateCertImage(cert, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width || 400;
    canvas.height = height || 280;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, w, h);

    const m = 8;
    ctx.fillStyle = '#fefce8';
    ctx.fillRect(m, m, w - m*2, h - m*2);

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.strokeRect(m + 4, m + 4, w - m*2 - 8, h - m*2 - 8);

    const corners = [[m+12,m+12],[w-m-12,m+12],[m+12,h-m-12],[w-m-12,h-m-12]];
    ctx.fillStyle = '#92400e';
    corners.forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill(); });

    const cx = w/2;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 3, m + 18, 6, 12);
    ctx.beginPath();
    ctx.moveTo(cx, m + 2);
    ctx.lineTo(cx + 14, m + 18);
    ctx.lineTo(cx - 14, m + 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ECO ROOTS', cx, m + 38);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText('Certificate of', cx, m + 56);
    ctx.fillText('Environmental Contribution', cx, m + 72);

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 80, m + 82);
    ctx.lineTo(cx + 80, m + 82);
    ctx.stroke();

    ctx.fillStyle = '#92400e';
    ctx.font = '7px Arial';
    ctx.fillText('THIS IS TO CERTIFY THAT', cx, m + 96);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 18px Georgia';
    ctx.fillText(cert.volName || 'Volunteer', cx, m + 118);

    ctx.fillStyle = '#92400e';
    ctx.font = '7px Arial';
    ctx.fillText('has successfully completed the plantation task', cx, m + 132);

    ctx.fillStyle = '#78350f';
    ctx.font = 'italic bold 10px Georgia';
    ctx.fillText('"' + (cert.taskName || 'Task') + '"', cx, m + 148);

    ctx.fillStyle = '#92400e';
    ctx.font = '8px Arial';
    const statsY = m + 165;
    ctx.fillText('\uD83C\uDF31 ' + (cert.plants || 0) + ' Plants   \uD83D\uDCCD ' + (cert.location || '') + '   \uD83D\uDCC5 ' + new Date(cert.completedAt || cert.issuedAt).toLocaleDateString(), cx, statsY);

    ctx.strokeStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(cx - 80, m + 175);
    ctx.lineTo(cx + 80, m + 175);
    ctx.stroke();

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, h - m - 25); ctx.lineTo(120, h - m - 25); ctx.stroke();
    ctx.fillStyle = '#92400e'; ctx.font = '6px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Admin / Organizer', 80, h - m - 18);

    ctx.font = '16px Arial';
    ctx.fillText('\u2705', cx, h - m - 18);

    ctx.beginPath(); ctx.moveTo(w - 120, h - m - 25); ctx.lineTo(w - 40, h - m - 25); ctx.stroke();
    ctx.fillText('ECO Roots', w - 80, h - m - 18);

    ctx.fillStyle = '#92400e';
    ctx.font = '6px Arial';
    ctx.fillText('ID: ' + (cert.id || ''), cx, h - m - 6);

    return canvas.toDataURL('image/png');
}

// Nav toggle
document.getElementById('navToggle')?.addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('active');
});

// Update navigation based on login state
(function(){
    const navLinks = document.getElementById('navLinks');
    if(!navLinks) return;
    const user = DB.get('currentUser', null);
    navLinks.querySelectorAll('.nav-auth').forEach(el => el.remove());
    if(user){
        const li = document.createElement('li');
        li.className = 'nav-auth';
        li.innerHTML = `<span style="color:var(--g700);font-weight:600;font-size:.85rem">Hi, ${user.name.split(' ')[0]}</span> <button onclick="window.signOut()" class="btn btn-outline btn-sm" style="padding:.3rem .6rem;font-size:.75rem">Sign Out</button>`;
        navLinks.appendChild(li);
    } else {
        const li1 = document.createElement('li');
        li1.className = 'nav-auth';
        li1.innerHTML = `<a href="register.html">Register</a>`;
        navLinks.appendChild(li1);
        const li2 = document.createElement('li');
        li2.className = 'nav-auth';
        li2.innerHTML = `<a href="signin.html">Sign In</a>`;
        navLinks.appendChild(li2);
    }
})();

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Secret admin access: click logo 5 times within 2 seconds
(function(){
    let clicks = 0;
    let timer = null;
    const logo = document.querySelector('.nav-logo');
    if(logo){
        logo.addEventListener('click', function(e){
            e.preventDefault();
            clicks++;
            clearTimeout(timer);
            if(clicks >= 5){
                clicks = 0;
                window.location.href = 'admin.html';
            }
            timer = setTimeout(function(){ clicks = 0; }, 2000);
        });
    }
})();

/* ===== Language selector (English UI only) ===== */
(function () {
    var LANGS = [
        { code: 'en', name: 'English' },
        { code: 'ur', name: 'Urdu' },
        { code: 'ar', name: 'Arabic' },
        { code: 'fr', name: 'French' },
        { code: 'es', name: 'Spanish' },
        { code: 'zh', name: 'Chinese' }
    ];
    var KEY = 'gp_lang';
    var current = 'en';
    try { if (localStorage.getItem(KEY) === 'en') current = 'en'; } catch (e) { }

    function markup() {
        var html = '<button type="button" class="nav-lang-btn" aria-haspopup="true" aria-expanded="false" title="Change language">' +
            '<span class="lang-globe" aria-hidden="true">&#127760;</span>' +
            '<span class="lang-current">English</span>' +
            '<span class="lang-caret" aria-hidden="true">&#9662;</span></button>' +
            '<ul class="nav-lang-menu" role="menu">';
        LANGS.forEach(function (l) {
            if (l.code === current) {
                html += '<li class="active" role="none"><button type="button" role="menuitem" data-lang="' + l.code + '">' +
                    '<span>' + l.name + '</span><span class="lang-check">&#10003;</span></button></li>';
            } else {
                html += '<li role="none"><button type="button" role="menuitem" disabled title="Coming soon">' +
                    '<span>' + l.name + '</span><span class="lang-soon">Soon</span></button></li>';
            }
        });
        html += '<li class="lang-note" role="none">English is the only available language right now. More languages are coming soon.</li></ul>';
        return html;
    }

    function closeAll() {
        document.querySelectorAll('.nav-lang.open').forEach(function (n) {
            n.classList.remove('open');
            var b = n.querySelector('.nav-lang-btn');
            if (b) b.setAttribute('aria-expanded', 'false');
        });
    }

    function init() {
        document.querySelectorAll('.nav-links').forEach(function (ul) {
            if (ul.querySelector('.nav-lang')) return;
            var li = document.createElement('li');
            li.className = 'nav-lang';
            li.innerHTML = markup();
            ul.appendChild(li);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        var btn = t.closest('.nav-lang-btn');
        if (btn) {
            var li = btn.parentNode;
            var wasOpen = li.classList.contains('open');
            closeAll();
            if (!wasOpen) { li.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
            return;
        }
        if (!t.closest('.nav-lang')) closeAll();
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
})();
