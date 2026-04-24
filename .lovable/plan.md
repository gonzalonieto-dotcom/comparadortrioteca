

## Plan: evitar que se borren los datos del editor al cambiar de pestaña

### Diagnóstico

Cuando el gestor cambia de pestaña del navegador (o al móvil/otra app) y vuelve, el formulario de la comparativa se **resetea a los últimos datos guardados en BD** y pierde todo lo no guardado.

**Causa raíz**: el hook `useAuth` se suscribe a `supabase.auth.onAuthStateChange`. Supabase dispara eventos como `TOKEN_REFRESHED` y `SIGNED_IN` periódicamente (cada vez que se refresca el token, lo cual se acelera al volver a una pestaña suspendida). Cada evento ejecuta `setUser(session?.user ?? null)`, lo que crea un **nuevo objeto User** (referencia distinta aunque sea el mismo usuario).

En `src/pages/admin/OperationEditor.tsx`:

```ts
useEffect(() => {
  if (user && id) loadData();   // ← sobrescribe el estado del formulario
}, [user, id]);                  // ← se re-dispara con cada token refresh
```

Resultado: `loadData()` recarga `op` y `offers` desde la BD, machacando lo que el gestor estaba escribiendo. Además `expandedIndex` se mantiene pero la oferta que estaba abierta vuelve a sus valores guardados.

### Solución

#### 1. Estabilizar `useAuth` por id de usuario (raíz del problema)

`src/hooks/useAuth.ts`: solo actualizar el estado `user` cuando el **id** cambia realmente, no en cada refresh de token. Mantener `session` actualizada (necesaria para llamadas autenticadas) pero `user` referencialmente estable mientras sea el mismo usuario.

```ts
supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);
  setUser(prev => {
    const next = session?.user ?? null;
    if (prev?.id === next?.id) return prev;   // misma identidad → no re-render
    return next;
  });
  setLoading(false);
});
```

Beneficio colateral: arregla el mismo síntoma en `useRole`, `Operations.tsx`, `ChecklistManager.tsx`, `UserManagement.tsx` (todos dependen de `[user, ...]` en useEffect).

#### 2. Defensa extra en `OperationEditor.tsx`: cargar solo una vez

Cambiar la dependencia para depender únicamente de `id` y un flag, en vez del objeto `user`:

```ts
const loadedIdRef = useRef<string | null>(null);
useEffect(() => {
  if (!user || !id) return;
  if (loadedIdRef.current === id) return;   // ya cargado para este id
  loadedIdRef.current = id;
  loadData();
}, [user, id]);
```

Así, aunque algún día `user` cambiase de referencia por otra causa, el formulario nunca se sobrescribe mientras estemos en la misma operación. Se vuelve a cargar solo si el gestor navega a otra operación distinta.

#### 3. Aplicar el mismo patrón al editor de checklists (también es formulario)

`ChecklistManager.tsx` carga datos en función de `user`. Aplicar el mismo `loadedRef` para no recargar al volver de pestaña.

### Archivos a tocar

- `src/hooks/useAuth.ts` — comparar por `user.id` antes de `setUser`.
- `src/pages/admin/OperationEditor.tsx` — añadir `loadedIdRef` para no re-llamar `loadData`.
- `src/pages/admin/ChecklistManager.tsx` — mismo patrón defensivo.

### Resultado

- El gestor puede cambiar de pestaña, contestar un mensaje, volver una hora después, y todo lo que escribió sigue ahí.
- El botón "Guardar" sigue siendo la única vía para persistir; nada se pierde de forma silenciosa.
- Sin cambios en BD ni en la lógica de cálculo.

