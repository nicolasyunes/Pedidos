import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ClipboardList, PlusCircle, Package, History, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { icon: ClipboardList, label: 'Pedidos', path: '/' },
  { icon: PlusCircle, label: 'Nuevo', path: '/new-order' },
  { icon: Package, label: 'Plantillas', path: '/templates' },
  { icon: History, label: 'Histórico', path: '/history' },
]

export function AppShell() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,hsl(210_80%_96%),transparent_35%)]">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Taller operativo</p>
            <h1 className="text-lg font-semibold">Pedidos 3D</h1>
          </div>

          <Button variant="ghost" size="sm" className="gap-2" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto grid h-18 max-w-xl grid-cols-4 items-center px-2 py-2">
          {navItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 rounded-xl p-2 text-[11px] transition-colors',
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
