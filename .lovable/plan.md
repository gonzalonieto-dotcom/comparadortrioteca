

## Agregar bancos y mostrar logos en lugar de nombres

### Bancos a agregar

Abanca, Santander, UCI, Unicaja, Global Caja, Sabadell, Laboral Kutxa, Caixa Popular, MyInvestor.

Nota: Santander, Sabadell y Unicaja ya tienen logo en `BANK_LOGOS` pero no están en `BANK_PRESETS` (el desplegable del gestor). Se agregarán al desplegable.

### Logos

Usaré URLs directas de los logos oficiales de cada banco (favicon o logo público). Para los que ya existen en `BANK_LOGOS` se mantienen. Para los nuevos:

| Banco | URL logo |
|---|---|
| Abanca | `https://www.abanca.com/favicon.ico` |
| UCI | `https://www.uci.com/favicon.ico` |
| Global Caja | `https://www.globalcaja.es/favicon.ico` |
| Laboral Kutxa | `https://www.laboralkutxa.com/favicon.ico` |
| Caixa Popular | `https://www.caixapopular.es/favicon.ico` |
| MyInvestor | `https://myinvestor.es/favicon.ico` |

### Cambios

#### 1. `src/lib/bankLogos.tsx` — Agregar logos de los nuevos bancos

Añadir Abanca, UCI, Global Caja, Laboral Kutxa, Caixa Popular, MyInvestor al mapa `BANK_LOGOS`.

#### 2. `src/components/admin/OfferEditor.tsx` — Ampliar `BANK_PRESETS` + usar `BankLogo` en el selector

- Agregar los 9 bancos nuevos a `BANK_PRESETS` con sus colores corporativos
- Reemplazar el dot de color + texto en el `<SelectItem>` por el componente `<BankLogo>` para que se vea el logo real
- Hacer lo mismo en el header de la tarjeta colapsada (línea 156): mostrar `<BankLogo>` en lugar de texto plano

#### 3. Componentes cliente (ya resuelto)

`OfferTable.tsx`, `EnhancedRecommendedCard.tsx` y `DecisionSummary.tsx` ya usan `<BankLogo>` que muestra logo + nombre. Con agregar los logos al mapa, automáticamente se mostrarán en la comparativa del cliente.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/bankLogos.tsx` | Agregar 6 nuevos logos al mapa |
| `src/components/admin/OfferEditor.tsx` | Agregar 9 bancos a `BANK_PRESETS`, usar `BankLogo` en selector y header |

