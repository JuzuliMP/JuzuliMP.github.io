import type { ShaderMaterial, Vector2, WebGLRenderer } from 'three'
import { completeLoadTask } from '../loaderGate'
import {
  clearTrail,
  createTrail,
  createTrailUniforms,
  isTrailIdle,
  pushPointer,
  releasePointer,
  writeTrailUniforms,
  MAX_DISPLACEMENT,
  SWIRL,
  TOUCH_GAIN,
  TRAIL_LENGTH,
  TRAIL_LIFE_MS,
  TRAIL_RADIUS_PX,
} from './dragTrail'
import {
  SCENE_ANCHOR_ATTR,
  SCENE_TEXT_ATTR,
  chapterSide,
  mobileShapeCenter,
  particleCount,
  sceneLayout,
  type SceneLayout,
} from './layout'
import {
  fadeOpacity,
  morphProgress,
  phoneMorphProgress,
  snapState,
  stateFromProgress,
  textOverlapDim,
  type MorphState,
  type PhoneChapter,
} from './morph'
import { SHAPE_ORDER, buildShape, sampleStyle, type ShapeName } from './shapes'
import { fieldTilt, iconSway } from './tilt'
import { combineMotion, followLevel, morphMotion, nearBox, stirMotion } from './motionLevel'
import { CENTRE_PLACE, blendPlaces, morphPlace, placeChanged, recede, stirPlace, type ShapeBox } from './motionSpace'
import type { SoundPlace } from '../../../lib/sandSpace'

export type SceneOptions = {
  /** Shape of each chapter, in order. The hero always shows the field. */
  shapes: ReadonlyArray<Exclude<ShapeName, 'field'>>
  /** DOM ids of the chapter sections, one per shape. Their position drives the morph. */
  sectionIds: readonly string[]
  /** DOM id of the section the canvas fades out over (Selected apps). */
  fadeId: string
  seed?: number
  signal?: AbortSignal
  /**
   * Called with how much the particles are moving (0..1) and where on screen
   * the motion is, whenever either changes; drives the sand sound.
   */
  onMotion?: (level: number, place: SoundPlace) => void
}

export type SceneHandle = { dispose: () => void }

const FOV = 35
const CAM_Z = 6

