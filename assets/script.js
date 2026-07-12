const USER_ID = "620895564715786240";
let mainPageHTML = null;
let progressInterval = null;

// --- Хелперы для Discord RPC карточки ---

// Хелпер для парсинга картинок от Lanyard (конвертирует mp:external в рабочие URL)
function getLanyardAssetUrl(appId, assetId) {
    if (!assetId) return null;
    if (assetId.startsWith('mp:external/')) {
        if (assetId.includes('https/')) {
            const cleanUrl = assetId.split('https/')[1];
            return 'https://' + cleanUrl;
        }
        return `https://media.discordapp.net/${assetId.replace('mp:external/', '')}`;
    }
    return `https://cdn.discordapp.com/app-assets/${appId}/${assetId}.png`;
}

// Форматирование миллисекунд в мм:сс
function formatTime(ms) {
    if (isNaN(ms) || ms < 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// --- Основная логика интерфейса ---

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

// --- Обновление Discord Статуса (Lanyard) ---

async function updateLanyard() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}`);
        const json = await response.json();
        if (!json.success) return;

        const data = json.data;
        const user = data.discord_user;

        // Генерируем ссылку на твою аватарку в Discord для фолбека
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        // Элементы карточки
        const dot = document.getElementById('discord-status');
        const textElem = document.getElementById('status-text');
        const cardImg = document.getElementById('card-image');
        const cardDetails = document.getElementById('card-details');
        const cardState = document.getElementById('card-state');
        const progressWrap = document.getElementById('card-progress-wrap');
        const progressFill = document.getElementById('card-progress-fill');
        const progressCurrent = document.getElementById('progress-current');
        const progressTotal = document.getElementById('progress-total');
        const cardEqualizer = document.getElementById('card-equalizer');

        // Очищаем старый интервал прогресс-бара
        if (progressInterval) clearInterval(progressInterval);

        // Цвета и имена статусов
        const statusColors = { online: '#43b581', idle: '#faa61a', dnd: '#f04747', offline: '#747f8d' };
        const statusNames = { online: 'Онлайн', idle: 'АФК', dnd: 'Не беспокоить', offline: 'Оффлайн' };

        if (dot) dot.style.backgroundColor = statusColors[data.discord_status] || statusColors.offline;

        const activities = data.activities || [];
        // Приоритеты: 1. Игра (type 0)  2. Музыка (Spotify / Кастомный RPC type 2)  3. Кастомный статус (type 4)
        const gameActivity = activities.find(a => a.type === 0);
        const musicActivity = data.listening_to_spotify ? data.spotify : activities.find(a => a.type === 2);
        const customStatus = activities.find(a => a.type === 4);

        // Сброс видимости элементов по умолчанию
        if (cardImg) {
            cardImg.classList.add('hidden');
            cardImg.dataset.avatar = avatarUrl;
            cardImg.onerror = function() {
                this.src = this.dataset.avatar;
                this.onerror = null;
            };
        }
        if (cardDetails) cardDetails.classList.add('hidden');
        if (cardState) cardState.classList.add('hidden');
        if (progressWrap) progressWrap.classList.add('hidden');
        if (cardEqualizer) cardEqualizer.classList.add('hidden');
        
        if (textElem) textElem.innerText = statusNames[data.discord_status] || 'Оффлайн';

        if (gameActivity) {
            // 1. ОТОБРАЖЕНИЕ ИГРЫ
            if (textElem) textElem.innerText = 'Играет в игру';
            if (cardDetails) {
                cardDetails.classList.remove('hidden');
                cardDetails.innerText = gameActivity.name;
            }

            if (cardState) {
                if (gameActivity.details || gameActivity.state) {
                    cardState.classList.remove('hidden');
                    cardState.innerText = gameActivity.details || gameActivity.state;
                }
            }

            // Логика картинок для игры
            if (cardImg) {
                if (gameActivity.assets && gameActivity.assets.large_image) {
                    const imgUrl = getLanyardAssetUrl(gameActivity.application_id, gameActivity.assets.large_image);
                    cardImg.src = imgUrl || avatarUrl;
                } else if (gameActivity.application_id) {
                    cardImg.src = `https://cdn.discordapp.com/app-assets/${gameActivity.application_id}/youtube.png`;
                } else {
                    cardImg.src = avatarUrl;
                }
                cardImg.classList.remove('hidden');
            }

            // Таймер «прошло Х времени»
            if (gameActivity.timestamps && gameActivity.timestamps.start) {
                if (progressWrap && progressTotal && progressCurrent && progressFill) {
                    progressWrap.classList.remove('hidden');
                    progressTotal.classList.add('hidden'); 
                    
                    const startTime = gameActivity.timestamps.start;
                    const updateGameTimer = () => {
                        const elapsed = Date.now() - startTime;
                        progressCurrent.innerText = `прошло: ${formatTime(elapsed)}`;
                        progressFill.style.width = '100%'; 
                    };
                    updateGameTimer();
                    progressInterval = setInterval(updateGameTimer, 1000);
                }
            }

        } else if (musicActivity) {
            // 2. ОТОБРАЖЕНИЕ МУЗЫКИ
            if (textElem) textElem.innerText = 'Слушает музыку';
            if (cardDetails) cardDetails.classList.remove('hidden');
            if (cardState) cardState.classList.remove('hidden');
            if (cardEqualizer) cardEqualizer.classList.remove('hidden'); // Включаем псевдо-спектр

            let trackName, artistName, imgUrl, startTime, endTime;

            if (data.listening_to_spotify) {
                trackName = musicActivity.title; 
                artistName = musicActivity.artist;
                imgUrl = musicActivity.album_art_url;
                startTime = musicActivity.timestamps.start;
                endTime = musicActivity.timestamps.end;
            } else {
                trackName = musicActivity.details || "Трек";
                artistName = musicActivity.state || "Исполнитель";
                if (musicActivity.assets && musicActivity.assets.large_image) {
                    imgUrl = getLanyardAssetUrl(musicActivity.application_id, musicActivity.assets.large_image);
                }
                if (musicActivity.timestamps) {
                    startTime = musicActivity.timestamps.start;
                    endTime = musicActivity.timestamps.end;
                }
            }

            if (cardDetails) cardDetails.innerText = trackName;
            if (cardState) cardState.innerText = artistName;

            if (cardImg && imgUrl) {
                cardImg.src = imgUrl;
                cardImg.classList.remove('hidden');
            }

            // Логика прогресс-бара для трека
            if (startTime && endTime) {
                if (progressWrap && progressTotal && progressCurrent && progressFill) {
                    progressWrap.classList.remove('hidden');
                    progressTotal.classList.remove('hidden');
                    
                    const totalDuration = endTime - startTime;
                    progressTotal.innerText = formatTime(totalDuration);

                    const updateTrackProgress = () => {
                        const now = Date.now();
                        const currentProgress = now - startTime;
                        
                        if (currentProgress >= totalDuration) {
                            clearInterval(progressInterval);
                            updateLanyard(); 
                            return;
                        }

                        progressCurrent.innerText = formatTime(currentProgress);
                        const percent = (currentProgress / totalDuration) * 100;
                        progressFill.style.width = `${percent}%`;
                    };
                    
                    updateTrackProgress();
                    progressInterval = setInterval(updateTrackProgress, 1000);
                }
            }

        } else if (customStatus && customStatus.state) {
            // 3. КАСТОМНЫЙ СТАТУС В ДИСКОРДЕ
            if (cardDetails) {
                cardDetails.classList.remove('hidden');
                cardDetails.innerText = customStatus.state;
            }
            if (cardImg) {
                if (customStatus.emoji && customStatus.emoji.id) {
                    cardImg.src = `https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.png`;
                } else {
                    cardImg.src = avatarUrl;
                }
                cardImg.classList.remove('hidden');
            }
        } else {
            // 4. ДЕФОЛТНОЕ СОСТОЯНИЕ (Нет активностей или оффлайн)
            if (cardImg) {
                cardImg.src = avatarUrl;
                cardImg.classList.remove('hidden');
            }
            if (cardDetails) {
                cardDetails.classList.remove('hidden');
                cardDetails.innerText = statusNames[data.discord_status] || 'Оффлайн';
            }
            if (cardState) {
                cardState.classList.remove('hidden');
                cardState.innerText = '';
            }
            if (textElem) {
                textElem.innerText = '';
            }
        }

    } catch (error) {
        console.error("Lanyard Error:", error);
    }
}

