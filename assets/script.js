const USER_ID = "620895564715786240";
let mainPageHTML = null;

function applyStaggerAnimation() {
    const container = document.getElementById('page-content');
    const items = container.querySelectorAll('.stagger-item');
    
    container.classList.remove('appear');
    
    items.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.03}s`; 
    });

    void container.offsetWidth; 
    container.classList.add('appear');
}

function renderStorage(storageData) {
    let storageHtml = '<div class="storage-list">';
    storageData.forEach(s => {
        storageHtml += `<div class="storage-sub"><span>${s.title}</span>${s.desc}</div>`;
    });
    return storageHtml + '</div>';
}

async function loadPage(pageKey) {
    const container = document.getElementById('page-content');
    if (!mainPageHTML) mainPageHTML = container.innerHTML;

    container.classList.add('fade-out');
    
    setTimeout(async () => {
        container.classList.remove('fade-out', 'appear');
        
        if (pageKey === 'main') {
            container.innerHTML = mainPageHTML;
        } else {
            try {
                const response = await fetch('assets/data.json');
                const data = await response.json();
                const pageData = data[pageKey];

                let content = `
                    <header class="stagger-item">
                        <a href="#" onclick="loadPage('main')" class="back-btn"><i class="fa-solid fa-chevron-left"></i> Вернуться</a>
                        <h1 class="nickname">${pageData.title}</h1>
                        <p class="bio">${pageData.subtitle}</p>
                    </header>`;

                pageData.sections.forEach(section => {
                    content += `<h2 class="section-title stagger-item">${section.sectionTitle}</h2>`;
                    content += `<div class="bento-grid stagger-item">`; 
                    
                    section.items.forEach(item => {
                        content += `
                            <div class="bento-item ${item.type === 'wide' ? 'wide' : ''}">
                                <div class="label"><i class="fa-solid ${item.icon}"></i> ${item.label}</div>
                                <div class="val">
                                    ${item.val || ''}
                                    ${item.small ? `<br><small>${item.small}</small>` : ''}
                                    ${item.isStorage ? renderStorage(item.storage) : ''}
                                </div>
                            </div>`;
                    });
                    content += `</div>`;
                });
                container.innerHTML = content;
            } catch (e) {
                console.error("Ошибка:", e);
                container.innerHTML = `<p style="color:red; text-align:center; margin-top:50px;">Ошибка загрузки данных</p>`;
            }
        }
        window.scrollTo(0, 0); 
        applyStaggerAnimation();
        updateLanyard(); 
    }, 400);
}

async function updateLanyard() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}`);
        const json = await response.json();
        if (!json.success) return;

        const data = json.data;
        const dot = document.getElementById('discord-status');
        const textElem = document.getElementById('status-text');

        const statusColors = {
            online: '#43b581',
            idle: '#faa61a',
            dnd: '#f04747',
            offline: '#747f8d'
        };
        const statusNames = {
            online: 'Онлайн',
            idle: 'АФК',
            dnd: 'Не беспокоить',
            offline: 'Оффлайн'
        };

        if (dot) {
            dot.style.backgroundColor = statusColors[data.discord_status] || statusColors.offline;
        }

        const activities = data.activities || [];
        const customStatus = activities.find(a => a.type === 4);
        const gameActivity = activities.find(a => a.type === 0);
        const musicActivity = activities.find(a => a.type === 2);

        let finalStatus = statusNames[data.discord_status] || 'Оффлайн';

        if (gameActivity) {
            finalStatus = `Играет в ${gameActivity.name}`;
        } 
        else if (musicActivity) {
            const track = musicActivity.details || "трек";
            const artist = musicActivity.state || "исполнителя";
            finalStatus = `Слушает ${track} — ${artist}`;
        } 
        else if (customStatus && customStatus.state) {
            finalStatus = customStatus.state;
        }

        if (textElem) {
            textElem.innerText = finalStatus;
        }

    } catch (error) {
        console.error("Lanyard Error:", error);
    }
}

