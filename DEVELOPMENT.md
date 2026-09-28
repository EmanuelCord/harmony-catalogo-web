# HARMONY Fitness Catalog

Sitio web de catálogo y cotización para maquinaria de gimnasio HARMONY.

## Ejecutar

Abre `index.html` en un navegador. La página usa Tailwind CSS, Google Fonts y Font Awesome desde CDN, por lo que necesita conexión a internet.

## Imágenes

El catálogo carga versiones JPEG optimizadas para los 26 productos desde `assets/images/catalog/`. Los archivos originales de alta resolución se mantienen en `assets/images/products/` y no se incluyen en Git.

Para preparar las imágenes optimizadas de todo el catálogo, ejecuta `./scripts/build-product-catalog.ps1` en PowerShell. La página `pages/optimizador-imagenes.html` permanece disponible para optimizar un lote manual de imágenes.

## Catálogo completo

Cada subcarpeta de `assets/images/products/` representa un producto. Para regenerar sus carruseles y la base de datos estática, ejecuta en PowerShell `./scripts/build-product-catalog.ps1`. El script crea JPEGs web en `assets/images/catalog/` y actualiza `assets/js/products-data.js`; mantiene intactas las imágenes fuente.