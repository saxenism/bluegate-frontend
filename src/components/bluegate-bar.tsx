'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { MetalShader } from './metal-shader'

export interface BluegateBarProps {
  width: number
  height: number
}

// Main centre rect: y=51.39 to y=248.891. Inset by 10px each end, account for 6px bar height.
const BAR_Y_START = 61.39
const BAR_Y_END = 232.891

// Concatenated path data for the 5 bluethroat-logo shapes ("vector") inside the main centre.
// Coordinates are in the SVG viewBox (287x300).
const BLUETHROAT_PATH = [
  'M132.998 182.906V159.35C132.998 157.266 130.13 156.699 129.336 158.626L107.757 208.06C106.928 210.073 109.583 211.675 110.977 210.003L132.556 184.124C132.841 183.782 132.998 183.351 132.998 182.906Z',
  'M178.154 137.329L138.654 178.643C137.469 179.883 135.377 179.044 135.377 177.329V104.774C135.377 103.32 136.87 102.506 138.042 103.024C138.541 103.244 138.913 103.676 139.341 104.014L177.555 134.238C177.982 134.577 178.437 134.933 178.597 135.455C178.794 136.095 178.645 136.816 178.154 137.329Z',
  'M84.9441 90.2507C85.5666 89.8273 86.3836 90.0195 87.1154 90.1968L129.994 100.587C130.726 100.765 131.54 100.759 132.163 101.182C132.667 101.524 132.998 102.102 132.998 102.757V153.05C132.998 154.3 131.872 155.106 130.792 154.933C130.099 154.823 129.639 154.202 129.223 153.637L85.3934 94.1195C84.9774 93.5545 84.3994 93.0709 84.191 92.4009C83.9442 91.6076 84.2606 90.7155 84.9441 90.2507Z',
  'M185.491 99.6853L182.796 131.768C182.578 133.04 181.246 133.652 180.184 133.204C179.667 132.986 179.283 132.542 178.84 132.197L152.929 111.971C152.487 111.626 152.014 111.262 151.855 110.724C151.566 109.748 152.107 108.634 153.191 108.345L183.125 97.5252C184.465 97.1675 185.725 98.3182 185.491 99.6853Z',
  'M186.682 114.99L187.874 99.5763C188.078 98.4172 189.225 97.7886 190.248 98.0667C190.803 98.2178 191.251 98.6238 191.746 98.9189L203.335 105.836C203.829 106.131 204.359 106.443 204.582 106.975C204.877 107.68 204.712 108.51 204.178 109.05C203.732 109.501 203.085 109.683 202.526 109.981L189.94 116.694C189.381 116.992 188.777 117.315 188.157 117.182C187.209 116.977 186.496 116.05 186.682 114.99Z',
].join(' ')

export function BluegateBar({ width, height }: BluegateBarProps) {
  const barRef = useRef<SVGRectElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    bar.setAttribute('y', String(BAR_Y_START))
    const tween = gsap.to(bar, {
      attr: { y: BAR_Y_END },
      duration: 2.0,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
    return () => {
      tween.kill()
    }
  }, [])

  return (
    <div style={{ width, height }} className="relative">
      {/* Layer 1: white rect + side walls */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 287 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0"
      >
        <rect
          x="76.8657"
          y="51.3901"
          width="133.011"
          height="197.501"
          fill="white"
        />
        <path
          d="M63.375 50.4348V249.845L0.107422 299.053V1.22681L63.375 50.4348Z"
          fill="url(#bg_paint0)"
          stroke="url(#bg_paint1)"
          strokeWidth="0.215488"
        />
        <path
          d="M223.366 49.4277V248.838L286.634 298.046V0.219727L223.366 49.4277Z"
          fill="url(#bg_paint2)"
          stroke="url(#bg_paint3)"
          strokeWidth="0.215488"
        />
        <defs>
          <linearGradient
            id="bg_paint0"
            x1="62.4748"
            y1="162.232"
            x2="-50.3829"
            y2="162.232"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="0.155588" stopColor="white" stopOpacity="0.6" />
            <stop offset="0.276887" stopColor="white" stopOpacity="0.3" />
            <stop offset="0.614789" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="bg_paint1"
            x1="62.4748"
            y1="144.095"
            x2="7.05361"
            y2="143.087"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="bg_paint2"
            x1="224.266"
            y1="161.225"
            x2="337.124"
            y2="161.225"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="0.155588" stopColor="white" stopOpacity="0.6" />
            <stop offset="0.276887" stopColor="white" stopOpacity="0.3" />
            <stop offset="0.614789" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="bg_paint3"
            x1="224.266"
            y1="143.087"
            x2="279.688"
            y2="142.08"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Layer 2: metal shader masked to the bluethroat-logo shape */}
      <MetalShader
        width={width}
        height={height}
        svgPath={BLUETHROAT_PATH}
        svgWidth={287}
        svgHeight={300}
        svgScale={1}
        tintColor={{ r: 0.35, g: 0.55, b: 1.0 }}
        className="absolute inset-0"
      />

      {/* Layer 3: scanning bar on top */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 287 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0"
      >
        <g filter="url(#bar_filter)">
          <rect
            ref={barRef}
            x="69"
            y={BAR_Y_START}
            width="148"
            height="6"
            rx="3"
            fill="url(#bar_grad)"
          />
        </g>
        <defs>
          <filter
            id="bar_filter"
            x="58"
            y="48"
            width="164"
            height="206"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dx="-3" dy="1" />
            <feGaussianBlur stdDeviation="4" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0.333333 0 0 0 0 1 0 0 0 1 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="0.5"
              result="effect2_foregroundBlur"
            />
          </filter>
          <radialGradient
            id="bar_grad"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(143 65) scale(82 22.3736)"
          >
            <stop stopColor="#015DD5" />
            <stop offset="1" stopColor="#006EFF" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
