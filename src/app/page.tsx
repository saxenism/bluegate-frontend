import Image from 'next/image'

export default function Home() {
  return (
    <div className="border-border container flex flex-1 flex-col items-center border font-sans">
      <main className="flex w-full flex-1 flex-col items-center justify-center gap-10 px-16 py-32 sm:items-start">
        <Image
          src="/logo/full.svg"
          alt="Next.js logo"
          width={295}
          height={80}
          className="mx-auto h-20 w-auto"
          priority
        />

        <p className="mx-auto max-w-180 text-center text-xl leading-[180%] font-medium tracking-[-2%] text-pretty text-[#CACACA]">
          Paste a suspicious repo. Bluegate tells you what it tries to run
          before you do
        </p>
      </main>
    </div>
  )
}
