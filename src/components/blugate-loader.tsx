import { BluegateBar } from '@/components/bluegate-bar'
import { Stepper } from '@/components/stepper'
import { cn } from '@/lib/utils/cn'

export const BluegateLoader = () => {
  return (
    <div
      className={cn(
        'border-border bg-background container flex flex-1 flex-col items-center justify-center gap-12 border'
        // 'fixed inset-0 z-50'
      )}
    >
      <BluegateBar width={270} height={282} />
      <Stepper />
    </div>
  )
}
