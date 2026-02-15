const USER_ID = "620895564715786240";

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
    const yearElem = document.getElementById('current-year');
    const timeElem = document.getElementById('local-time');
    
    const now = new Date();
    
    if (yearElem) yearElem.innerText = now.getFullYear();
    
    if (timeElem) {
        timeElem.innerText = now.toLocaleTimeString('ru-RU', {
            timeZone: 'Europe/Moscow',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function initMouseGlow() {
    const bgGlow = document.querySelector('.bg-glow');
    if (!bgGlow) return;

    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        bgGlow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(165, 95, 255, 0.10), transparent 40%)`;
    });
}

// ОДИН единственный запуск всех функций
document.addEventListener('DOMContentLoaded', () => {
    // 1. Статус Discord
    updateLanyard();
    setInterval(updateLanyard, 30000);

    // 2. Время и год
    updateFooterInfo();
    setInterval(updateFooterInfo, 1000);

    // 3. Свечение
    initMouseGlow();
    
    console.log("Gexoty script initialized!");
});