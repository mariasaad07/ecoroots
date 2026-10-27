// ===== MY IMPACT PAGE =====
function updateMyImpact() {
    const activeVol = DB.get('activeVolunteer', null);
    const vol = activeVol ? volunteers.find(v => v.id === activeVol) : null;
    const myTasks = vol ? tasks.filter(t => t.volunteers?.includes(vol.id)) : [];
    const completedTasks = myTasks.filter(t => t.status === 'completed');
    const volCerts = vol ? certificates.filter(c => c.volId === vol.id) : [];
    const areas = new Set(myTasks.map(t => t.area));

    document.getElementById('miPlants').textContent = vol?.plantsPlanted || 0;
    document.getElementById('miCompleted').textContent = completedTasks.length;
    document.getElementById('miAreas').textContent = areas.size;
    document.getElementById('miCurrent').textContent = myTasks.filter(t => t.status !== 'completed').length;

    // Badges - based on completed tasks
    const completedCount = vol?.tasksCompleted || 0;
    const badges = [];
    if (completedCount >= 1) badges.push({ icon: '🌱', name: 'First Plantation' });
    if (completedCount >= 5) badges.push({ icon: '🌿', name: '5 Completed Tasks' });
    if (completedCount >= 10) badges.push({ icon: '🌳', name: '10 Completed Tasks' });
    if (completedCount >= 25) badges.push({ icon: '🏆', name: '25 Completed Tasks' });
    if (completedCount >= 50) badges.push({ icon: '🌍', name: 'Environmental Champion' });
    if (vol?.plantsPlanted >= 10) badges.push({ icon: '💪', name: 'Green Thumb' });
    const bg = document.getElementById('myBadges');
    bg.innerHTML = badges.length === 0 ? '<p class="empty-state">Register as a volunteer and complete verified tasks to earn badges!</p>' :
        badges.map(b => `<div class="achievement"><span class="achievement-icon">${b.icon}</span><span class="achievement-name">${b.name}</span></div>`).join('');

    // Badge Progress
    const bp = document.getElementById('badgeProgress');
    if (!vol) { bp.innerHTML = '<p class="empty-state">Register as a volunteer to start tracking.</p>'; return; }
    const nextLevel = completedCount < 1 ? { name: 'First Plantation', target: 1, current: completedCount } :
        completedCount < 5 ? { name: '5 Completed Tasks', target: 5, current: completedCount } :
        completedCount < 10 ? { name: '10 Completed Tasks', target: 10, current: completedCount } :
        completedCount < 25 ? { name: '25 Completed Tasks', target: 25, current: completedCount } :
        { name: 'Environmental Champion', target: 50, current: completedCount };
    const pct = Math.min(100, Math.round((nextLevel.current / nextLevel.target) * 100));
    bp.innerHTML = `<div class="progress-info"><p>Next: <strong>${nextLevel.name}</strong></p><p>${nextLevel.current} / ${nextLevel.target}</p></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;

    // Certificates Section
    const certSection = document.getElementById('myCertsSection');
    if (certSection) {
        if (volCerts.length === 0) {
            certSection.innerHTML = '<p class="empty-state">No certificates earned yet. Complete tasks that get verified to earn certificates!</p>';
        } else {
            certSection.innerHTML = volCerts.map(c => `
                <div class="vol-cert-card">
                    <div class="vol-cert-info">
                        <h4>🏆 ${c.taskName}</h4>
                        <p>📍 ${c.location} · 🌱 ${c.plants} plants · 📅 ${new Date(c.completedAt || c.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <a href="certificate.html?id=${c.id}" class="btn btn-primary btn-sm" target="_blank">👁 View Certificate</a>
                </div>
            `).join('');
        }
    }

    // Certificate Image Preview
    const certPreview = document.getElementById('myCertsPreview');
    if (certPreview) {
        if (volCerts.length === 0) {
            certPreview.innerHTML = '';
        } else {
            certPreview.innerHTML = `
                <h4 style="color:var(--g800);margin:2rem 0 1rem">🖼️ Your Certificate</h4>
                <div class="cert-image-grid" id="miCertImgGrid"></div>
            `;
            setTimeout(() => {
                const grid = document.getElementById('miCertImgGrid');
                if (!grid) return;
                grid.innerHTML = volCerts.map(c => `
                    <a href="certificate.html?id=${c.id}" target="_blank" class="cert-image-card">
                        <div class="cert-img-frame">
                            <div class="cert-img-inner">
                                <div class="cert-img-hdr">
                                    <span class="cert-img-tree">🌳</span>
                                    <span class="cert-img-logo">🌱</span>
                                </div>
                                <div class="cert-img-org">ECO ROOTS</div>
                                <div class="cert-img-title">Certificate of Environmental Contribution</div>
                                <div class="cert-img-line"></div>
                                <div class="cert-img-awarded">This is to certify that</div>
                                <div class="cert-img-name">${c.volName}</div>
                                <div class="cert-img-msg">has successfully completed the plantation task</div>
                                <div class="cert-img-task">"${c.taskName}"</div>
                                <div class="cert-img-stats">
                                    <span>🌱 ${c.plants} Plants</span>
                                    <span>📍 ${c.location}</span>
                                    <span>📅 ${new Date(c.completedAt || c.issuedAt).toLocaleDateString()}</span>
                                </div>
                                <div class="cert-img-line"></div>
                                <div class="cert-img-sigs">
                                    <div class="cert-img-sig"><div class="cert-img-sigline"></div><small>Admin</small></div>
                                    <div class="cert-img-seal">✅</div>
                                    <div class="cert-img-sig"><div class="cert-img-sigline"></div><small>Platform</small></div>
                                </div>
                                <div class="cert-img-id">ID: ${c.id}</div>
                            </div>
                        </div>
                        <div class="cert-img-overlay">
                            <span class="cert-img-view-btn">👁 Click to View Full Certificate</span>
                        </div>
                    </a>
                `).join('');
            }, 50);
        }
    }

    // Activity History
    const ah = document.getElementById('activityHistory');
    if (activities.length === 0) { ah.innerHTML = '<p class="empty-state">No activities yet.</p>'; return; }
    ah.innerHTML = activities.slice(-10).reverse().map(a => `
        <div class="activity-item"><span class="activity-text">${a.text}</span><span class="activity-date">${new Date(a.date).toLocaleDateString()}</span></div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', updateMyImpact);
