

## Problema

Cuando el gestor copia el link de cliente desde el panel admin, el código usa `window.location.origin` para construir la URL. Si el gestor está trabajando desde el entorno de preview (`id-preview--...lovable.app`), el link generado apunta al preview, que requiere cuenta de Lovable para acceder.

## Solución

Forzar que el link copiado siempre use el dominio publicado (`trioteca-offer-clarity.lovable.app`) independientemente de desde dónde esté trabajando el gestor.

## Cambios

### 1. Crear constante de dominio público

Añadir una constante centralizada con la URL pública del proyecto.

### 2. Actualizar `Operations.tsx` (línea 87)

Cambiar:
```ts
`${window.location.origin}/c/${op.share_token}`
```
Por:
```ts
`${PUBLIC_BASE_URL}/c/${op.share_token}`
```

### 3. Actualizar `OperationEditor.tsx` (línea 233)

Mismo cambio: reemplazar `window.location.origin` por la constante pública.

---

Ambos archivos son del panel de gestores (admin), no se toca la vista cliente ni el backend. El cambio es mínimo y resuelve el problema de raíz.

