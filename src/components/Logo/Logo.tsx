import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    <span className={clsx('flex items-center gap-2', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        width={24}
        height={24}
        loading={loading}
        fetchPriority={priority}
        decoding="async"
        className="h-6 w-6 rounded-md"
        src="/brand/karacter-monogram.svg"
      />
      <span className="font-display text-lg font-bold tracking-wide">KARACTER</span>
    </span>
  )
}
