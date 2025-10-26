// Confetti animation utility

export interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  decay: number
}

export function createConfetti(count: number = 100): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8']
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 5 + 2,
      life: 1,
      decay: Math.random() * 0.02 + 0.01
    })
  }
  
  return particles
}

function animate(ctx: CanvasRenderingContext2D, particles: ConfettiParticle[], canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  particles.forEach((particle, index) => {
    // Update physics
    particle.x += particle.vx
    particle.y += particle.vy
    particle.vy += 0.3 // gravity
    particle.vx *= 0.99 // air resistance
    particle.life -= particle.decay
    
    // Draw particle
    ctx.save()
    ctx.globalAlpha = particle.life
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    
    // Remove dead particles
    if (particle.life <= 0) {
      particles.splice(index, 1)
    }
  })
  
  // Continue animation if particles remain
  if (particles.length > 0) {
    requestAnimationFrame(() => animate(ctx, particles, canvas))
  } else {
    // Clean up canvas when done
    canvas.remove()
  }
}

export function triggerConfetti(duration: number = 3000) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return
  
  // Setup canvas
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'
  
  document.body.appendChild(canvas)
  
  // Create and animate confetti
  const particles = createConfetti(150)
  animate(ctx, particles, canvas)
  
  // Cleanup after duration
  setTimeout(() => {
    if (canvas.parentNode) {
      canvas.remove()
    }
  }, duration)
}