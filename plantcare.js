// ===== PLANT CARE PAGE =====
function renderCareRecords() {
    const c = document.getElementById('careRecordsList');
    if (careRecords.length === 0) { c.innerHTML = '<p class="empty-state">No plant records yet.</p>'; return; }
    c.innerHTML = careRecords.slice().reverse().map(r => `
        <div class="care-record-card">
            <div class="care-record-header">
                <h4>${PLANT_ICONS[r.plantType]||'🌱'} ${r.plantName}</h4>
                <span class="status-badge status-${r.status}">${STATUS_LABELS[r.status]}</span>
            </div>
            <p>📍 ${r.location} · 📅 ${r.date}</p>
            ${r.notes ? `<p class="care-notes">${r.notes}</p>` : ''}
            ${r.nextDate ? `<p class="care-next">Next check: ${r.nextDate}</p>` : ''}
        </div>
    `).join('');
}

document.getElementById('careForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const record = {
        id: 'CARE-' + Date.now().toString(36).toUpperCase(),
        plantName: v('carePlantName'), location: v('careLocation'),
        status: v('careStatus'), date: v('careDate'), notes: v('careNotes'),
        nextDate: v('careNextDate'), createdAt: new Date().toISOString()
    };
    careRecords.push(record); DB.set('care', careRecords);
    logActivity(`🩺 Care update added for ${record.plantName}: ${STATUS_LABELS[record.status]}`);
    document.getElementById('careForm').reset();
    document.getElementById('careSuccess').classList.remove('hidden');
    setTimeout(() => document.getElementById('careSuccess').classList.add('hidden'), 3000);
    renderCareRecords();
});

document.addEventListener('DOMContentLoaded', renderCareRecords);
