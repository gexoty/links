const canvas = document.getElementById('waveCanvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Параметры волн
const waves = [
    { amplitude: 20, wavelength: 200, speed: 0.02, offset: 0, color: 'rgba(255,255,255,0.2)' },
    { amplitude: 15, wavelength: 150, speed: 0.03, offset: 100, color: 'rgba(255,255,255,0.3)' },
    { amplitude: 10, wavelength: 100, speed: 0.04, offset: 200, color: 'rgba(255,255,255,0.4)' }
];

// Обновляем размеры при ресайзе
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// Рисуем волну
function drawWave(wave, time) {
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
        const y = wave.amplitude * Math.sin((x + wave.offset) * 2 * Math.PI / wave.wavelength + time * wave.speed) + height/2;
        ctx.lineTo(x, y);
    }
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Анимация
let time = 0;
function animate() {
    ctx.clearRect(0, 0, width, height);

    for (const wave of waves) {
        drawWave(wave, time);
    }

    time += 1;
    requestAnimationFrame(animate);
}

animate();
