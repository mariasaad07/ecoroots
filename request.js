// ===== REQUEST PAGE =====
document.getElementById('requestForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const id = 'REQ-' + Date.now().toString(36).toUpperCase();
    const r = {
        id, name: v('reqName'), phone: v('reqPhone'), email: v('reqEmail'),
        city: v('reqCity'), area: v('reqArea'), location: v('reqLocation'),
        plantType: v('reqPlantType'), plantName: v('reqPlantName'),
        quantity: parseInt(v('reqQuantity')) || 1, date: v('reqDate'),
        reason: v('reqReason'), details: v('reqDetails'),
        status: 'submitted', history: [{ status: 'submitted', date: new Date().toISOString() }],
        createdAt: new Date().toISOString()
    };
    requests.push(r);
    DB.set('requests', requests);

    // Auto-create task from customer request
    const task = {
        id: 'TASK-' + Date.now().toString(36).toUpperCase(),
        name: `${r.plantType.charAt(0).toUpperCase() + r.plantType.slice(1)} Plantation - ${r.area}`,
        area: r.area,
        city: r.city,
        location: r.location,
        date: r.date,
        plantType: r.plantType,
        plantName: r.plantName,
        quantity: r.quantity,
        customerName: r.name,
        customerPhone: r.phone,
        customerEmail: r.email,
        reason: r.reason,
        details: r.details,
        requestId: r.id,
        maxVol: Math.max(2, Math.ceil(r.quantity / 5)),
        desc: `Plantation request by ${r.name}. ${r.quantity} ${r.plantType}(s) needed in ${r.area}, ${r.city}. ${r.details || ''}`,
        status: 'open',
        volunteers: [],
        joined: 0,
        createdAt: new Date().toISOString()
    };
    tasks.push(task);
    DB.set('tasks', tasks);

    logActivity(`🌱 Plant request submitted by ${r.name} for ${r.quantity} ${r.plantType}(s) in ${r.area}, ${r.city}. Task created for volunteers.`);
    document.getElementById('requestForm').classList.add('hidden');
    document.getElementById('requestSuccess').classList.remove('hidden');
    document.getElementById('newReqId').textContent = id;
});