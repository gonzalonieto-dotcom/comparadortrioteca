

## Documentación API — Importación de Operaciones

No se requieren cambios de código. A continuación la documentación completa de la API ya implementada.

---

### Endpoint

```
POST https://cnlpnazvbyjnaecpsbsq.supabase.co/functions/v1/import-operation
```

### Headers requeridos

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |
| `x-api-key` | Tu clave secreta (la que configuraste como `IMPORT_API_KEY`) |

### Payload (JSON Body)

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
        {
          "label": "Nómina",
          "is_active_default": true,
          "discount_weight_pct": 0.2,
          "annual_cost": 0
        },
        {
          "label": "Seguro hogar",
          "is_active_default": true,
          "discount_weight_pct": 0.1,
          "annual_cost": 220
        }
      ],
      "mixed_periods": []
    }
  ]
}
```

### Campos del payload

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `gestor_email` | string | **Sí** | Email del gestor registrado en la plataforma. La operación se asigna a este usuario. |
| `client_name` | string | No | Nombre del cliente |
| `purchase_price` | number | No | Precio de compra de la vivienda |
| `loan_amount` | number | No | Importe del préstamo |
| `term_years` | number | No | Plazo en años (default: 30) |
| `appraisal_value` | number | No | Valor de tasación |
| `home_insurance_annual` | number | No | Coste anual seguro hogar |
| `life_insurance_annual` | number | No | Coste anual seguro vida |
| `appraisal_cost` | number | No | Coste de tasación |
| `is_published` | boolean | No | Si la comparativa es visible para el cliente (default: false) |
| `offers` | array | No | Array de ofertas bancarias (ver detalle abajo) |

**Cada oferta:**

| Campo | Tipo | Descripción |
|---|---|---|
| `bank_name` | string | Nombre del banco |
| `type` | string | "Fijo", "Variable" o "Mixto" |
| `base_tin` | number | TIN base (ej: 2.85) |
| `amortization_fee_pct` | number | Comisión amortización anticipada (%) |
| `upfront_costs` | number | Costes iniciales |
| `monthly_account_cost` | number | Coste mensual de cuenta |
| `euribor_rate` | number/null | Euríbor (para variables/mixtos) |
| `term_years` | number/null | Plazo específico de la oferta (null = usa el de la operación) |
| `advantages` | string[] | Ventajas de la oferta |
| `considerations` | string[] | Consideraciones |
| `linkages` | array | Vinculaciones (nómina, seguros, etc.) |
| `mixed_periods` | array | Tramos para hipotecas mixtas |

**Cada linkage:**

| Campo | Tipo | Descripción |
|---|---|---|
| `label` | string | Nombre (ej: "Nómina") |
| `is_active_default` | boolean | Activa por defecto |
| `discount_weight_pct` | number | Peso de bonificación (ej: 0.2 = 0.2%) |
| `annual_cost` | number | Coste anual para el cliente |

**Cada mixed_period:**

| Campo | Tipo | Descripción |
|---|---|---|
| `from_year` | number | Año inicio del tramo |
| `to_year` | number | Año fin del tramo |
| `fixed_tin` | number/null | TIN fijo del tramo |
| `spread_over_euribor` | number/null | Diferencial sobre euríbor |

### Respuesta exitosa (200)

```json
{
  "success": true,
  "operation_id": "uuid-de-la-operacion",
  "share_token": "abc123hex",
  "share_url": "https://comparadortrioteca.lovable.app/c/abc123hex",
  "offers_created": 1
}
```

- `share_url` es el link público que se puede enviar al cliente directamente.

### Errores

| Código | Causa |
|---|---|
| 401 | API key inválida o ausente |
| 400 | Falta `gestor_email` |
| 404 | Gestor no encontrado con ese email |
| 500 | Error interno (detalle en `error`) |

### Ejemplo cURL

```bash
curl -X POST \
  https://cnlpnazvbyjnaecpsbsq.supabase.co/functions/v1/import-operation \
  -H "Content-Type: application/json" \
  -H "x-api-key: TU_API_KEY_AQUI" \
  -d '{
    "gestor_email": "gestor@trioteca.com",
    "client_name": "María López",
    "purchase_price": 300000,
    "loan_amount": 240000,
    "term_years": 25,
    "appraisal_value": 310000,
    "is_published": false,
    "offers": [
      {
        "bank_name": "Sabadell",
        "type": "Fijo",
        "base_tin": 2.65,
        "linkages": [
          { "label": "Nómina", "is_active_default": true, "discount_weight_pct": 0.15, "annual_cost": 0 }
        ],
        "mixed_periods": []
      }
    ]
  }'
```

### Flujo recomendado desde el CRM

1. El CRM envía el POST con los datos de la operación y ofertas
2. La API devuelve el `share_url`
3. El CRM guarda el `operation_id` y `share_url` en su registro
4. El gestor puede editar la operación desde el back del comparador
5. Cuando publica (`is_published: true` o lo hace manualmente), el cliente puede ver la comparativa en el `share_url`

### Notas

- La cuota mensual (`monthly_payment`) y TAE estimada se calculan automáticamente en el servidor
- El gestor debe estar previamente dado de alta en la plataforma con el email indicado
- Si se envía `is_published: false`, el gestor deberá publicar manualmente para que el cliente vea la comparativa

