# Pedidos 3D - Sistema Operativo de Taller

Sistema web operativo para gestión de pedidos de un taller de impresión 3D.

## Stack

- React + TypeScript + Vite
- TailwindCSS + shadcn/ui
- TanStack Query
- Supabase (Auth + Database + Storage + Realtime)
- React Hook Form + Zod
- React Router DOM

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Opcional: configurar Supabase

Si todavía no tenés credenciales, la app arranca en modo demo local con datos mock y persistencia en `localStorage`.

Cuando quieras conectar el backend real:

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Copiar las credenciales en `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Ejecutar el schema SQL en el SQL Editor de Supabase:
   - Archivo: `supabase/migrations/001_initial_schema.sql`

### 3. Crear usuarios

En Supabase Auth → Users, crear los 2 usuarios del equipo.

### 4. Iniciar desarrollo

```bash
npm run dev
```

## Estructura del Proyecto

```
src/
── app/                    # Páginas (login)
├── components/
│   ├── ui/                 # Componentes base
│   ├── layout/             # Shell + navegación inferior
│   ├── orders/             # Lista, alta y detalle
│   ├── templates/          # Plantillas reutilizables
│   └── history/            # Histórico por fecha
├── hooks/                  # React Query + auth
├── lib/
│   ├── supabase/           # Cliente opcional
│   ├── data-store.ts       # Repositorio local/remoto
│   ├── constants.ts        # Estados, pagos y canales
│   ├── utils.ts            # Utilidades
│   └── validations.ts      # Schemas Zod
└── types/                  # Tipos TypeScript
```

## Estados operativos

- **Pedido**
- **Imprimiendo**
- **Listo**
- **Entregado**
- **Cancelado**

`Avisado` se registra como badge, no como columna.

## Features MVP

- ✅ Login real o demo local
- ✅ Lista operativa mobile-first
- ✅ Alta y edición rápida de pedidos
- ✅ Precio, seña y saldo visibles
- ✅ Plantillas simples con campos dinámicos
- ✅ Histórico filtrable por fecha
- ✅ Preparado para conectar Supabase sin rehacer la UI

## Próximos Pasos

1. Configurar Supabase y ejecutar migración
2. Conectar auth real para las dos cuentas
3. Probar flujo completo en celular
4. Refinar realtime sobre pedidos activos
5. Agregar archivos STL/imágenes cuando realmente aporten
