# Plan: App Instalable desde Trioteca

## Objetivo
Permitir que usuarios instalen la app directamente desde `comparador.trioteca.ai` mediante "Añadir a pantalla de inicio" en móviles y "Instalar" en desktops. Sin Google Play ni App Store.

## Enfoque
Web App Manifest básico (sin service worker) para evitar problemas de caché en el preview de Lovable y mantener la app siempre actualizada.

## Pasos

### 1. Manifest JSON
Crear `public/manifest.json` con:
- `name`: "Trioteca Comparador"
- `short_name`: "Trioteca"
- `start_url`: "/"
- `display`: "standalone"
- `theme_color` y `background_color`: alineados con la paleta actual de la app
- `icons`: referencias a iconos en múltiples tamaños (192x192, 512x512)

### 2. Meta tags móviles
Actualizar `index.html` para incluir:
- `<link rel="manifest" href="/manifest.json">`
- `theme-color` meta tag
- `apple-mobile-web-app-capable` y `apple-mobile-web-app-status-bar-style` para iOS
- Ajustar el `<title>` y descripción si es necesario

### 3. Iconos de app
Generar iconos en tamaños 192x192 y 512x512 con la marca Trioteca (o generar uno profesional con el nombre de la app). Guardar en `public/`.

### 4. Verificación
Publicar la app y verificar que Chrome/Safari ofrezcan la opción de instalar.

## Notas técnicas
- No se agrega `vite-plugin-pwa` ni service worker para evitar conflictos con el preview iframe de Lovable.
- Sin service worker, no hay funcionalidad offline: la app requiere internet (lo cual es correcto ya que consume datos del backend).
- Los cambios en el frontend se reflejan inmediatamente tras publicar, sin necesidad de "actualizar" la app instalada.
