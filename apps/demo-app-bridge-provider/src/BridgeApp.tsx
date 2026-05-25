import { useRef, useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import './styles/globals.css'

export interface DemoBridgeAppProps {
  title?: string
  userName?: string
  count?: number
  onAction?: () => void
  children?: ReactNode
  theme?: 'light' | 'dark' | string
  themeVars?: Record<string, string | undefined>
  [key: string]: unknown
}

export default function BridgeApp({
  title = 'Bridge Remote App',
  userName = 'Guest',
  count = 0,
  onAction,
  children,
  theme = 'light',
  themeVars,
}: DemoBridgeAppProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (themeVars && containerRef.current) {
      Object.entries(themeVars).forEach(([key, value]) => {
        if (value) {
          const cssKey = `--tw-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
          containerRef.current.style.setProperty(cssKey, value)
        }
      })
    }
  }, [themeVars])

  return (
    <div ref={containerRef} className={cn('tw-p-4', theme === 'dark' && 'tw-dark')}>
      <Card className="tw-w-full tw-max-w-md">
        <CardHeader>
          <h3 className="tw-text-lg tw-font-semibold">{title}</h3>
        </CardHeader>
        <CardContent className="tw-space-y-4">
          <div className="tw-space-y-2">
            <Label htmlFor="username">User Name</Label>
            <Input id="username" value={userName} readOnly />
          </div>
          <p className="tw-text-sm tw-text-muted-foreground">
            Count from host: {count}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={onAction}>Trigger host action</Button>
        </CardFooter>
        {children && <div className="tw-mt-4 tw-px-6 tw-pb-6">{children}</div>}
      </Card>
    </div>
  )
}