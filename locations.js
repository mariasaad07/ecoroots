// ===== LOCATIONS PAGE =====
const SAMPLE_LOCATIONS = [
    { id: 'L1', name: 'F-9 Park', city: 'Islamabad', province: 'Islamabad', plantType: 'tree', plants: 45, status: 'healthy', date: '2026-01-15', lat: 33.70, lng: 73.05 },
    { id: 'L2', name: 'Shakarparian', city: 'Islamabad', province: 'Islamabad', plantType: 'flower', plants: 30, status: 'healthy', date: '2026-02-20', lat: 33.69, lng: 73.06 },
    { id: 'L3', name: 'Daman-e-Koh', city: 'Islamabad', province: 'Islamabad', plantType: 'tree', plants: 60, status: 'needs_care', date: '2026-03-10', lat: 33.75, lng: 73.06 },
    { id: 'L4', name: 'DHA Phase 5', city: 'Rawalpindi', province: 'Punjab', plantType: 'fruit', plants: 20, status: 'healthy', date: '2026-04-05', lat: 33.52, lng: 73.12 },
    { id: 'L5', name: 'Gulberg III', city: 'Lahore', province: 'Punjab', plantType: 'shrub', plants: 35, status: 'healthy', date: '2026-05-12', lat: 31.52, lng: 74.35 },
    { id: 'L6', name: 'Clifton', city: 'Karachi', province: 'Sindh', plantType: 'tree', plants: 50, status: 'needs_care', date: '2026-06-01', lat: 24.81, lng: 67.03 },
    { id: 'L7', name: 'Hayatabad', city: 'Peshawar', province: 'KPK', plantType: 'herb', plants: 15, status: 'healthy', date: '2026-07-18', lat: 34.01, lng: 71.58 },
    { id: 'L8', name: 'Satellite Town', city: 'Quetta', province: 'Balochistan', plantType: 'tree', plants: 25, status: 'pending', date: '2026-08-22', lat: 30.18, lng: 66.97 },
];

function getAllLocations() {
    const reqLocs = requests.filter(r => r.status !== 'rejected').map(r => ({
        id: r.id, name: r.area, city: r.city, province: getProvince(r.city),
        plantType: r.plantType, plants: r.quantity, status: r.status === 'completed' ? 'healthy' : 'pending',
        date: r.createdAt.split('T')[0]
    }));
    const careLocs = careRecords.map(c => ({
        id: c.id, name: c.location, city: '', province: '',
        plantType: 'tree', plants: 1, status: c.status, date: c.date
    }));
    return [...SAMPLE_LOCATIONS, ...reqLocs, ...careLocs];
}

function getProvince(city) {
    const map = { 'Islamabad': 'Islamabad', 'Rawalpindi': 'Punjab', 'Lahore': 'Punjab', 'Karachi': 'Sindh', 'Peshawar': 'KPK', 'Quetta': 'Balochistan' };
    return map[city] || 'Other';
}

function renderLocations() {
    const prov = document.getElementById('locFilterProvince').value;
    const city = document.getElementById('locFilterCity').value;
    const type = document.getElementById('locFilterType').value;
    const status = document.getElementById('locFilterStatus').value;

    let locs = getAllLocations();
    if (prov !== 'all') locs = locs.filter(l => l.province === prov);
    if (city !== 'all') locs = locs.filter(l => l.city === city);
    if (type !== 'all') locs = locs.filter(l => l.plantType === type);
    if (status !== 'all') locs = locs.filter(l => l.status === status);

    // Update city dropdown
    const cities = [...new Set(locs.map(l => l.city).filter(Boolean))];
    const citySelect = document.getElementById('locFilterCity');
    const curCity = citySelect.value;
    citySelect.innerHTML = '<option value="all">All Cities</option>' + cities.map(c => `<option ${c===curCity?'selected':''}>${c}</option>`).join('');

    // Map dots
    const mapDots = document.getElementById('mapDots');
    mapDots.innerHTML = locs.map(l => `<div class="map-dot" style="left:${30+Math.random()*40}%;top:${20+Math.random()*50}%" title="${l.name}, ${l.city} (${l.plants} plants)"></div>`).join('');

    // Location cards
    const c = document.getElementById('locationsList');
    c.innerHTML = locs.length === 0 ? '<p class="empty-state">No locations found.</p>' :
        locs.map(l => `
            <div class="location-card" onclick="showLocDetail('${l.id}')">
                <div class="loc-card-header"><span class="loc-icon">${PLANT_ICONS[l.plantType]||'🌱'}</span><span class="status-badge status-${l.status}">${STATUS_LABELS[l.status]||l.status}</span></div>
                <h4>${l.name}</h4>
                <p>${l.city}${l.province ? ', '+l.province : ''}</p>
                <p class="loc-plants">${l.plants} plants</p>
                <p class="loc-date">📅 ${l.date}</p>
            </div>
        `).join('');
}

window.showLocDetail = function(id) {
    const locs = getAllLocations();
    const l = locs.find(x => x.id === id); if (!l) return;
    document.getElementById('locModalTitle').textContent = l.name;
    document.getElementById('locModalBody').innerHTML = `
        <div class="loc-detail">
            <p><strong>Location:</strong> ${l.name}</p>
            <p><strong>City:</strong> ${l.city}</p>
            <p><strong>Province:</strong> ${l.province}</p>
            <p><strong>Plant Type:</strong> ${PLANT_ICONS[l.plantType]||'🌱'} ${(l.plantType||'').charAt(0).toUpperCase()+(l.plantType||'').slice(1)}</p>
            <p><strong>Number of Plants:</strong> ${l.plants}</p>
            <p><strong>Plantation Date:</strong> ${l.date}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${l.status}">${STATUS_LABELS[l.status]||l.status}</span></p>
        </div>
    `;
    document.getElementById('locModal').classList.remove('hidden');
};

document.getElementById('locFilterProvince')?.addEventListener('change', renderLocations);
document.getElementById('locFilterCity')?.addEventListener('change', renderLocations);
document.getElementById('locFilterType')?.addEventListener('change', renderLocations);
document.getElementById('locFilterStatus')?.addEventListener('change', renderLocations);

document.addEventListener('DOMContentLoaded', renderLocations);
