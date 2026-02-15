const USER_ID = "620895564715786240";

async function updateLanyard() {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${USER_ID}`);
        const json = await response.json();
        if (!json.success) return;

        const data = json.data;
        const dot = document.getElementById('discord-status');
        const textElem = document.getElementById('status-text');

        // Справочник базовых статусов
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

        // Поиск активностей
        const activities = data.activities || [];
        const customStatus = activities.find(a => a.type === 4);
        const gameActivity = activities.find(a => a.type === 0);
        const musicActivity = activities.find(a => a.type === 2);

        let finalStatus = statusNames[data.discord_status] || 'Оффлайн';

        if (gameActivity) {
            finalStatus = `Играет в ${gameActivity.name}`;
        } 
        else if (musicActivity) {
            // Берем details (трек) и state (исполнитель)
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

document.addEventListener('DOMContentLoaded', () => {
    updateLanyard();
    setInterval(updateLanyard, 30000);
    const footer = document.querySelector('footer');
    if (footer) footer.textContent = `© ${new Date().getFullYear()} Gexoty`;
});