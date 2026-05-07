const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const btcPriceElement = document.getElementById('crypto-btc-price');
const ethPriceElement = document.getElementById('crypto-eth-price');
const solanaPriceElement = document.getElementById('crypto-solana-price');
const logContent = document.getElementById('log-content');
const logWrapper = document.querySelector('.system-log');
const glassWrapper = document.querySelectorAll('.glass');
let audioCTX;
const clock = document.getElementById('clock');
let engineSpeed = 3;
let connectionRadius = 100;
let systemColor = '#00f2ff';

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

    arrayParticles.push(new Particle());
});

let lastElement = null;

window.addEventListener('touchmove', function(event) {
    event.preventDefault();

    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;

    if (arrayParticles.length < 50) {
        arrayParticles.push(new Particle());
    }

    const target = document.elementFromPoint(mouse.x, mouse.y);
    const element = target?.closest('.system-log, .glass');

    if (!element) {
        lastElement = null;
        return;
    }

    if (element !== lastElement) {
        lastElement = element;

        if (element.classList.contains('system-log')) {
            playBeep(300);
        } else if (element.classList.contains('glass')) {
            playBeep(600);
        }
    }

}, { passive: false });

class Particle {
    constructor() {
        this.x = mouse.x;
        this.y = mouse.y;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
    };
    draw() {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    };
    update() {
        this.x += this.speedX * (engineSpeed / 3);
        this.y += this.speedY;
        this.size -= 0.1;
    }
}

const arrayParticles = [];

function handlerParticles() {
    for(let i = 0; i < arrayParticles.length; i++) {
        arrayParticles[i].update();
        arrayParticles[i].draw();

        if(arrayParticles[i].size <= 0.3) {
            arrayParticles.splice(i, 1);
            i--;
        };
    };
}

function connectParticles() {
    for(let i = 0; i < arrayParticles.length; i++) {
        for(let j = i; j < arrayParticles.length; j++) {
            const dx = arrayParticles[i].x - arrayParticles[j].x;
            const dy = arrayParticles[i].y - arrayParticles[j].y;
            const distance = Math.hypot(dx, dy);
            if(distance < connectionRadius) {
                let opacity = 1 - (distance / 100);
                ctx.strokeStyle = systemColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
                ctx.lineWidth = 0.5;
                ctx.shadowBlur = 15;
                ctx.shadowColor = systemColor;
                ctx.beginPath();
                ctx.moveTo(arrayParticles[i].x, arrayParticles[i].y);
                ctx.lineTo(arrayParticles[j].x, arrayParticles[j].y);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    }
}

function animate() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    handlerParticles();

    connectParticles();

    requestAnimationFrame(animate);
}

animate();

let priceHistory = {
    btc: [],
    eth: [],
    solana: []
};


async function getCryptoPrice() {
    try {
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd';
        const response = await fetch(url);
        const data = await response.json();
        const btcPrice = data.bitcoin.usd;
        const ethPrice = data.ethereum.usd;
        const solanaPrice = data.solana.usd;

        btcPriceElement.textContent = `Bitcoin: ${btcPrice}$`;
        ethPriceElement.textContent = `Ethereum: ${ethPrice}$`;
        solanaPriceElement.textContent = `Solana: ${solanaPrice}$`;

        priceHistory.btc.push(btcPrice);
        if(priceHistory.btc.length > 20) priceHistory.btc.shift();

        priceHistory.eth.push(ethPrice);
        if(priceHistory.eth.length > 20) priceHistory.eth.shift();

        priceHistory.solana.push(solanaPrice);
        if(priceHistory.solana.length > 20) priceHistory.solana.shift();

        addLog('Market data synchronized');

        drawChart('btc-chart', priceHistory.btc, 'rgba(0, 242, 255, 1)');
        drawChart('eth-chart', priceHistory.eth, 'rgba(163, 53, 238, 1)');
        drawChart('solana-chart', priceHistory.solana, 'rgba(20, 241, 149, 1)');

    } catch(error) {
        console.error("Fetch error:", error.message);
        const errorMsg = "SYSTEM BUSY";
        addLog(errorMsg);
    }

}

getCryptoPrice();

setInterval(getCryptoPrice, 30000);

function drawChart(canvasId, dataPoints, color) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(!canvas || dataPoints.length < 2) return;

    const minPrice = Math.min(...dataPoints);
    const maxPrice = Math.max(...dataPoints);
    const range = maxPrice - minPrice || 1;

    ctx.beginPath();

    dataPoints.forEach((price, index) => {
        const x = (canvas.width / (dataPoints.length - 1)) * index;
        const y = canvas.height - ((price - minPrice) / range) * canvas.height;

        if(index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.lineTo((canvas.width / (dataPoints.length - 1)) * (dataPoints.length - 1), canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const fillColor = color.replace('1)', '0.4)');
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function addLog(message) {
    const time = new Date().toLocaleTimeString();

    logContent.innerHTML += `<br>${time} ${message}`;

    logWrapper.scrollTop = logWrapper.scrollHeight;
}

function playBeep(frequency) {

    if(!audioCTX) {
        audioCTX = new (window.AudioContext || window.webkitAudioContext)();
    };

    if (audioCTX.state === 'suspended') {
        audioCTX.resume();
    };

    const oscillator = audioCTX.createOscillator();

    oscillator.type = 'square';
    oscillator.frequency.value = frequency;

    oscillator.connect(audioCTX.destination);
    oscillator.start();

    oscillator.stop(audioCTX.currentTime + 0.05);
}

glassWrapper.forEach(el => {
    el.addEventListener('mouseenter', () => {
        if(el.classList.contains('system-log')) {
            playBeep(300);
        } else {
            playBeep(600);
        }
    })
})

function updateClock() {
    const now = new Date().toLocaleTimeString();
    clock.textContent = `${now}`;
}

updateClock();
setInterval(updateClock, 1000);

const speedRange = document.getElementById('speed-range');
const distRange = document.getElementById('dist-range');

speedRange.addEventListener('input', el => {
    engineSpeed = el.target.value;
    playBeep(200);
});

distRange.addEventListener('input', el => {
    connectionRadius = el.target.value;
});

distRange.addEventListener('change', el => {
    addLog(`System: link radius updated to ${el.target.value}px`)
})

function changeTheme(newColor) {
    document.documentElement.style.setProperty('--neon-color', newColor);
    const glowColor = newColor.replace('rgb', 'rgba').replace(')', ', 0.2)');
    document.documentElement.style.setProperty('--neon-glow', glowColor);
    systemColor = newColor;
    addLog(`System: Theme updated to ${newColor}`);
    playBeep(300);
}