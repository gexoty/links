function updateClock() {
    const clock = document.getElementById('clock');
    const now = new Date();
    
    let h = now.getHours();
    let m = now.getMinutes();
    let s = now.getSeconds();
    
    // Добавляем ведущие нули
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    s = s < 10 ? '0' + s : s;
    
    clock.textContent = `${h}:${m}:${s}`;
}

// Обновляем каждую секунду
setInterval(updateClock, 1000);

// И сразу при загрузке страницы
updateClock();
