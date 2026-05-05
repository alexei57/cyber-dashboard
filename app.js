const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

resizeCanvas();

window.addEventListener('resize', resizeCanvas);


let mouse = {
    x: 0,
    y: 0
}

window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

function animate() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00f2ff';
    ctx.fillRect(mouse.x, mouse.y, 50, 50);

    requestAnimationFrame(animate);
}

animate();