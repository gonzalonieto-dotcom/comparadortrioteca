

## Fix: ChecklistManager redirige antes de cargar el rol + logos en el front

### Bug identificado

En `ChecklistManager.tsx` línea 41-43:
```ts
useEffect(() => {
  if (!authLoading && (!user || !isAdmin)) navigate("/admin/dashboard");
}, [user, authLoading, isAdmin, navigate]);
```

El `useRole` hook tiene su propio `loading` state. Cuando `authLoading` termina pero el rol todavía se está cargando, `isAdmin` es `false` (valor inicial), y el efecto redirige inmediatamente al dashboard. Por eso nunca se ve la página de checklists.

### Solución

1. **`src/pages/admin/ChecklistManager.tsx`**: Usar `loading` de `useRole()` en la condición del `useEffect`, esperando a que termine de cargar el rol antes de decidir si redirigir:

```ts
const { isAdmin, loading: roleLoading } = useRole();

useEffect(() => {
  if (!authLoading && !roleLoading && (!user || !isAdmin)) 
    navigate("/admin/dashboard");
}, [user, authLoading, roleLoading, isAdmin, navigate]);

if (authLoading || roleLoading) return <div>...</div>;
```

2. **`src/components/OfferTable.tsx`**: Verificar y corregir que los logos se muestren en la comparativa del cliente (reemplazar nombre por logo).

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/admin/ChecklistManager.tsx` | Agregar `roleLoading` a la condición de redirect |
| `src/components/OfferTable.tsx` | Verificar logos en vista cliente |

