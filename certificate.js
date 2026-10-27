// ===== CERTIFICATE PAGE =====
(function() {
    const params = new URLSearchParams(window.location.search);
    const certId = params.get('id');
    const muteCheckbox = document.getElementById('muteCelebration');
    let isMuted = localStorage.getItem('certMute') === 'true';
    if (muteCheckbox) {
        muteCheckbox.checked = isMuted;
        muteCheckbox.addEventListener('change', () => {
            isMuted = muteCheckbox.checked;
            localStorage.setItem('certMute', isMuted);
        });
    }

    if (!certId) { showDemoCertificate(); return; }

    const cert = certificates.find(c => c.id === certId);
    if (!cert) { showNotFound(); return; }

    document.getElementById('certVolName').textContent = cert.volName;
    document.getElementById('certTaskName').textContent = cert.taskName;
    document.getElementById('certPlants').textContent = cert.plants + ' plants';
    document.getElementById('certLocation').textContent = cert.location;
    document.getElementById('certDate').textContent = new Date(cert.completedAt || cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('certUniqueId').textContent = cert.id;

    if (cert.status === 'issued') {
        document.getElementById('certVerification').innerHTML = '<span>✅</span><span>Verified & Issued by ECO Roots</span>';
        // Only celebrate if this is a newly awarded certificate
        const isNewAward = !sessionStorage.getItem('certViewed_' + cert.id);
        if (isNewAward) {
            sessionStorage.setItem('certViewed_' + cert.id, 'true');
            setTimeout(() => celebrate(), 400);
        }
    } else {
        document.getElementById('certVerification').innerHTML = '<span>⏳</span><span>Pending Verification</span>';
        document.getElementById('certVerification').style.background = '#fef3c7';
        document.getElementById('certVerification').style.color = '#92400e';
    }

    function showDemoCertificate() {
        document.getElementById('certPage').classList.remove('hidden');
        document.getElementById('certNotFound').classList.add('hidden');
        document.getElementById('certVolName').textContent = 'MARIA SAAD';
        document.getElementById('certTaskName').textContent = 'F-9 Park Tree Plantation Drive';
        document.getElementById('certPlants').textContent = '15 plants';
        document.getElementById('certLocation').textContent = 'F-9 Park, Islamabad';
        document.getElementById('certDate').textContent = 'January 15, 2026';
        document.getElementById('certUniqueId').textContent = 'CERT-DEMO001';
        document.getElementById('certVerification').innerHTML = '<span>✅</span><span>Verified & Issued by ECO Roots</span>';
        // Demo always celebrates
        setTimeout(() => celebrate(), 600);
    }

    function showNotFound() {
        document.getElementById('certPage').classList.add('hidden');
        document.getElementById('certNotFound').classList.remove('hidden');
    }

    // ===== CELEBRATION: Party Poppers + Confetti + Balloons + Sound =====
    function celebrate() {
        // Inject keyframes if not already present
        if (!document.getElementById('cert-celebrate-style')) {
            const style = document.createElement('style');
            style.id = 'cert-celebrate-style';
            style.textContent = `
                @keyframes popper-burst {
                    0% { transform: translateY(0) scale(0.3) rotate(0deg); opacity: 1; }
                    50% { opacity: 1; }
                    100% { transform: translateY(350px) scale(1) rotate(400deg); opacity: 0; }
                }
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                @keyframes balloon-rise {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
                }
                @keyframes sparkle {
                    0%,100% { opacity: 0; transform: scale(0); }
                    50% { opacity: 1; transform: scale(1); }
                }
                @keyframes congrats-pop {
                    0% { transform: scale(0) translateY(-20px); opacity: 0; }
                    50% { transform: scale(1.1) translateY(0); }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes congrats-fade {
                    0% { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-20px); }
                }
                .cert-popper{position:fixed;pointer-events:none;z-index:10000;font-size:2rem}
                .cert-confetti{position:fixed;pointer-events:none;z-index:9999}
                .cert-balloon{position:fixed;pointer-events:none;z-index:9998;font-size:2.5rem}
                .cert-sparkle{position:fixed;pointer-events:none;z-index:10001;font-size:1.2rem}
                .cert-congrats{position:fixed;top:0;left:0;right:0;z-index:10002;text-align:center;padding:1.5rem;pointer-events:none}
                .cert-congrats-text{display:inline-block;background:linear-gradient(135deg,#dceeff,#c7e7ff);color:#0f8fe6;padding:1rem 2rem;border-radius:50px;font-size:1rem;font-weight:700;border:1px solid #9fd6ff;box-shadow:0 8px 30px rgba(42,163,255,.25);animation:congrats-pop .6s ease-out forwards;letter-spacing:.5px}
            `;
            document.head.appendChild(style);
        }

        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:10000;overflow:hidden';
        document.body.appendChild(container);

        // 0. Congratulatory message
        const congrats = document.createElement('div');
        congrats.className = 'cert-congrats';
        congrats.innerHTML = '<div class="cert-congrats-text">🎉 Congratulations! Your Environmental Contribution Certificate has been awarded! 🌳</div>';
        container.appendChild(congrats);
        setTimeout(() => {
            congrats.style.animation = 'congrats-fade 1s ease-out forwards';
        }, 4000);
        setTimeout(() => congrats.remove(), 5500);

        // 1. Party Poppers bursting from top corners
        const popperEmojis = ['🎉','🎊','🥳','🎇','🎆','🎉','🎊','🥳'];
        const popperPositions = [
            {x: '2%', y: '0'}, {x: '12%', y: '0'}, {x: '22%', y: '0'},
            {x: '78%', y: '0'}, {x: '88%', y: '0'}, {x: '98%', y: '0'},
            {x: '0', y: '3%'}, {x: '100%', y: '3%'}
        ];
        popperPositions.forEach((pos, i) => {
            setTimeout(() => {
                const popper = document.createElement('div');
                popper.className = 'cert-popper';
                popper.textContent = popperEmojis[i % popperEmojis.length];
                popper.style.cssText = `left:${pos.x};top:${pos.y};animation:popper-burst ${2+Math.random()*1.5}s ease-out forwards`;
                container.appendChild(popper);
            }, i * 100);
        });

        // 2. Confetti pieces falling from top
        const confettiColors = ['#38bdf8','#0284c7','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#f97316','#14b8a6','#eab308'];
        for (let i = 0; i < 80; i++) {
            const piece = document.createElement('div');
            const size = Math.random() * 10 + 4;
            piece.style.cssText = `
                position:fixed;top:-10px;left:${Math.random()*100}%;
                width:${size}px;height:${size*0.6}px;
                background:${confettiColors[Math.floor(Math.random()*confettiColors.length)]};
                border-radius:${Math.random()>0.5?'50%':'2px'};
                z-index:9999;pointer-events:none;
                animation:confetti-fall ${Math.random()*3+2}s linear forwards;
                animation-delay:${Math.random()*2.5}s;
                opacity:${Math.random()*0.5+0.5};
            `;
            container.appendChild(piece);
        }

        // 3. Balloons floating up
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const balloon = document.createElement('div');
                balloon.className = 'cert-balloon';
                balloon.textContent = '🎈';
                balloon.style.cssText = `
                    left:${10+i*16}%;bottom:-10px;
                    animation:balloon-rise ${4+Math.random()*2}s ease-out forwards;
                    animation-delay:${i*0.25}s;
                    filter:drop-shadow(0 4px 6px rgba(0,0,0,.2));
                `;
                container.appendChild(balloon);
            }, i * 250);
        }

        // 4. Sparkles around the certificate
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'cert-sparkle';
                sparkle.textContent = ['✨','⭐','🌟','💫','✨'][Math.floor(Math.random()*5)];
                sparkle.style.cssText = `
                    left:${15+Math.random()*70}%;
                    top:${15+Math.random()*50}%;
                    animation:sparkle ${0.8+Math.random()*0.5}s ease-in-out forwards;
                    animation-delay:${Math.random()*0.5}s;
                `;
                container.appendChild(sparkle);
            }, 300 + i * 80);
        }

        // 5. Celebration sound effect (only if not muted)
        if (!isMuted) {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                // Pop sound
                const popOsc = ctx.createOscillator();
                const popGain = ctx.createGain();
                popOsc.connect(popGain); popGain.connect(ctx.destination);
                popOsc.frequency.setValueAtTime(800, ctx.currentTime);
                popOsc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
                popGain.gain.setValueAtTime(0.3, ctx.currentTime);
                popGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                popOsc.start(ctx.currentTime); popOsc.stop(ctx.currentTime + 0.15);

                // Victory melody
                const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    const t = ctx.currentTime + 0.2 + i * 0.12;
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                    osc.start(t); osc.stop(t + 0.3);
                });
            } catch(e) {}
        }

        // Cleanup
        setTimeout(() => container.remove(), 7000);
    }

    // Download as image
    document.getElementById('certDownloadBtn')?.addEventListener('click', async () => {
        const frame = document.getElementById('certFrame');
        try {
            const canvas = await html2canvas(frame, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `ECO_Roots_Certificate_${cert?.id || 'MARIA_SAAD'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            alert('Download failed. Please use the Print button and save as PDF.');
        }
    });

    // Share
    document.getElementById('certShareBtn')?.addEventListener('click', () => {
        const shareUrl = window.location.href;
        const shareText = `I earned a Certificate of Environmental Contribution from ECO Roots! 🌳\nTask: ${cert?.taskName || 'F-9 Park Tree Plantation Drive'}\nPlants: ${cert?.plants || 15}`;
        if (navigator.share) {
            navigator.share({ title: 'ECO Roots Certificate', text: shareText, url: shareUrl }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText + '\n' + shareUrl).then(() => alert('Certificate link copied to clipboard!'));
        } else {
            prompt('Copy this link to share:', shareUrl);
        }
    });
})();