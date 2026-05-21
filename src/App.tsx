import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { AuthProvider, useAuth } from '@/hooks/use-auth-context'
import { ThemeProvider } from '@/hooks/use-theme'
import { Login } from '@/app/login/page'
import { AppShell } from '@/components/layout/app-shell'
import { OrderList } from '@/components/orders/order-list'
import { OrderForm } from '@/components/orders/order-form'
import { OrderDetail } from '@/components/orders/order-detail'
import { TemplateList } from '@/components/templates/template-list'
import { HistoryList } from '@/components/history/history-list'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrderList />} />
        <Route path="new-order" element={<OrderForm />} />
        <Route path="order/:id" element={<OrderDetail />} />
        <Route path="order/:id/edit" element={<OrderForm />} />
        <Route path="templates" element={<TemplateList />} />
        <Route path="history" element={<HistoryList />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