const VERTEX = /* glsl */ `
attribute vec3 aPhone;
attribute vec3 aCode;
attribute vec3 aGlobe;
attribute vec4 aAlpha;
attribute vec3 aColor;
attribute float aSize;
attribute float aRand;
attribute float aAmbient;

uniform float uFrom;
uniform float uTo;
uniform float uT;
uniform float uTime;
uniform float uDpr;
uniform float uScale;
uniform float uRotY;
uniform vec2 uFieldTilt; // hero field: yaw (around y), pitch (around x), radians
uniform float uTwinkle;
uniform float uOpacity;
uniform vec2 uSpread;
uniform vec2 uOffFrom;
uniform vec2 uOffTo;
// Pointer trail (see dragTrail.ts): xy = position (world), zw = unit direction of travel; K = push in world units (signed: the spring overshoots).
uniform float uTrailOn;
uniform vec4 uTrailCfg; // 2 / radius^2, swirl, softening^2, 1 / (side softening)
uniform vec4 uTrail[${TRAIL_LENGTH}];
uniform float uTrailK[${TRAIL_LENGTH}];

varying vec3 vColor;
varying float vAlpha;

vec3 pickPos(float i) {
  if (i < 0.5) return position;
  if (i < 1.5) return aPhone;
  if (i < 2.5) return aCode;
  return aGlobe;
}

float pickAlpha(float i) {
  if (i < 0.5) return aAlpha.x;
  if (i < 1.5) return aAlpha.y;
  if (i < 2.5) return aAlpha.z;
  return aAlpha.w;
}

// A shape's point in world units: dust stretches across the viewport, the field stretches across it
// and rocks gently (tilt.ts), the icons sway around y.
vec3 place(float i, vec2 off) {
  vec3 p = pickPos(i);
  if (aAmbient > 0.5) {
    p.xy *= uSpread;
  } else if (i < 0.5) {
    p.x *= uSpread.x;
    float cy = cos(uFieldTilt.x);
    float sy = sin(uFieldTilt.x);
    p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
    float cx = cos(uFieldTilt.y);
    float sx = sin(uFieldTilt.y);
    p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
  } else {
    float c = cos(uRotY);
    float s = sin(uRotY);
    p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }
  p *= uScale;
  p.xy += off;
  return p;
}

void main() {
  vec3 a = place(uFrom, uOffFrom);
  vec3 b = place(uTo, uOffTo);

  // Each point starts a little later than the next, then eases in.
  float k = clamp((uT - aRand * 0.35) / 0.65, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);

  vec3 p = mix(a, b, k);
  float burst = sin(k * 3.14159265);
  p.xy += vec2(aRand - 0.5, fract(aRand * 13.7) - 0.5) * burst * uScale * 0.9;
  p.z += (fract(aRand * 31.1) - 0.5) * burst * uScale;

  // Stir: the pointer parts the points away from its path with a slight swirl (opposite on each side,
  // like a wake), and the spring in K closes the channel again. Screen-aligned, after rotation and
  // offset, and capped so shapes never explode.
  if (uTrailOn > 0.5) {
    vec2 sp = p.xy * (${CAM_Z.toFixed(1)} / (${CAM_Z.toFixed(1)} - p.z));
    vec2 disp = vec2(0.0);
    float wsum = 0.0;
    for (int i = 0; i < ${TRAIL_LENGTH}; i++) {
      float s = uTrailK[i];
      if (s != 0.0) {
        vec2 d = sp - uTrail[i].xy;
        float d2 = dot(d, d);
        float w = exp(-d2 * uTrailCfg.x);
        vec2 away = d * inversesqrt(d2 + uTrailCfg.z);
        vec2 v = uTrail[i].zw;
        float side = clamp((v.x * d.y - v.y * d.x) * uTrailCfg.w, -1.0, 1.0);
        disp += (away + vec2(-away.y, away.x) * (side * uTrailCfg.y)) * (s * w);
        wsum += w;
      }
    }
    // Overlapping samples share the push instead of stacking it, so the channel keeps one width.
    disp /= max(1.0, wsum);
    float cap = ${MAX_DISPLACEMENT.toFixed(2)} * uScale;
    p.xy += disp * (cap * inversesqrt(cap * cap + dot(disp, disp)));
  }

  float alpha = mix(pickAlpha(uFrom), pickAlpha(uTo), k);
  float tw = 1.0 - uTwinkle * 0.4 * (0.5 + 0.5 * sin(uTime * (0.5 + aRand * 1.5) + aRand * 60.0));
  vAlpha = alpha * tw * uOpacity;
  vColor = aColor;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uDpr * (${CAM_Z.toFixed(1)} / -mv.z);
}
`

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor, vAlpha * smoothstep(0.5, 0.32, d));
}
`

type GL = WebGLRenderingContext | WebGL2RenderingContext

function createContext(canvas: HTMLCanvasElement): GL | null {
  const attrs: WebGLContextAttributes = { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'default' }
  try {
    return (canvas.getContext('webgl2', attrs) ?? canvas.getContext('webgl', attrs)) as GL | null
  } catch {
    return null
  }
}

function reportAll() {
  completeLoadTask('scene')
  completeLoadTask('frame')
}

/**
 * Creates the fixed full-viewport particle canvas inside `container`.
 *
 * Resolves to `null` (and leaves the container empty) when WebGL is not
 * available or anything fails: the page works fine without the scene. A WebGL
 * context is requested before three.js is imported, so devices without WebGL
 * never download the chunk.
 */
export async function createParticleScene(container: HTMLElement, options: SceneOptions): Promise<SceneHandle | null> {
  const { signal } = options
  const canvas = document.createElement('canvas')
  const gl = createContext(canvas)
  if (!gl) {
    reportAll()
    return null
  }
  const loseContext = () => (gl.getExtension('WEBGL_lose_context') as { loseContext(): void } | null)?.loseContext()

  let THREE: typeof import('three')
  try {
    THREE = await import('three')
  } catch {
    loseContext()
    reportAll()
    return null
  }
  completeLoadTask('scene')
  if (signal?.aborted) {
    loseContext()
    return null
  }

  let renderer: WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: false })
  } catch {
    loseContext()
    reportAll()
    return null
  }

  // Step 0 is the hero field, then one step per chapter. The shader's four shape slots follow SHAPE_ORDER.
  const slots = (['field', ...options.shapes] as ShapeName[]).map((name) => SHAPE_ORDER.indexOf(name))
  const steps = options.shapes.length
  const sides = options.shapes.map((_, i) => chapterSide(i))

  const count = particleCount(window.innerWidth)
  const seed = options.seed ?? 7

  // Geometry: the field is the base `position`; the other shapes are extra attributes of equal length.
  const built = SHAPE_ORDER.map((name) => buildShape(name, count, seed))
  const style = sampleStyle(count, seed)
  const alpha = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) for (let s = 0; s < 4; s++) alpha[i * 4 + s] = built[s]!.opacity[i]!

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(built[0]!.positions, 3))
  geometry.setAttribute('aPhone', new THREE.BufferAttribute(built[1]!.positions, 3))
  geometry.setAttribute('aCode', new THREE.BufferAttribute(built[2]!.positions, 3))
  geometry.setAttribute('aGlobe', new THREE.BufferAttribute(built[3]!.positions, 3))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 4))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(style.colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(style.sizes, 1))
  geometry.setAttribute('aRand', new THREE.BufferAttribute(style.rand, 1))
  geometry.setAttribute('aAmbient', new THREE.BufferAttribute(style.ambient, 1))

  const trail = createTrail(TRAIL_LENGTH)
  const trailUniforms = createTrailUniforms(TRAIL_LENGTH)

  const material: ShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uFrom: { value: 0 },
      uTo: { value: 1 },
      uT: { value: 0 },
      uTime: { value: 0 },
      uDpr: { value: 1 },
      uScale: { value: 1 },
      uRotY: { value: 0 },
      uFieldTilt: { value: new THREE.Vector2() },
      uTwinkle: { value: 1 },
      uOpacity: { value: 1 },
      uSpread: { value: new THREE.Vector2(1, 1) },
      uOffFrom: { value: new THREE.Vector2() },
      uOffTo: { value: new THREE.Vector2() },
      uTrailOn: { value: 0 },
      uTrailCfg: { value: new THREE.Vector4() },
      uTrail: { value: trailUniforms.data },
      uTrailK: { value: trailUniforms.strength },
    },
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  const scene = new THREE.Scene()
  scene.add(points)
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50)
  camera.position.set(0, 0, CAM_Z)

  renderer.setClearColor(0x000000, 0)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  material.uniforms.uDpr!.value = dpr
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  container.appendChild(canvas)

  const sections = options.sectionIds.map((id) => document.getElementById(id))
  // Phones: each chapter's text block, and the empty stage under it that the finished shape shows in.
  const texts = sections.map((el) => el?.querySelector<HTMLElement>(`[${SCENE_TEXT_ATTR}]`) ?? null)
  const anchors = sections.map((el) => el?.querySelector<HTMLElement>(`[${SCENE_ANCHOR_ATTR}]`) ?? null)
  const fadeEl = document.getElementById(options.fadeId)

  const reducedQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  const fineQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: fine)') : null
  const hoverQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(hover: hover) and (pointer: fine)') : null
  let animated = !reducedQuery?.matches

  let width = 1
  let height = 1
  let layout: SceneLayout
  let worldPerPx = 1
  let progress = 0
  let primed = false
  let last = 0
  let elapsed = 0
  let raf = 0
  let frameQueued = false
  let firstFrame = true
  let disposed = false
  let contextLost = false
  let trailLive = false
  let motion = 0
  let motionSent = 0
  let place: SoundPlace = CENTRE_PLACE
  let placeSent: SoundPlace = CENTRE_PLACE
  const mouse = { x: 0, y: 0, cx: 0, cy: 0 }

  /** Everything that depends on the canvas size. */
  const applyLayout = () => {
    layout = sceneLayout(width, height, sides)
    worldPerPx = (2 * CAM_Z * Math.tan((FOV * Math.PI) / 360)) / height
    material.uniforms.uScale!.value = (layout.sizePx / 2) * worldPerPx
    ;(material.uniforms.uSpread!.value as Vector2).set(layout.spreadX, layout.spreadY)
    const radius = TRAIL_RADIUS_PX * worldPerPx
    material.uniforms.uTrailCfg!.value.set(2 / (radius * radius), SWIRL, (0.15 * radius) ** 2, 1 / (0.25 * radius))
  }

  const resize = () => {
    width = Math.max(1, container.clientWidth || window.innerWidth)
    height = Math.max(1, container.clientHeight || window.innerHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    applyLayout()
  }

  const setOffset = (target: Vector2, index: number) => {
    const o = layout.offsets[index] ?? layout.offsets[0]!
    target.set(o.x * worldPerPx, -o.y * worldPerPx)
  }

  const draw = (now: number) => {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
    last = now

    let target: number
    let textDim = 1
    if (layout.mobile) {
      // Phones: the shape is fixed on screen like on desktop and the page scrolls normally over it.
      const center = mobileShapeCenter(height)
      const chapters: PhoneChapter[] = sections.map((_, i) => {
        const text = texts[i]
        const stage = anchors[i]
        if (!text || !stage) return { textTop: Number.POSITIVE_INFINITY, stageCenter: Number.POSITIVE_INFINITY }
        const s = stage.getBoundingClientRect()
        return { textTop: text.getBoundingClientRect().top, stageCenter: s.top + s.height / 2 }
      })
      target = phoneMorphProgress(chapters, center, layout.sizePx)
      textDim = textOverlapDim(
        texts.map((el) => (el ? el.getBoundingClientRect() : { top: Number.POSITIVE_INFINITY, bottom: Number.POSITIVE_INFINITY })),
        center,
        layout.sizePx,
      )
    } else {
      const tops = sections.map((el) => (el ? el.getBoundingClientRect().top : Number.POSITIVE_INFINITY))
      target = morphProgress(tops, height)
    }
    let state: MorphState
    const before = progress
    const wasPrimed = primed
    if (animated) {
      // Follow the scroll closely (a touch tighter on phones, where flicks are short) but never jump.
      progress = primed ? progress + (target - progress) * (1 - Math.exp(-dt * (layout.mobile ? 9 : 6))) : target
      state = stateFromProgress(progress, steps)
      elapsed += dt
    } else {
      progress = target
      state = snapState(target, steps)
    }
    primed = true

    const fade = fadeEl ? fadeOpacity(fadeEl.getBoundingClientRect().top, height) : 1
    container.style.opacity = fade < 0.01 ? '0' : '1'
    const u = material.uniforms
    u.uFrom!.value = slots[state.from] ?? 0
    u.uTo!.value = slots[state.to] ?? 0
    u.uT!.value = state.t
    u.uTime!.value = animated ? elapsed : 0
    u.uTwinkle!.value = animated ? 1 : 0
    reportMotion(now, dt, wasPrimed ? Math.abs(progress - before) : 0, state, fade)
    u.uRotY!.value = animated ? iconSway(elapsed) : 0
    // The hero field rocks slowly on its own, so the hero is never static (none with reduced motion).
    const tilt = animated ? fieldTilt(elapsed) : { yaw: 0, pitch: 0 }
    ;(u.uFieldTilt!.value as Vector2).set(tilt.yaw, tilt.pitch)
    // Phones: particles dim while text passes over them, so the copy stays readable (follows scroll, no timers).
    u.uOpacity!.value = fade * layout.dim * textDim
    setOffset(u.uOffFrom!.value as Vector2, state.from)
    setOffset(u.uOffTo!.value as Vector2, state.to)

    // Pointer trail: only touch the uniforms while there is something to draw.
    if (animated && !isTrailIdle(trail, now)) {
      writeTrailUniforms(trail, now, { width, height, worldPerPx }, trailUniforms)
      u.uTrailOn!.value = 1
      trailLive = true
    } else if (trailLive) {
      u.uTrailOn!.value = 0
      trailLive = false
    }

    if (animated && fineQuery?.matches) {
      // A light parallax; kept small so it does not fight the drag effect (the trail lives in screen space).
      const k = 1 - Math.exp(-dt * 4)
      mouse.cx += (mouse.x * 0.3 - mouse.cx) * k
      mouse.cy += (-mouse.y * 0.18 - mouse.cy) * k
      camera.position.set(mouse.cx, mouse.cy, CAM_Z)
    } else {
      camera.position.set(0, 0, CAM_Z)
    }
    camera.lookAt(0, 0, 0)

    if (fade >= 0.01 && !contextLost) {
      renderer.render(scene, camera)
      if (firstFrame) {
        firstFrame = false
        completeLoadTask('frame')
      }
    }
  }

  /** A shape's box on screen (viewport px): the field spans the width, an icon is its own box. */
  const shapeBox = (shape: number): ShapeBox => {
    const off = layout.offsets[shape] ?? layout.offsets[0]!
    const half = layout.sizePx / 2
    return {
      cx: width / 2 + off.x,
      cy: height / 2 + off.y,
      halfW: shape === 0 ? width / 2 : half,
      halfH: shape === 0 ? 0.6 * half : half,
    }
  }

  /**
   * Sound of the particles moving: how fast the morph is streaming them, plus
   * pointer stirring while the pointer is over the particles, and where that
   * motion is on screen (see motionSpace.ts). Reported only when it changes,
   * so the audio side gets a few calls per second at rest.
   */
  const reportMotion = (now: number, dt: number, morphStep: number, state: MorphState, fade: number) => {
    if (!options.onMotion) return
    let target = 0
    if (animated && dt > 0 && fade >= 0.01) {
      const morph = morphMotion(morphStep / dt)
      let stir = 0
      let stirAt: SoundPlace | null = null
      if (trail.count > 0 && !isTrailIdle(trail, now)) {
        const h = trail.head
        const fresh = Math.max(0, 1 - (now - trail.born[h]!) / TRAIL_LIFE_MS) ** 2
        const box = shapeBox(state.t < 0.5 ? state.from : state.to)
        const over = nearBox(trail.x[h]!, trail.y[h]!, box, TRAIL_RADIUS_PX)
        stir = stirMotion(Math.hypot(trail.vx[h]!, trail.vy[h]!), fresh * over * trail.gain[h]!)
        if (stir > 0) stirAt = stirPlace(trail.x[h]!, trail.y[h]!, trail.vx[h]!, trail.vy[h]!, width, height)
      }
      target = combineMotion(morph, stir) * Math.min(1, fade)
      if (target > 0) {
        // While the sound fades out after the motion stops, it stays where the motion last was.
        const morphAt = morphPlace(shapeBox(state.from), shapeBox(state.to), state.t, width, height)
        place = recede(stirAt ? blendPlaces(morphAt, morph, stirAt, stir) : morphAt, fade)
      }
    }
    motion = followLevel(motion, target, dt)
    const levelMoved = Math.abs(motion - motionSent) > 0.004 || (motion === 0 && motionSent !== 0)
    if (levelMoved || (motion > 0 && placeChanged(place, placeSent))) {
      motionSent = motion
      placeSent = place
      options.onMotion(motion, place)
    }
  }

  const loop = (now: number) => {
    raf = 0
    if (disposed) return
    draw(now)
    if (animated && !document.hidden && !contextLost) raf = requestAnimationFrame(loop)
  }

  const requestFrame = () => {
    if (disposed || raf || frameQueued) return
    if (animated) {
      if (!document.hidden) raf = requestAnimationFrame(loop)
      return
    }
    // Reduced motion: no loop. Redraw once per scroll / resize.
    frameQueued = true
    requestAnimationFrame((now) => {
      frameQueued = false
      if (!disposed) draw(now)
    })
  }

  const onResize = () => {
    resize()
    requestFrame()
  }
  const onVisibility = () => {
    if (!document.hidden) {
      last = 0
      requestFrame()
    } else {
      clearTrail(trail)
    }
    if (document.hidden && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
  const onPointer = (e: PointerEvent) => {
    mouse.x = e.clientX / width - 0.5
    mouse.y = e.clientY / height - 0.5
    // Drag: mouse and pen on devices that hover, not under reduced motion. Touches arrive as touch events below.
    if (animated && e.pointerType !== 'touch' && hoverQuery?.matches) {
      pushPointer(trail, e.clientX, e.clientY, performance.now())
      requestFrame()
    }
  }
  const onPointerLeave = () => releasePointer(trail)
  const onBlur = () => clearTrail(trail)
  // Touch: passive listeners that never call preventDefault, so scrolling, taps and selection are untouched.
  const onTouchStart = () => releasePointer(trail)
  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!animated || !t) return
    pushPointer(trail, t.clientX, t.clientY, performance.now(), TOUCH_GAIN)
    requestFrame()
  }
  const onTouchEnd = () => releasePointer(trail)
  const onMotionChange = () => {
    animated = !reducedQuery?.matches
    if (!animated) clearTrail(trail)
    last = 0
    primed = false
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    requestFrame()
  }
  const onContextLost = (e: Event) => {
    e.preventDefault()
    contextLost = true
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
  const onContextRestored = () => {
    contextLost = false
    requestFrame()
  }

  resize()
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', requestFrame, { passive: true })
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.documentElement.addEventListener('pointerleave', onPointerLeave)
  window.addEventListener('blur', onBlur)
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  reducedQuery?.addEventListener?.('change', onMotionChange)
  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)

  // First frame straight away so the loader can finish, then keep going.
  draw(performance.now())
  requestFrame()

  return {
    dispose() {
      if (disposed) return
      disposed = true
      if (motionSent !== 0) options.onMotion?.(0, place)
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', requestFrame)
      window.removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      document.removeEventListener('visibilitychange', onVisibility)
      reducedQuery?.removeEventListener?.('change', onMotionChange)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
