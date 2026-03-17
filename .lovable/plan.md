

## Ampliación del sistema de bonificaciones por banco

### Datos extraídos del PDF de Kutxabank (traducidos al español)

Del PDF se extraen estas bonificaciones de Kutxabank:

| Descripción | Bonificación (pp) |
|---|---|
| Nómina (o pensión, o desempleo, o autónomo, sueldo medio ≥ 2.000 €) | 0,50% |
| Tarjetas (consumo ≥ 1.200 €/año) | 0,10% |
| Seguro hogar | 0,10% |
| Seguro vida/amortización (mínimo = menor de 100% ptec. o 150.000 €) | 0,10% |
| Seguro protección de pagos | 0,10% |
| Seguro de auto | 0,10% |
| Seguro de salud | 0,10% |
| BKP/PP + Fondos inversión, aport. neta ≥ 1.200 € últimos 12 meses | 0,10% |
| BKP/PP + Fondos inversión, aport. neta ≥ 2.400 € últimos 12 meses (bonif. adicional) | 0,10% |
| Saldo en RRAA (F/B) ≥ 30.000 € | 0,10% |
| Saldo en RRAA (F/B) ≥ 75.000 € (bonif. adicional) | 0,10% |
| Certificación energética futura | 0,10% |
| Joven: hasta 35 años (bonificación adicional) | 0,10% |
| Bonificación máxima hasta 35 años | 1,20% |

### Problema actual

El `LinkageEditor` está hardcodeado a exactamente 3 bonificaciones preset (`PRESET_LINKAGES`). No permite agregar más bonificaciones por banco. En el front del cliente, se muestran todas las linkages que tenga la oferta, sin distinción.

### Cambios propuestos

#### 1. Backend: `LinkageEditor.tsx` — Permitir bonificaciones dinámicas

- Mantener las 3 bonificaciones base como preset (Nómina, Seguro hogar, Seguro de vida)
- Agregar un botón "Añadir bonificación" que permita crear bonificaciones adicionales con nombre libre
- Cada bonificación extra tendrá los mismos campos: label (editable), activa/inactiva, peso %, coste €/año
- Se puede eliminar bonificaciones extras (las 3 base no se pueden eliminar)

#### 2. Frontend del cliente: `OfferTable.tsx` — Solo mostrar linkages activas

- En `InlineLinkages`, filtrar `offer.linkages` para mostrar solo las que tienen `isActive === true`
- Esto ya funciona parcialmente (el switch las desactiva), pero el componente las muestra siempre. El cambio es NO renderizar las inactivas en absoluto, ya que la activación/desactivación la controla el gestor

Espera — revisando el flujo: el cliente también puede toggle-ar linkages. Entonces el comportamiento correcto sería:
- **Gestor** marca como `is_active_default` en el admin → esto define cuáles aparecen en el front del cliente
- **Cliente** puede activar/desactivar las que el gestor habilitó
- Las que el gestor dejó como `is_active_default: false` **NO aparecen** en la vista del cliente

Esto ya se maneja así en `ClientComparison.tsx` donde se mapean las linkages con `isActive: l.is_active_default`. Solo necesitamos filtrar en el render del cliente para no mostrar las que el gestor desactivó.

#### 3. Flujo de datos (sin cambios en DB)

La tabla `offer_linkages` ya soporta cualquier cantidad de linkages por oferta, con campos `label`, `is_active_default`, `discount_weight_pct`, `annual_cost`. No hace falta migración.

### Archivos a modificar

1. **`src/components/admin/LinkageEditor.tsx`**
   - Eliminar la restricción de "exactamente 3 presets"
   - Mantener las 3 base como no-eliminables
   - Agregar botón "Añadir bonificación" con campo de nombre libre
   - Agregar botón eliminar en bonificaciones extras

2. **`src/components/OfferTable.tsx`**
   - En `InlineLinkages`, filtrar linkages: solo renderizar las que tienen `isActive === true`
   - En el popover de "Detalle costes", también filtrar solo las activas

3. **`src/pages/ClientComparison.tsx`**
   - Al mapear linkages de la DB, solo incluir las que tienen `is_active_default === true` (filtrar antes de pasarlas al engine)

4. **`src/components/admin/OfferEditor.tsx`**
   - Ajustar para que al crear nueva oferta no se fuerce exactamente 3 linkages

### Resultado

- El gestor puede configurar 3+ bonificaciones por banco (ej: 14 para Kutxabank)
- Solo las marcadas como activas aparecen en la vista del cliente
- El cliente puede toggle-ar las visibles para ver el impacto en cuota/TAE
- No hay cambios en la base de datos

