import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from 'cn'

const buttonClasses =
  'inline-flex min-h-11 items-center justify-center border border-(--control-rule) px-3.5 py-2 text-sm leading-[1.55] text-(--ink) transition-colors duration-150 ease-out hover:bg-(--panel-2)'

export function SiteButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button type="button" {...props} className={cn(buttonClasses, className)} />
  )
}

export function SiteButtonLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return <Link {...props} className={cn(buttonClasses, className)} />
}
