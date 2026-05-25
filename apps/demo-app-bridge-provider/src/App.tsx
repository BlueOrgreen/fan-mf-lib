import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import './styles/globals.css'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <div className={cn('tw-min-h-screen tw-p-8', theme === 'dark' && 'tw-dark')}>
      <div className="tw-max-w-4xl tw-mx-auto tw-space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Bridge Provider App</CardTitle>
            <CardDescription>
              Remote Components Provider with shadcn/ui + Tailwind CSS
            </CardDescription>
          </CardHeader>
          <CardContent className="tw-space-y-4">
            <div className="tw-flex tw-items-center tw-gap-4">
              <Label>Theme:</Label>
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
            </div>
            <div className="tw-space-y-2">
              <Label htmlFor="demo-input">Demo Input</Label>
              <Input id="demo-input" placeholder="Type something..." />
            </div>
          </CardContent>
          <CardFooter>
            <p className="tw-text-sm tw-text-muted-foreground">
              Running on port 3101
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default App