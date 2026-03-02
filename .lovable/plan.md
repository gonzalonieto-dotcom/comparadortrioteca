

# Plan: Backend y Panel de Gestión para Trioteca

## Resumen

Crear la base de datos y un panel de administración (data entry) para que los gestores de Trioteca puedan cargar operaciones hipotecarias y ofertas de bancos. El comparador actual del usuario final seguirá funcionando igual, pero alimentándose de datos reales en lugar de datos hardcodeados.

## Arquitectura

```text
┌─────────────────────┐     ┌──────────────────┐
│  Panel Gestor       │     │  Vista Usuario    │
│  /admin/*           │────>│  / (actual)       │
│  (CRUD operaciones  │     │  Lee datos de DB  │
│   y ofertas)        │     │  según operation  │
└─────────────────────┘     └──────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │  Lovable    │
              │  Cloud DB   │
              └─────────────┘
```

## 1. Base de datos (4 tablas)

### Tabla `operations` - Los datos de la operación hipotecaria
| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| purchase_price | numeric | Precio vivienda |
| appraisal_value | numeric | Valor tasación |
| loan_amount | numeric | Importe préstamo |
| term_years | integer | Plazo en años |
| home_insurance_annual | numeric | Seguro hogar anual default |
| life_insurance_annual | numeric | Seguro vida anual default |
| appraisal_cost | numeric | Coste tasación |
| created_by | uuid FK auth.users | Gestor que la creó |
| share_token | text UNIQUE | Token para compartir con usuario final |
| created_at | timestamptz | |

### Tabla `offers` - Las ofertas de cada banco
| Columna | Tipo |
|---|---|
| id | uuid PK |
| operation_id | uuid FK operations |
| bank_name | text |
| logo_color | text |
| type | text (Fijo/Mixto/Variable) |
| base_tin | numeric |
| amortization_fee_pct | numeric |
| upfront_costs | numeric |
| monthly_account_cost | numeric |
| euribor_rate | numeric (nullable) |
| advantages | text[] |
| considerations | text[] |
| sort_order | integer |

### Tabla `offer_linkages` - Bonificaciones/vinculaciones de cada oferta
| Columna | Tipo |
|---|---|
| id | uuid PK |
| offer_id | uuid FK offers |
| label | text |
| is_active_default | boolean |
| discount_weight_pct | numeric |
| annual_cost | numeric |

### Tabla `offer_mixed_periods` - Periodos mixtos (solo para hipotecas mixtas)
| Columna | Tipo |
|---|---|
| id | uuid PK |
| offer_id | uuid FK offers |
| from_year | integer |
| to_year | integer |
| fixed_tin | numeric (nullable) |
| spread_over_euribor | numeric (nullable) |

### Seguridad (RLS)
- Gestores autenticados: CRUD completo en sus operaciones y datos relacionados
- Usuarios anónimos: lectura via `share_token` (sin autenticación)

## 2. Autenticación para gestores

- Página `/login` con email + contraseña
- Sin auto-confirm (verificación por email)
- Solo gestores necesitan cuenta; el usuario final accede via link con token

## 3. Panel de administración `/admin`

### 3a. Lista de operaciones (`/admin/operations`)
- Tabla con todas las operaciones del gestor
- Botón "Nueva operación"
- Cada fila: ver, editar, copiar link de compartir

### 3b. Formulario de operación (`/admin/operations/:id`)
- Campos de la operación (precio, importe, plazo, etc.)
- Sección de ofertas con posibilidad de añadir/editar/eliminar
- Cada oferta: datos del banco, vinculaciones, periodos mixtos, ventajas y consideraciones
- Botón "Generar link para cliente"

## 4. Vista usuario final modificada

- Ruta `/op/:token` carga datos de la BD usando el `share_token`
- La ruta `/` seguirá mostrando datos demo (los hardcodeados actuales)
- Misma experiencia visual actual, solo cambia la fuente de datos

## Detalle técnico de implementación

### Migración SQL
- Crear las 4 tablas con RLS habilitado
- Policies: gestores autenticados leen/escriben sus datos; lectura pública via share_token
- Función `generate_share_token()` para crear tokens únicos

### Ficheros nuevos
- `src/pages/Login.tsx` - Login de gestores
- `src/pages/admin/Operations.tsx` - Lista de operaciones
- `src/pages/admin/OperationEditor.tsx` - Editor de operación + ofertas
- `src/components/admin/OfferEditor.tsx` - Formulario de una oferta
- `src/components/admin/LinkageEditor.tsx` - Editor de vinculaciones
- `src/components/admin/MixedPeriodEditor.tsx` - Editor de periodos mixtos
- `src/hooks/useOperation.ts` - Hook para CRUD de operaciones
- `src/pages/SharedOperation.tsx` - Vista usuario con datos de DB

### Ficheros modificados
- `src/App.tsx` - Añadir rutas `/login`, `/admin/*`, `/op/:token`
- `src/data/mortgageData.ts` - Añadir funciones para mapear datos de DB a tipos existentes

### Rutas protegidas
- `/admin/*` requiere autenticación
- `/op/:token` es público (acceso via token)
- `/login` redirige a `/admin` si ya autenticado