// --- Вспомогательные системные скрипты ---

function updateFooterInfo() {
    const year = document.getElementById('current-year');
    const time = document.getElementById('local-time');
    if(year) year.innerText = new Date().getFullYear();
    if(time) time.innerText = new Date().toLocaleTimeString('ru-RU', {timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit'});
}

function initMouseGlow() {
    const bgGlow = document.querySelector('.bg-glow');
    if (!bgGlow) return;
    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        bgGlow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(165, 95, 255, 0.1), transparent 40%)`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyStaggerAnimation();
    updateLanyard();
    setInterval(updateLanyard, 3000);
    updateFooterInfo();
    setInterval(updateFooterInfo, 1000);
    initMouseGlow();
});

// --- Canvas Constellation Animation (Созвездия) ---
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('constellationCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;
    let particles = [];
    const maxParticles = 80; 
    const particleSize = 1.5; 
    const lineDistance = 120; 
    const particleSpeed = 0.2; 

    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a55fff';

    function resizeCanvas() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = []; 
        for (let i = 0; i < maxParticles; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * particleSpeed, 
                vy: (Math.random() - 0.5) * particleSpeed  
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H); 

        for (let i = 0; i < maxParticles; i++) {
            const p1 = particles[i];
            if (!p1) continue;

            ctx.beginPath();
            ctx.arc(p1.x, p1.y, particleSize, 0, Math.PI * 2);
            ctx.fillStyle = accentColor; 
            ctx.fill();

            p1.x += p1.vx;
            p1.y += p1.vy;

            if (p1.x < 0 || p1.x > W) p1.x = (p1.x < 0) ? W : 0;
            if (p1.y < 0 || p1.y > H) p1.y = (p1.y < 0) ? H : 0;
            
            for (let j = i + 1; j < maxParticles; j++) {
                const p2 = particles[j];
                if (!p2) continue;
                const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

                if (distance < lineDistance) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(165, 95, 255, ${1 - (distance / lineDistance) * 0.7})`; 
                    ctx.lineWidth = 0.7; 
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw); 
    }

    resizeCanvas();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });
});