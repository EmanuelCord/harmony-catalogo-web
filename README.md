# HARMONY Fitness Catalog

Sitio catálogo y cotización de maquinaria premium para gimnasios HARMONY.

## Estructura

```text
.
├── index.html
├── pages/
│   └── optimizador-imagenes.html
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
│       ├── optimized/
│       └── products/  (originales locales, excluidos de Git)
├── DEVELOPMENT.md
└── README.md
```

## Uso

Abre `index.html` en un navegador o publica el repositorio con GitHub Pages. Tailwind CSS, Google Fonts, Font Awesome y JSZip se cargan desde CDN, por lo que se necesita conexión a internet.

Para optimizar fotos, abre `pages/optimizador-imagenes.html`, asigna las imágenes a las máquinas y descarga el ZIP. Extrae su carpeta `assets` en la raíz del proyecto.
