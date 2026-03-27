

## API para carga automática de operaciones desde sistema externo

### Endpoint

Edge Function: `POST /functions/v1/import-operation`

### Autenticación

Header `x-api-key` con un secreto compartido (`IMPORT_API_KEY`). Se configurará como secret en el proyecto. Sin JWT, sin login.

### Payload esperado

```json
{
  "gestor_email": "gestor@ejemplo.com",
  "client_name": "Juan García",
  "purchase_price": 250000,
  "loan_amount": 200000,
  "term_years": 30,
  "appraisal_value": 260000,
  "home_insurance_annual": 220,
  "life_insurance_annual": 180,
  "appraisal_cost": 400,
  "is_published": false,
  "offers": [
    {
      "bank_name": "CaixaBank",
      "type": "Fijo",
      "base_tin": 2.85,
      "amortization_fee_pct": 0,
      "upfront_costs": 0,
      "monthly_account_cost": 0,
      "euribor_rate": null,
      "term_years": null,
      "advantages": ["Sin comisión de apertura"],
      "considerations": [],
      "linkages": [
        { "label": "Nómina", "is_active_default": true, "discount_weight_pct": 0.2, "annual_cost": 0 },
        { "label": "Seguro hogar", "is_active_default": true, "discount_weight_pct": 0.1, "annual_cost": 220 }
      ],
      "mixed_periods": []
    }
  ]
}
```

### Respuesta

```json
{
  "success": true,
  "operation_id": "uuid",
  "share_token": "abc123hex",
  "share_url": "https://trioteca-offer-clarity.lovable.app/c/abc123hex",
  "offers_created": 2
}
```

### Lógica de la Edge Function

1. Validar `x-api-key` contra el secret `IMPORT_API_KEY`
2. Buscar el `user_id` del gestor por email usando service role (`auth.admin.listUsers`)
3. Insertar en `operations` con `created_by = user_id`
4. Para cada oferta: insertar en `offers`, luego sus `offer_linkages` y `offer_mixed_periods`
5. Calcular `monthly_payment` y `estimated_tae` usando la misma lógica del editor (se duplica el cálculo en la función para no depender del front)
6. Devolver `operation_id`, `share_token` y URL

### URL de invocación

```
POST https://cnlpnazvbyjnaecpsbsq.supabase.co/functions/v1/import-operation
Headers:
  x-api-key: <tu_api_key>
  Content-Type: application/json
```

### Archivos

| Archivo | Cambio |
|---|---|
| `supabase/functions/import-operation/index.ts` | **Nuevo** — Edge Function completa |
| Secret `IMPORT_API_KEY` | Se te pedirá que definas el valor |

### Nota sobre cálculos

La función calculará `monthly_payment` y `estimated_tae` con fórmulas simplificadas (cuota francesa estándar). Si preferís que esos campos se calculen después en el editor del gestor, la función puede dejarlos en 0 y el gestor los recalcula al guardar.

