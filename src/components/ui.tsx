import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'danger' | 'icon'

const variants: Record<Variant, string> = {
  primary: 'px-4 py-2.5 text-sm font-semibold text-blue-600',
  danger: 'px-4 py-2.5 text-sm font-semibold text-red-600',
  icon: 'size-11 text-xl flex items-center justify-center',
}

export function Button({
  variant = 'primary',
  active = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; active?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait ${
        active ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
      } ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-white shadow-lg ${className}`}>{children}</div>
}

export const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
