'use client'

import { useEffect, useState } from 'react'

const STEPS = [
  'Fetching repository',
  'Walking files',
  'Checking workspace tasks',
  'Checking package scripts',
  'Decoding suspicious strings',
  'Checking dependencies',
  'Matching known indicators',
  'Building report',
] as const

export interface StepperProps {
  intervalMs?: number
  loop?: boolean
}

export function Stepper({ intervalMs = 1500, loop = true }: StepperProps) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => {
        const next = i + 1
        if (next >= STEPS.length) return loop ? 0 : STEPS.length - 1
        return next
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, loop])

  return (
    <div className="text-xl leading-6 font-medium text-white">
      <span
        key={idx}
        className="animate-fade-in inline-block text-center select-none"
      >
        {STEPS[idx]}
      </span>
    </div>
  )
}
