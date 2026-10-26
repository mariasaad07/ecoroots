// ===== HOME PAGE =====
function animateNum(id, target, duration) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = 0;
    const startTime = performance.now();
    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / (duration || 2000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function updateHome() {
    const plants = requests.reduce((s, r) => s + (r.quantity || 0), 0) || tasks.reduce((s, t) => s + (t.quantity || 0), 0);
    const areas = new Set([...tasks.map(t => t.area), ...requests.map(r => r.area)]);
    const completed = tasks.filter(t => t.status === 'completed').length;
    const volCount = volunteers.length;

    const plantTarget = plants > 0 ? plants : 1247;
    const areaTarget = areas.size > 0 ? areas.size : 48;
    const volTarget = volCount > 0 ? volCount : 342;
    const completedTarget = completed > 0 ? completed : 89;

    animateNum('hPlants', plantTarget, 2500);
    animateNum('hAreas', areaTarget, 2000);
    animateNum('hVolunteers', volTarget, 2000);
    animateNum('hProjects', completedTarget, 2000);

    // Featured Areas
    const areaMap = {};
    [...tasks, ...requests].forEach(r => {
        const area = r.area;
        if (!area) return;
        if (!areaMap[area]) areaMap[area] = { name: area, city: r.city, plants: 0, status: 'active' };
        areaMap[area].plants += r.quantity || 0;
    });
    let areaList = Object.values(areaMap).slice(0, 6);
    if (areaList.length === 0) {
        areaList = [
            { name: 'F-9 Park', city: 'Islamabad', plants: 120, status: 'active' },
            { name: 'Shalimar Gardens', city: 'Lahore', plants: 85, status: 'active' },
            { name: 'Jinnah Park', city: 'Rawalpindi', plants: 65, status: 'active' },
            { name: 'Bagh-e-Jinnah', city: 'Karachi', plants: 95, status: 'active' },
            { name: 'Hayatabad Park', city: 'Peshawar', plants: 45, status: 'active' },
            { name: 'Patriotic Park', city: 'Quetta', plants: 30, status: 'active' },
        ];
    }
    const container = document.getElementById('featuredAreas');
    if (container) {
        container.innerHTML = areaList.map(a => `
            <div class="area-card">
                <div style="font-size:2rem;margin-bottom:.5rem">🌳</div>
                <h4>📍 ${a.name}</h4>
                <p>${a.city}</p>
                <p class="area-plants">${a.plants} plants</p>
                <span class="status-badge status-active">${a.status}</span>
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', updateHome);