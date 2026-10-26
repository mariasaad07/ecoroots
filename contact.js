// ===== CONTACT PAGE =====
document.getElementById('contactForm')?.addEventListener('submit', e => {
    e.preventDefault();
    logActivity(`📞 Contact message from ${v('contactName')}: ${v('contactSubject')}`);
    document.getElementById('contactForm').classList.add('hidden');
    document.getElementById('contactSuccess').classList.remove('hidden');
});
