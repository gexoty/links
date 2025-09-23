const canvas = document.getElementById('starCanvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Настройки звёзд
const starsCount = 200;
const stars = [];

for (let i = 0; i < starsCount; i++) {
    stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 * 1.2, // увеличиваем на 20%
        alpha: Math.random(),
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.2
    });
}

// Обновляем размеры при ресайзе
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// Рисуем звезду
function drawStar(star) {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.fill();
}

// Анимация
function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let star of stars) {
        drawStar(star);
        star.x += star.dx;
        star.y += star.dy;

        // Мерцание
        star.alpha += (Math.random() - 0.5) * 0.02;
        if (star.alpha < 0) star.alpha = 0;
        if (star.alpha > 1) star.alpha = 1;

        // Обновление позиции при выходе за границу
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;
    }

    requestAnimationFrame(animate);
}

// Запуск анимации
animate();
