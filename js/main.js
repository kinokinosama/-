import { ARCHETYPES, DIM_KEYS, QUESTIONS } from "./questions.js"
import { StageRenderer } from "./render.js"

const pickBestArchetype = (dims) => {
  const ranked = [...DIM_KEYS].sort((a, b) => {
    const da = dims[a] ?? 0
    const db = dims[b] ?? 0
    if (db !== da) return db - da
    return DIM_KEYS.indexOf(a) - DIM_KEYS.indexOf(b)
  })
  const k1 = ranked[0] ?? DIM_KEYS[0]
  const k2 = ranked.find((k) => k !== k1) ?? DIM_KEYS[1]
  const key = [k1, k2].sort().join("|")
  return ARCHETYPES.find((a) => a.pairKey === key) ?? ARCHETYPES[0]
}

const sumDims = (answers) => {
  const dims = Object.fromEntries(DIM_KEYS.map((k) => [k, 0]))
  for (let i = 0; i < QUESTIONS.length; i += 1) {
    const a = answers[i]
    if (a == null) continue
    const eff = QUESTIONS[i]?.options?.[a]?.effects ?? {}
    for (const k of DIM_KEYS) dims[k] += eff[k] ?? 0
  }
  return dims
}

const el = (id) => document.getElementById(id)

const show = (node) => node.classList.remove("hidden")
const hide = (node) => node.classList.add("hidden")

const syncVh = () => {
  const h = window.innerHeight || 0
  document.documentElement.style.setProperty("--vh", `${h * 0.01}px`)
}

const buildResultSections = (wrap, reading, soul) => {
  wrap.innerHTML = ""
  const lines = String(reading ?? "").split("\n")
  const blocks = []
  const isTitle = (s) => {
    const t = String(s ?? "").trim()
    if (!t) return null
    if (t === "为什么是这道菜？" || t === "为什么是这道菜?") return "为什么是这道菜"
    if (t === "内心戏：" || t === "内心戏:") return "内心戏"
    if (t === "建议：" || t === "建议:") return "建议"
    return null
  }

  let cur = null
  for (const raw of lines) {
    const t = isTitle(raw)
    if (t) {
      cur = { title: t, body: "" }
      blocks.push(cur)
      continue
    }
    if (!cur) {
      cur = { title: "分析", body: "" }
      blocks.push(cur)
    }
    cur.body += (cur.body ? "\n" : "") + raw
  }

  if (blocks.length) {
    for (const b of blocks) {
      const sec = document.createElement("section")
      sec.className = "block"
      const title = document.createElement("div")
      title.className = "block-title"
      title.textContent = b.title
      const body = document.createElement("div")
      body.className = "block-body"
      body.textContent = String(b.body ?? "").trim()
      sec.appendChild(title)
      sec.appendChild(body)
      wrap.appendChild(sec)
    }
  }

  const s = String(soul ?? "")
    .replace(/^💡?\s*【灵魂侧写】/g, "")
    .replace(/^灵魂侧写[:：]/g, "")
    .trim()
  if (s) {
    const divider = document.createElement("div")
    divider.className = "soul-divider"
    divider.textContent = "------"
    const text = document.createElement("div")
    text.className = "soul-text"
    text.textContent = s
    wrap.appendChild(divider)
    wrap.appendChild(text)
  }
}

const setScreen = (screens, name) => {
  for (const [k, v] of Object.entries(screens)) {
    if (k === name) show(v)
    else hide(v)
  }
}

const buildOptions = (wrap, q, selectedIndex, onPick) => {
  wrap.innerHTML = ""
  q.options.forEach((opt, idx) => {
    const b = document.createElement("button")
    b.type = "button"
    b.className = `btn option${selectedIndex === idx ? " selected" : ""}`
    b.textContent = opt.text
    b.setAttribute("aria-pressed", selectedIndex === idx ? "true" : "false")
    b.addEventListener("click", () => onPick(idx), { passive: true })
    wrap.appendChild(b)
  })
}

const main = () => {
  const frame = el("frame")
  const canvas = el("stage")
  const renderer = new StageRenderer(canvas)

  const screens = {
    home: el("screen-home"),
    quiz: el("screen-quiz"),
    result: el("screen-result"),
  }

  const error = el("error")
  const btnStart = el("btn-start")
  const btnPrev = el("btn-prev")
  const btnReset = el("btn-reset")
  const btnRestart = el("btn-restart")

  const progress = el("progress")
  const question = el("question")
  const options = el("options")

  const resultName = el("result-name")
  const resultFood = el("result-food")
  const resultSections = el("result-sections")
  let stopped = false

  const showError = () => {
    if (stopped) return
    stopped = true
    show(error)
  }

  const state = {
    screen: "home",
    qIndex: 0,
    answers: Array.from({ length: QUESTIONS.length }).fill(null),
    result: null,
  }

  const resize = () => {
    const rect = frame.getBoundingClientRect()
    const w = Math.max(1, rect.width)
    const h = Math.max(1, rect.height)
    renderer.resize(w, h)
  }

  const goHome = () => {
    state.screen = "home"
    state.qIndex = 0
    state.answers.fill(null)
    state.result = null
    renderer.setMode("home", null)
    setScreen(screens, "home")
  }

  const goQuiz = () => {
    state.screen = "quiz"
    state.qIndex = 0
    state.answers.fill(null)
    state.result = null
    renderer.setMode("quiz", null)
    setScreen(screens, "quiz")
    renderQuestion()
  }

  const goResult = () => {
    const dims = sumDims(state.answers)
    const r = pickBestArchetype(dims)
    state.result = r
    state.screen = "result"
    renderer.setMode("result", null)
    setScreen(screens, "result")
    resultName.textContent = r.name
    resultFood.src = r.image ? encodeURI(r.image) : renderer.renderFoodImage({ recipe: r.visualRecipe })
    buildResultSections(resultSections, r.reading, r.soul)
  }

  const renderQuestion = () => {
    const idx = state.qIndex
    const q = QUESTIONS[idx]
    progress.textContent = `第 ${idx + 1} / ${QUESTIONS.length} 题`
    question.textContent = q.text
    btnPrev.disabled = idx === 0
    buildOptions(options, q, state.answers[idx], (optIndex) => {
      state.answers[idx] = optIndex
      if (idx < QUESTIONS.length - 1) {
        state.qIndex += 1
        renderQuestion()
      } else {
        goResult()
      }
    })
  }

  btnStart?.addEventListener("click", goQuiz, { passive: true })
  btnReset?.addEventListener("click", goHome, { passive: true })
  btnRestart?.addEventListener("click", goQuiz, { passive: true })

  btnPrev?.addEventListener(
    "click",
    () => {
      if (state.qIndex <= 0) return
      state.qIndex -= 1
      renderQuestion()
    },
    { passive: true },
  )

  const onResize = () => {
    syncVh()
    resize()
  }

  window.addEventListener("resize", onResize, { passive: true })
  window.addEventListener("orientationchange", onResize, { passive: true })

  const loop = (t) => {
    if (stopped) return
    try {
      renderer.draw(t)
    } catch (e) {
      showError()
      return
    }
    requestAnimationFrame(loop)
  }

  syncVh()
  resize()
  goHome()
  requestAnimationFrame(loop)

  window.addEventListener("error", showError, { passive: true })
  window.addEventListener("unhandledrejection", showError, { passive: true })
}

try {
  main()
} catch (e) {
  const err = document.getElementById("error")
  if (err) err.classList.remove("hidden")
}
