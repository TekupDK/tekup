// Animated floating orbs background
const canvas = document.getElementById('orbs');
const ctx = canvas.getContext('2d');
let orbs = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function createOrb() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 60 + 20,
    dx: (Math.random() - 0.5) * 0.7,
    dy: (Math.random() - 0.5) * 0.7,
    color: `hsla(${Math.random() * 360}, 70%, 60%, 0.5)`
  };
}
for (let i = 0; i < 20; i++) {
  orbs.push(createOrb());
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  orbs.forEach((o) => {
    ctx.beginPath();
    ctx.fillStyle = o.color;
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.fill();
    o.x += o.dx;
    o.y += o.dy;
    if (o.x < -o.radius) o.x = canvas.width + o.radius;
    if (o.y < -o.radius) o.y = canvas.height + o.radius;
    if (o.x > canvas.width + o.radius) o.x = -o.radius;
    if (o.y > canvas.height + o.radius) o.y = -o.radius;
  });
  requestAnimationFrame(animate);
}
animate();
