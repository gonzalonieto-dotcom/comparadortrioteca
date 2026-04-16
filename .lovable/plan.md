

## Plan: Usar Euribor media mensual y mantener datos actualizados

### Situacion actual

- **Euribor**: La edge function `fetch-euribor` scrappea datosmacro pero la regex captura `2,245` (valor de enero mencionado en el texto) en vez del Euribor media mensual oficial (`2,565%` de marzo 2026). El valor diario actual es ~2,756%.
- **Inflacion**: La edge function `fetch-inflation` ya funciona correctamente (devuelve 2.6%).
- Ambas funciones se llaman cada vez que se abre una operación. No hay caché ni actualización periódica.

### Cambios

**1. Corregir `fetch-euribor` para extraer la media mensual oficial**

Reescribir las regex para priorizar la tabla "Último" que contiene la media mensual cerrada. En el HTML, esta tabla tiene el valor en la primera fila: `2,565`. Nuevo enfoque:
- Buscar el patrón de la tabla resumen: `Último.*?(\d+[.,]\d{2,3})` 
- Fallback: buscar en la tabla "Euribor Mensual" la primera fila de datos
- Devolver también la fecha del mes al que corresponde

**2. Cachear Euribor e inflación en la base de datos**

Crear una tabla `cached_rates` para evitar scrapping en cada request:
```sql
CREATE TABLE public.cached_rates (
  key text PRIMARY KEY,
  value numeric NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cached_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read" ON public.cached_rates FOR SELECT TO anon, authenticated USING (true);
```

**3. Actualizar las edge functions para usar caché**

Ambas funciones (`fetch-euribor` y `fetch-inflation`):
- Primero leer de `cached_rates` 
- Si el valor tiene menos de 24 horas, devolver el cache
- Si no, scrappear, actualizar la tabla y devolver el valor nuevo
- Esto mantiene los datos actualizados con cada uso, sin necesidad de cron jobs

**4. Sin cambios en frontend**

Las llamadas a las edge functions siguen igual. Solo cambia la lógica interna de las funciones.

### Resultado

- Euribor: media mensual oficial (actualmente 2,565% de marzo 2026)
- Inflación: IPC interanual español (actualmente 2,6%)
- Cache de 24h para evitar scrapping excesivo
- Datos siempre frescos sin intervención manual

