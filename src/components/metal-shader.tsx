'use client'

import { cn } from 'cn'
import { useRef, useEffect, useCallback } from 'react'

export interface MetalConfig {
  roughness: number
  specular: number
  fresnel: number
  flowSpeed: number
  distortion: number
  tint: number
  brushAngle: number
  tonemap: number
}

const DEFAULT_CONFIG: MetalConfig = {
  roughness: 0.65,
  specular: 1.55,
  fresnel: 0.95,
  flowSpeed: 0.45,
  distortion: 0.5,
  tint: 0.08,
  brushAngle: 0,
  tonemap: 0.5,
}

function getLogoTransform(
  w: number,
  h: number,
  svgScale: number,
  svgWidth: number,
  svgHeight: number
) {
  // Fit-contain the svg viewBox into the canvas, centered, scaled by svgScale.
  const fit = Math.min(w / svgWidth, h / svgHeight)
  const scale = fit * svgScale
  const drawW = svgWidth * scale
  const drawH = svgHeight * scale
  const offsetX = (w - drawW) / 2
  const offsetY = (h - drawH) / 2
  return { scale, offsetX, offsetY }
}

export interface TintColor {
  r: number
  g: number
  b: number
}

export interface MetalShaderProps {
  width: number
  height: number
  svgPath: string
  svgWidth: number
  svgHeight: number
  svgScale?: number
  config?: Partial<MetalConfig>
  theme?: 'light' | 'dark'
  /** Per-channel multiplier applied to the metal color before tonemap. Default: white (no tint). */
  tintColor?: TintColor
  className?: string
}