function updateFooterInfo() {
    const year = document.getElementById('current-year');
    const time = document.getElementById('local-time');
    if(year) year.innerText = new Date().getFullYear();
    if(time) time.innerText = new Date().toLocaleTimeString('ru-RU', {timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit'});
}

function initMouseGlow() {
    const bgGlow = document.querySelector('.bg-glow');
    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        bgGlow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(165, 95, 255, 0.1), transparent 40%)`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    const enterBtn = document.getElementById('enter-button');
    const mainContent = document.getElementById('main-content');
    const music = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-toggle');
    const musicIcon = document.getElementById('music-icon');

    music.volume = 0.3;

    enterBtn.addEventListener('click', () => {
    window.scrollTo(0, 0); 
    
    splash.classList.add('hidden');
    mainContent.classList.add('active');
    
    music.play().catch(() => {});
    musicIcon.classList.replace('fa-volume-xmark', 'fa-volume-high');
    musicBtn.classList.add('music-playing');
    
    applyStaggerAnimation();
    });

    musicBtn.addEventListener('click', () => {
        if (music.paused) {
            music.play();
            musicIcon.classList.replace('fa-volume-xmark', 'fa-volume-high');
            musicBtn.classList.add('music-playing');
        } else {
            music.pause();
            musicIcon.classList.replace('fa-volume-high', 'fa-volume-xmark');
            musicBtn.classList.remove('music-playing');
        }
    });

    updateLanyard();
    setInterval(updateLanyard, 30000);
    updateFooterInfo();
    setInterval(updateFooterInfo, 1000);
    initMouseGlow();
});

// --- Canvas Constellation Animation ---
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('constellationCanvas');
    if (!canvas) return; // Выходим, если canvas не найден

    const ctx = canvas.getContext('2d');
    let W, H;
    let particles = [];
    const maxParticles = 80; // Максимальное количество частиц
    const particleSize = 1.5; // Размер точек
    const lineDistance = 120; // Максимальное расстояние для соединения линий
    const particleSpeed = 0.2; // Скорость движения частиц

    // Цвет из переменной CSS --accent
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

    // Обновление размеров Canvas при изменении окна
    function resizeCanvas() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    // Создание частиц
    function createParticles() {
        for (let i = 0; i < maxParticles; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * particleSpeed, // Случайная скорость по X
                vy: (Math.random() - 0.5) * particleSpeed  // Случайная скорость по Y
            });
        }
    }

    // Отрисовка частиц и линий
    function draw() {
        ctx.clearRect(0, 0, W, H); // Очищаем весь Canvas

        for (let i = 0; i < maxParticles; i++) {
            const p1 = particles[i];

            // Рисуем частицу
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, particleSize, 0, Math.PI * 2);
            ctx.fillStyle = accentColor; // Используем accent цвет для точек
            ctx.fill();

            // Обновляем позицию частицы
            p1.x += p1.vx;
            p1.y += p1.vy;

            // Отталкивание от границ (перемещение на противоположную сторону)
            if (p1.x < 0 || p1.x > W) p1.x = (p1.x < 0) ? W : 0;
            if (p1.y < 0 || p1.y > H) p1.y = (p1.y < 0) ? H : 0;
            
            // Соединяем частицы линиями
            for (let j = i + 1; j < maxParticles; j++) {
                const p2 = particles[j];
                const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

                if (distance < lineDistance) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    // Прозрачность линии зависит от расстояния
                    ctx.strokeStyle = `rgba(165, 95, 255, ${1 - (distance / lineDistance) * 0.7})`; 
                    ctx.lineWidth = 0.7; // Толщина линии
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw); // Запрашиваем следующий кадр анимации
    }

    // Инициализация
    resizeCanvas();
    createParticles();
    draw();

    // Обработчик изменения размера окна
    window.addEventListener('resize', resizeCanvas);
});