## Plan: dashboard de admin con métricas del equipo

### Decisión de alcance (importante)

La tabla `operations` tiene RLS estricto: cada usuario sólo ve sus propias comparativas. Por tanto, una consulta directa desde el front como admin **no devolvería las comparativas de los demás gestores**, sólo las suyas.

Como un admin normalmente **no crea comparativas él mismo** (eso lo hacen los gestores), el dashboard sólo tiene sentido si muestra datos **de todo el equipo**. Para eso se usa una **edge function con service role** (mismo patrón que `list-gestors` / `manage-gestor`).

### Lo que pediste + propuesta de mejora

Pediste dos métricas:
1. Fecha y hora de creación de la última comparativa.
2. Número de comparativas hechas en el mes actual.

**Propuesta**: con muy poco coste extra añadir un par de métricas que dan contexto real al admin para supervisar al equipo. Si prefieres dejarlo en lo mínimo dímelo y quito las extras.

KPIs propuestos (todos en una franja de 4 cards arriba):

```text
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Última creada    │ Este mes         │ Mes anterior     │ Publicadas       │
│ hace 2 h         │ 23               │ 18  (+27% vs.)   │ 14 / 23 (61%)    │
│ 24/04/26 14:32   │ comparativas     │                  │ ratio publicación│
│ por María G.     │                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

Y debajo, una tabla compacta **"Actividad por gestor (mes en curso)"** con: gestor, comparativas creadas, publicadas, último alta. Es 100% gratis ya que el endpoint ya trae todo agregado.

### Implementación

**1. Nueva edge function `admin-stats`** (`verify_jwt = true`, default)
- Verifica el JWT del usuario.
- Comprueba con la `service_role` que el caller tiene rol `admin` en `user_roles`. Si no, 403.
- Consulta con service role:
  - última fila de `operations` (`order by created_at desc limit 1`) + email del `created_by` desde `auth.users`.
  - count de `operations` del mes en curso (UTC, `created_at >= date_trunc('month', now())`).
  - count del mes anterior para comparar.
  - count total + count publicadas del mes en curso.
  - agregado por gestor del mes en curso (created/published/last).
- Devuelve un único JSON con todo ya formateado.

**2. Nueva ruta `/admin/stats`** → `src/pages/admin/AdminDashboard.tsx`
- Llama a la edge function con el access token (mismo patrón que `UserManagement`).
- Bloquea con redirect si `!isAdmin` (igual que `UserManagement`).
- 4 KPI cards arriba + tabla por gestor debajo. Todo en español, formato de fecha `es-ES`, hora `HH:mm`.
- Botón "Actualizar" para re-fetch manual.

**3. Acceso desde el header de `Operations.tsx`**
- Añadir botón "Panel admin" (icono `LayoutDashboard`) sólo visible si `isAdmin`, junto a los botones de Checklists/Usuarios que ya existen.

**4. Registrar la ruta en `src/App.tsx`**
- `<Route path="/admin/stats" element={<AdminDashboard />} />`.

### Lo que NO toco
- Esquema de BD: no hace falta crear tablas, se calcula todo en la edge function.
- RLS existente: se respeta porque el front nunca lee `operations` de otros gestores; siempre va por la function.
- Lógica de cálculo de hipotecas, comparativas, etc.

### Resultado
- Sólo los admin ven el botón "Panel admin" en el header → `/admin/stats`.
- En un vistazo: cuándo se creó la última comparativa (y por quién), volumen del mes, comparación con el mes anterior, ratio de publicación, y desglose por gestor del equipo.