export function MetalShader({
  width,
  height,
  svgPath,
  svgWidth,
  svgHeight,
  svgScale = 1,
  config: configOverride,
  theme = 'dark',
  tintColor,
  className,
}: MetalShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const configRef = useRef<MetalConfig>({
    ...DEFAULT_CONFIG,
    ...configOverride,
  })
  const svgScaleRef = useRef(svgScale)
  const mouseRef = useRef({ x: 0.5, y: 0.5 }) // normalized [0..1] within canvas
  const shadeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const envDataRef = useRef<Uint8ClampedArray | null>(null)
  const maskPixelsRef = useRef<Uint8ClampedArray | null>(null)
  const blurPixelsRef = useRef<Uint8ClampedArray | null>(null)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1, renderScale: 1 })
  const needsRebuildRef = useRef(true)
  const themeRef = useRef(theme)
  const svgPathRef = useRef(svgPath)
  const svgWidthRef = useRef(svgWidth)
  const svgHeightRef = useRef(svgHeight)
  const startTimeRef = useRef<number | null>(null)
  const tintRef = useRef<TintColor>(tintColor ?? { r: 1, g: 1, b: 1 })

  useEffect(() => {
    configRef.current = { ...DEFAULT_CONFIG, ...configOverride }
    themeRef.current = theme
    tintRef.current = tintColor ?? { r: 1, g: 1, b: 1 }
  }, [configOverride, theme, tintColor])

  useEffect(() => {
    svgScaleRef.current = svgScale
    svgPathRef.current = svgPath
    svgWidthRef.current = svgWidth
    svgHeightRef.current = svgHeight
    needsRebuildRef.current = true
  }, [svgScale, svgPath, svgWidth, svgHeight])

  const buildEnvMap = useCallback(() => {
    const size = 1024
    const data = new Uint8ClampedArray(size * 4)
    for (let i = 0; i < size; i++) {
      const t = i / size
      let v = 25
      v += 230 * Math.exp(-((t - 0.48) * (t - 0.48)) / 0.003)
      v += 140 * Math.exp(-((t - 0.2) * (t - 0.2)) / 0.004)
      v += 160 * Math.exp(-((t - 0.72) * (t - 0.72)) / 0.005)
      v += 40 * Math.exp(-((t - 0.35) * (t - 0.35)) / 0.02)
      v += 35 * Math.exp(-((t - 0.6) * (t - 0.6)) / 0.015)
      v += 60 * Math.exp(-((t - 0.05) * (t - 0.05)) / 0.003)
      v += 55 * Math.exp(-((t - 0.9) * (t - 0.9)) / 0.004)
      const c = Math.min(255, v | 0)
      const idx = i * 4
      data[idx] = c
      data[idx + 1] = c
      data[idx + 2] = c
      data[idx + 3] = 255
    }
    envDataRef.current = data
  }, [])

  const buildMask = useCallback(() => {
    const w = sizeRef.current.w
    const h = sizeRef.current.h
    const renderScale = sizeRef.current.renderScale
    const sw = Math.round(w * renderScale)
    const sh = Math.round(h * renderScale)
    if (w === 0 || h === 0) return

    if (!maskCanvasRef.current)
      maskCanvasRef.current = document.createElement('canvas')
    const mc = maskCanvasRef.current
    mc.width = sw
    mc.height = sh

    const { scale, offsetX, offsetY } = getLogoTransform(
      w,
      h,
      svgScaleRef.current,
      svgWidthRef.current,
      svgHeightRef.current
    )
    const path2d = new Path2D(svgPathRef.current)

    const mctx = mc.getContext('2d')!
    mctx.fillStyle = '#000'
    mctx.fillRect(0, 0, sw, sh)
    mctx.save()
    mctx.translate(offsetX * renderScale, offsetY * renderScale)
    mctx.scale(scale * renderScale, scale * renderScale)
    mctx.fillStyle = '#fff'
    mctx.fill(path2d)
    mctx.restore()
    maskPixelsRef.current = mctx.getImageData(0, 0, sw, sh).data

    const bc = document.createElement('canvas')
    bc.width = sw
    bc.height = sh
    const bctx = bc.getContext('2d')!
    bctx.filter = `blur(${Math.round(5 * renderScale)}px)`
    bctx.drawImage(mc, 0, 0)
    blurPixelsRef.current = bctx.getImageData(0, 0, sw, sh).data

    needsRebuildRef.current = false
  }, [])

  const init = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = width
    const h = height
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const renderScale = Math.min(dpr, 1.5)
    sizeRef.current = { w, h, dpr, renderScale }
    needsRebuildRef.current = true
    startTimeRef.current = null

    const sw = Math.round(w * renderScale)
    const sh = Math.round(h * renderScale)
    if (!shadeCanvasRef.current)
      shadeCanvasRef.current = document.createElement('canvas')
    shadeCanvasRef.current.width = sw
    shadeCanvasRef.current.height = sh

    if (!envDataRef.current) buildEnvMap()
  }, [width, height, buildEnvMap])

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      }
    }
    canvas.addEventListener('mousemove', onMouse)
    return () => {
      canvas.removeEventListener('mousemove', onMouse)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let outImg: ImageData | null = null
    let lastSw = 0
    let lastSh = 0

    const tonemapLUT = new Uint8Array(256)
    let lastTonemap = -1

    let glowPath: Path2D | null = null
    let lastGlowSvg = ''

    let lastBrushAngle = -999
    let brushCos = 1
    let brushSin = 0

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const introElapsed = (timestamp - startTimeRef.current) * 0.001
      const introDuration = 2.0

      if (needsRebuildRef.current) buildMask()

      const cfg = configRef.current
      const dpr = sizeRef.current.dpr
      const w = sizeRef.current.w
      const h = sizeRef.current.h
      const time = timestamp * 0.001
      const mouse = mouseRef.current
      const envData = envDataRef.current
      const mask = maskPixelsRef.current
      const blur = blurPixelsRef.current
      const shadeCanvas = shadeCanvasRef.current

      if (!envData || !mask || !blur || !shadeCanvas || w === 0) {
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      const renderScale = sizeRef.current.renderScale
      const sw = Math.round(w * renderScale)
      const sh = Math.round(h * renderScale)

      const sctx = shadeCanvas.getContext('2d')!
      if (!outImg || sw !== lastSw || sh !== lastSh) {
        outImg = sctx.createImageData(sw, sh)
        lastSw = sw
        lastSh = sh
      }
      const out = outImg.data
      // Transparent outside the masked region (overlay-friendly)
      for (let i = 0, len = out.length; i < len; i += 4) {
        out[i] = 0
        out[i + 1] = 0
        out[i + 2] = 0
        out[i + 3] = 0
      }

      const stride = sw * 4
      const envLen = 1024

      if (cfg.tonemap !== lastTonemap) {
        lastTonemap = cfg.tonemap
        if (cfg.tonemap === 1.0) {
          for (let i = 0; i < 256; i++) tonemapLUT[i] = i
        } else {
          const invTone = 1 / cfg.tonemap
          for (let i = 0; i < 256; i++) {
            tonemapLUT[i] = (255 * Math.pow(i / 255, invTone)) | 0
          }
        }
      }

      if (cfg.brushAngle !== lastBrushAngle) {
        lastBrushAngle = cfg.brushAngle
        brushCos = Math.cos(cfg.brushAngle)
        brushSin = Math.sin(cfg.brushAngle)
      }

      const mx = mouse.x
      const my = mouse.y

      const isLight = themeRef.current === 'light'
      const cfgRoughness = cfg.roughness
      const cfgFlowSpeed = cfg.flowSpeed
      const cfgDistortion = cfg.distortion
      const cfgTint = cfg.tint
      const cfgFresnel = cfg.fresnel
      const cfgSpecular = cfg.specular
      const cfgBrushAngle = cfg.brushAngle

      const t13 = time * cfgFlowSpeed * 1.3
      const t09 = time * cfgFlowSpeed * 0.9
      const t05 = time * cfgFlowSpeed * 0.5
      const t18 = time * cfgFlowSpeed * 1.8
      const tEnv = time * cfgFlowSpeed * 0.03

      const tintR = tintRef.current.r
      const tintG = tintRef.current.g
      const tintB = tintRef.current.b
      const tintActive = tintR !== 1 || tintG !== 1 || tintB !== 1

      const invSw = 1 / sw
      const invSh = 1 / sh

      for (let y = 1; y < sh - 1; y++) {
        const yOff = y * stride
        const py = y * invSh

        for (let x = 1; x < sw - 1; x++) {
          const idx = yOff + x * 4
          if (mask[idx] < 128) continue

          const left = blur[idx - 4]
          const right = blur[idx + 4]
          const up = blur[idx - stride]
          const down = blur[idx + stride]

          let nx = (right - left) / 510
          let ny = (down - up) / 510

          const px = x * invSw

          const r1 =
            Math.sin(px * 18 * cfgRoughness + t13) *
            Math.cos(py * 14 * cfgRoughness + t09) *
            0.2 *
            cfgDistortion
          const r2 =
            Math.sin((px + py) * 22 * cfgRoughness - t05) * 0.12 * cfgDistortion
          const r3 =
            Math.cos(px * 30 * cfgRoughness + py * 10 - t18) *
            0.08 *
            cfgDistortion

          nx += r1 + r2
          ny += r3 + r1 * 0.6

          const envCoord = (nx + r2) * 4 + px * 2 + tEnv
          let envU = envCoord - Math.floor(envCoord)
          if (envU < 0) envU += 1
          const envIdx = ((envU * (envLen - 1)) | 0) * 4

          let cr = envData[envIdx]
          let cg = envData[envIdx + 1]
          let cb = envData[envIdx + 2]

          let envU2 = envU + 0.35 + ny * 2.5
          envU2 = envU2 - Math.floor(envU2)
          const envIdx2 = ((envU2 * (envLen - 1)) | 0) * 4
          cr = (cr * 0.65 + envData[envIdx2] * 0.35) | 0
          cg = (cg * 0.65 + envData[envIdx2 + 1] * 0.35) | 0
          cb = (cb * 0.65 + envData[envIdx2 + 2] * 0.35) | 0

          cr = ((cr * (cr + 60)) / 315) | 0
          cg = ((cg * (cg + 60)) / 315) | 0
          cb = ((cb * (cb + 60)) / 315) | 0

          if (isLight) {
            cr = 255 - cr
            cg = 255 - cg
            cb = 255 - cb
            if (cr > 225) cr = 225
            if (cg > 225) cg = 225
            if (cb > 223) cb = 223
          } else {
            if (cr < 30) cr = 30
            if (cg < 30) cg = 30
            if (cb < 32) cb = 32
          }

          if (cfgTint > 0.01) {
            cr = (cr * (1 + cfgTint * 0.25)) | 0
            cg = (cg * (1 + cfgTint * 0.08)) | 0
            if (cr > 255) cr = 255
            if (cg > 255) cg = 255
          }

          const minEdge =
            left < right
              ? left < up
                ? left < down
                  ? left
                  : down
                : up < down
                  ? up
                  : down
              : right < up
                ? right < down
                  ? right
                  : down
                : up < down
                  ? up
                  : down
          const edgeness = 1 - minEdge / 255
          if (edgeness > 0.02) {
            const f = edgeness * edgeness * cfgFresnel
            cr = (cr + f * 200) | 0
            cg = (cg + f * 200) | 0
            cb = (cb + f * 210) | 0
          }

          const ldx = px - mx
          const ldy = py - my
          const ld2 = ldx * ldx + ldy * ldy
          if (ld2 < 0.12) {
            const sx = ldx + nx * 0.4
            const sy = ldy + ny * 0.4
            const sd = Math.sqrt(sx * sx + sy * sy)
            const sp = 1 - sd * 4.5
            if (sp > 0) {
              const sp2 = sp * sp
              const spow = sp2 * sp2 * sp2 * cfgSpecular
              cr = (cr + spow * 240) | 0
              cg = (cg + spow * 240) | 0
              cb = (cb + spow * 250) | 0
            }
          }

          if (cfgBrushAngle > 0.01) {
            const bc2 = px * brushCos + py * brushSin
            const br = Math.sin(bc2 * 400 * cfgRoughness + nx * 20) * 0.5 + 0.5
            const bfx = br * 0.15 + 0.85
            cr = (cr * bfx) | 0
            cg = (cg * bfx) | 0
            cb = (cb * bfx) | 0
          }

          if (tintActive) {
            cr = (cr * tintR) | 0
            cg = (cg * tintG) | 0
            cb = (cb * tintB) | 0
          }

          out[idx] = tonemapLUT[cr > 255 ? 255 : cr < 0 ? 0 : cr]
          out[idx + 1] = tonemapLUT[cg > 255 ? 255 : cg < 0 ? 0 : cg]
          out[idx + 2] = tonemapLUT[cb > 255 ? 255 : cb < 0 ? 0 : cb]
          out[idx + 3] = 255
        }
      }

      sctx.putImageData(outImg, 0, 0)

      // No intro fade — vector is present from frame 0
      void introElapsed
      void introDuration
      const introFade = 1

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.globalAlpha = introFade
      ctx.drawImage(
        shadeCanvas,
        0,
        0,
        sw,
        sh,
        0,
        0,
        canvas.width,
        canvas.height
      )
      ctx.globalAlpha = 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const {
        scale: lScale,
        offsetX: lOx,
        offsetY: lOy,
      } = getLogoTransform(
        w,
        h,
        svgScaleRef.current,
        svgWidthRef.current,
        svgHeightRef.current
      )
      const curSvg = svgPathRef.current
      if (curSvg !== lastGlowSvg) {
        glowPath = new Path2D(curSvg)
        lastGlowSvg = curSvg
      }
      ctx.save()
      ctx.globalCompositeOperation = isLight ? 'multiply' : 'screen'
      ctx.filter = `blur(${12 + Math.sin(time * 0.3) * 3}px)`
      ctx.globalAlpha = 0.06 * cfgFresnel * introFade
      ctx.translate(lOx, lOy)
      ctx.scale(lScale, lScale)
      ctx.fillStyle = isLight ? '#333' : '#ccc'
      ctx.fill(glowPath!)
      ctx.restore()

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [buildMask])

  return <canvas ref={canvasRef} className={cn('block', className)} />
}
