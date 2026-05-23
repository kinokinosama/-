const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

const createRng = (seed) => {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const hexToRgb = (hex) => {
  const h = hex.replace("#", "").trim()
  const v = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16)
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}

const rgba = (hex, a) => {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

const roundedRect = (ctx, x, y, w, h, r) => {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

const drawGrain = (ctx, w, h, alpha, rng) => {
  const count = Math.floor((w * h) / 1800)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = "rgba(20,20,20,.18)"
  for (let i = 0; i < count; i += 1) {
    const x = rng() * w
    const y = rng() * h
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.restore()
}

const drawWatercolor = (ctx, w, h, rng) => {
  const blobs = 18
  for (let i = 0; i < blobs; i += 1) {
    const x = rng() * w
    const y = rng() * h
    const r = (0.12 + rng() * 0.22) * Math.min(w, h)
    const hue = 170 + rng() * 55
    const sat = 30 + rng() * 25
    const lig = 76 + rng() * 10
    const a = 0.06 + rng() * 0.06
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `hsla(${hue},${sat}%,${lig}%,${a})`)
    g.addColorStop(1, `hsla(${hue},${sat}%,${lig}%,0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawDoodles = (ctx, w, h, t, rng) => {
  ctx.save()
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = "rgba(42,42,42,.45)"
  ctx.lineWidth = 2
  const pad = Math.min(w, h) * 0.06
  const wob = Math.sin(t * 0.0006) * 2

  ctx.beginPath()
  ctx.moveTo(pad, pad + 30 + wob)
  ctx.quadraticCurveTo(pad + 40, pad + 5, pad + 90, pad + 26)
  ctx.quadraticCurveTo(pad + 120, pad + 38, pad + 140, pad + 12)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(w - pad - 150, h - pad - 18 + wob)
  ctx.quadraticCurveTo(w - pad - 110, h - pad - 46, w - pad - 70, h - pad - 24)
  ctx.quadraticCurveTo(w - pad - 35, h - pad - 8, w - pad, h - pad - 30)
  ctx.stroke()

  ctx.globalAlpha = 0.22
  ctx.strokeStyle = "rgba(111,142,168,.75)"
  ctx.lineWidth = 3
  const sx = w * 0.12
  const sy = h * 0.72
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.bezierCurveTo(sx + 60, sy - 40, sx + 120, sy + 40, sx + 200, sy - 20)
  ctx.stroke()

  ctx.globalAlpha = 0.18
  ctx.fillStyle = "rgba(231,160,124,.85)"
  for (let i = 0; i < 10; i += 1) {
    const x = rng() * w
    const y = rng() * h
    const r = 1 + rng() * 2.8
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

const drawFace = (ctx, x, y, size, blush) => {
  const eyeY = y - size * 0.06
  const eyeDX = size * 0.16
  ctx.fillStyle = "rgba(20,20,20,.78)"
  ctx.beginPath()
  ctx.arc(x - eyeDX, eyeY, size * 0.06, 0, Math.PI * 2)
  ctx.arc(x + eyeDX, eyeY, size * 0.06, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = "rgba(20,20,20,.66)"
  ctx.lineWidth = Math.max(2, size * 0.03)
  ctx.beginPath()
  ctx.moveTo(x - size * 0.06, y + size * 0.06)
  ctx.quadraticCurveTo(x, y + size * 0.12, x + size * 0.06, y + size * 0.06)
  ctx.stroke()

  ctx.fillStyle = rgba(blush, 0.35)
  ctx.beginPath()
  ctx.arc(x - size * 0.26, y + size * 0.04, size * 0.1, 0, Math.PI * 2)
  ctx.arc(x + size * 0.26, y + size * 0.04, size * 0.1, 0, Math.PI * 2)
  ctx.fill()
}

const drawFoodCharacter = (ctx, cx, cy, size, recipe) => {
  const main = recipe?.main ?? "#b9d7d0"
  const accent = recipe?.accent ?? "#e7a07c"
  const blush = recipe?.blush ?? "#f2b0a0"
  const type = recipe?.type ?? "drink"

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(Math.sin(Date.now() * 0.0007) * 0.04)

  if (type === "bowl" || type === "pot") {
    ctx.fillStyle = rgba(main, 0.92)
    roundedRect(ctx, -size * 0.52, -size * 0.2, size * 1.04, size * 0.62, size * 0.22)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,.55)"
    roundedRect(ctx, -size * 0.42, -size * 0.18, size * 0.84, size * 0.26, size * 0.18)
    ctx.fill()

    ctx.fillStyle = rgba(accent, 0.55)
    ctx.beginPath()
    ctx.arc(size * 0.2, -size * 0.12, size * 0.12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = rgba(accent, 0.35)
    ctx.beginPath()
    ctx.arc(-size * 0.18, -size * 0.1, size * 0.14, 0, Math.PI * 2)
    ctx.fill()

    drawFace(ctx, 0, size * 0.12, size, blush)
  } else if (type === "cake" || type === "pudding") {
    ctx.fillStyle = rgba(main, 0.92)
    roundedRect(ctx, -size * 0.54, -size * 0.18, size * 1.08, size * 0.66, size * 0.22)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,.6)"
    roundedRect(ctx, -size * 0.54, -size * 0.22, size * 1.08, size * 0.18, size * 0.18)
    ctx.fill()

    ctx.fillStyle = rgba(accent, 0.8)
    ctx.beginPath()
    ctx.arc(0, -size * 0.26, size * 0.13, 0, Math.PI * 2)
    ctx.fill()

    drawFace(ctx, 0, size * 0.13, size, blush)
  } else if (type === "bar") {
    ctx.fillStyle = rgba(main, 0.92)
    roundedRect(ctx, -size * 0.58, -size * 0.18, size * 1.16, size * 0.7, size * 0.18)
    ctx.fill()

    ctx.strokeStyle = "rgba(255,255,255,.28)"
    ctx.lineWidth = Math.max(2, size * 0.03)
    ctx.beginPath()
    ctx.moveTo(-size * 0.48, -size * 0.08)
    ctx.lineTo(size * 0.48, -size * 0.08)
    ctx.stroke()

    drawFace(ctx, 0, size * 0.14, size, blush)
  } else if (type === "bread" || type === "roll") {
    ctx.fillStyle = rgba(main, 0.92)
    ctx.beginPath()
    ctx.ellipse(0, size * 0.05, size * 0.58, size * 0.36, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = "rgba(42,42,42,.12)"
    ctx.lineWidth = Math.max(2, size * 0.02)
    ctx.beginPath()
    ctx.ellipse(0, size * 0.05, size * 0.52, size * 0.3, 0, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = rgba(accent, 0.22)
    ctx.beginPath()
    ctx.arc(-size * 0.18, -size * 0.04, size * 0.14, 0, Math.PI * 2)
    ctx.fill()

    drawFace(ctx, 0, size * 0.12, size, blush)
  } else if (type === "mug") {
    ctx.fillStyle = rgba(main, 0.92)
    roundedRect(ctx, -size * 0.44, -size * 0.2, size * 0.88, size * 0.72, size * 0.22)
    ctx.fill()

    ctx.strokeStyle = rgba(main, 0.9)
    ctx.lineWidth = Math.max(3, size * 0.05)
    ctx.beginPath()
    ctx.arc(size * 0.52, size * 0.06, size * 0.16, -Math.PI / 2, Math.PI / 2)
    ctx.stroke()

    ctx.fillStyle = "rgba(255,255,255,.55)"
    roundedRect(ctx, -size * 0.34, -size * 0.12, size * 0.68, size * 0.24, size * 0.18)
    ctx.fill()

    drawFace(ctx, 0, size * 0.16, size, blush)
  } else {
    ctx.strokeStyle = rgba(main, 0.85)
    ctx.lineWidth = Math.max(3, size * 0.06)
    ctx.beginPath()
    ctx.moveTo(-size * 0.3, -size * 0.22)
    ctx.lineTo(-size * 0.3, size * 0.36)
    ctx.quadraticCurveTo(-size * 0.3, size * 0.58, -size * 0.06, size * 0.58)
    ctx.lineTo(size * 0.06, size * 0.58)
    ctx.quadraticCurveTo(size * 0.3, size * 0.58, size * 0.3, size * 0.36)
    ctx.lineTo(size * 0.3, -size * 0.22)
    ctx.stroke()

    ctx.fillStyle = rgba(accent, 0.5)
    ctx.beginPath()
    ctx.arc(0, -size * 0.14, size * 0.16, 0, Math.PI * 2)
    ctx.fill()

    drawFace(ctx, 0, size * 0.14, size, blush)
  }

  ctx.restore()
}

export class StageRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d", { alpha: true })
    this.dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
    this.w = 0
    this.h = 0
    this.seed = Math.floor(Math.random() * 1e9)
    this.rng = createRng(this.seed)
    this.mode = "home"
    this.recipe = null
    this.bg = null
    this.floaters = []
  }

  setMode(mode, recipe) {
    this.mode = mode
    this.recipe = recipe ?? null
  }

  resize(w, h) {
    this.w = Math.max(1, Math.floor(w))
    this.h = Math.max(1, Math.floor(h))
    const dpr = this.dpr
    this.canvas.width = Math.floor(this.w * dpr)
    this.canvas.height = Math.floor(this.h * dpr)
    this.canvas.style.width = `${this.w}px`
    this.canvas.style.height = `${this.h}px`
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.bg = this._renderBackground()
    this._resetFloaters()
  }

  _renderBackground() {
    const c = document.createElement("canvas")
    c.width = this.w
    c.height = this.h
    const ctx = c.getContext("2d")
    const rng = createRng(this.seed ^ 0x9e3779b9)

    const g = ctx.createLinearGradient(0, 0, 0, this.h)
    g.addColorStop(0, "#f3ece0")
    g.addColorStop(1, "#e9ded0")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, this.w, this.h)

    drawWatercolor(ctx, this.w, this.h, rng)
    drawGrain(ctx, this.w, this.h, 0.12, rng)
    return c
  }

  _resetFloaters() {
    const rng = createRng(this.seed ^ 0x6d2b79f5)
    const n = clamp(Math.floor((this.w * this.h) / 90000), 6, 16)
    this.floaters = Array.from({ length: n }).map(() => {
      const base = {
        x: rng() * this.w,
        y: rng() * this.h,
        r: 6 + rng() * 16,
        s: 0.14 + rng() * 0.26,
        o: 0.08 + rng() * 0.12,
        p: rng() * Math.PI * 2,
        c: rng() > 0.5 ? "rgba(111,142,168,.55)" : "rgba(231,160,124,.55)",
      }
      return base
    })
  }

  draw(t) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    if (this.bg) ctx.drawImage(this.bg, 0, 0)
    drawDoodles(ctx, this.w, this.h, t, this.rng)

    ctx.save()
    for (const f of this.floaters) {
      const y = f.y + Math.sin(t * 0.0008 + f.p) * (10 + f.r * 0.4)
      const x = f.x + Math.cos(t * 0.0006 + f.p) * (8 + f.r * 0.3)
      ctx.globalAlpha = f.o
      ctx.fillStyle = f.c
      ctx.beginPath()
      ctx.arc(x, y, f.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    if (this.mode === "result" && this.recipe) {
      const size = clamp(Math.min(this.w, this.h) * 0.12, 56, 92)
      const cx = this.w * 0.5
      const cy = this.h * 0.24
      ctx.save()
      ctx.globalAlpha = 0.95
      drawFoodCharacter(ctx, cx, cy, size, this.recipe)
      ctx.restore()
    }
  }

  renderFoodImage(payload) {
    const w = 760
    const h = 760
    const dpr = 1
    const c = document.createElement("canvas")
    c.width = w * dpr
    c.height = h * dpr
    const ctx = c.getContext("2d")
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const rng = createRng((this.seed ^ 0x3c6ef372) >>> 0)
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, "#f5efe6")
    g.addColorStop(1, "#eadfce")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    drawWatercolor(ctx, w, h, rng)
    drawGrain(ctx, w, h, 0.14, rng)
    drawDoodles(ctx, w, h, 0, rng)

    ctx.save()
    ctx.fillStyle = "rgba(251,247,239,.78)"
    roundedRect(ctx, 48, 48, w - 96, h - 96, 40)
    ctx.fill()
    ctx.restore()

    const recipe = payload?.recipe ?? null
    ctx.save()
    ctx.globalAlpha = 0.98
    drawFoodCharacter(ctx, w / 2, h / 2 + 10, 220, recipe)
    ctx.restore()

    return c.toDataURL("image/png")
  }

  renderPoster(payload) {
    const w = 900
    const h = 1600
    const dpr = 1
    const c = document.createElement("canvas")
    c.width = w * dpr
    c.height = h * dpr
    const ctx = c.getContext("2d")
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const rng = createRng((this.seed ^ 0xa5a5a5a5) >>> 0)
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, "#f5efe6")
    g.addColorStop(1, "#eadfce")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    drawWatercolor(ctx, w, h, rng)
    drawGrain(ctx, w, h, 0.14, rng)

    ctx.save()
    ctx.fillStyle = "rgba(251,247,239,.82)"
    roundedRect(ctx, 60, 90, w - 120, h - 180, 36)
    ctx.fill()
    ctx.restore()

    const title = payload?.title ?? "纸上小厨房"
    const name = payload?.name ?? ""
    const tags = payload?.tags ?? []
    const quote = payload?.quote ?? ""
    const recipe = payload?.recipe ?? null

    ctx.fillStyle = "rgba(42,42,42,.9)"
    ctx.font = "700 54px ui-rounded, system-ui, -apple-system, sans-serif"
    ctx.fillText(title, 120, 190)

    ctx.font = "700 62px ui-rounded, system-ui, -apple-system, sans-serif"
    ctx.fillText(name, 120, 286)

    ctx.font = "500 30px ui-rounded, system-ui, -apple-system, sans-serif"
    const tagY = 340
    let x = 120
    for (const t of tags.slice(0, 4)) {
      const padX = 18
      const tw = ctx.measureText(t).width
      ctx.fillStyle = "rgba(231,160,124,.16)"
      roundedRect(ctx, x, tagY, tw + padX * 2, 52, 26)
      ctx.fill()
      ctx.strokeStyle = "rgba(231,160,124,.24)"
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = "rgba(42,42,42,.78)"
      ctx.fillText(t, x + padX, tagY + 36)
      x += tw + padX * 2 + 14
    }

    ctx.save()
    ctx.globalAlpha = 0.96
    drawFoodCharacter(ctx, w / 2, 660, 120, recipe)
    ctx.restore()

    ctx.fillStyle = "rgba(42,42,42,.84)"
    ctx.font = "500 34px ui-rounded, system-ui, -apple-system, sans-serif"
    const lines = wrapLines(ctx, quote, 660)
    let y = 885
    for (const line of lines.slice(0, 6)) {
      ctx.fillText(line, 120, y)
      y += 52
    }

    const date = new Date()
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    ctx.fillStyle = "rgba(42,42,42,.52)"
    ctx.font = "500 26px ui-rounded, system-ui, -apple-system, sans-serif"
    ctx.fillText(stamp, 120, h - 170)
    ctx.fillText("纯离线 · 只属于此刻", w - 360, h - 170)

    return c.toDataURL("image/png")
  }
}

export const wrapLines = (ctx, text, maxWidth) => {
  const words = (text ?? "").split("")
  const lines = []
  let line = ""
  for (const w of words) {
    const test = line + w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}
