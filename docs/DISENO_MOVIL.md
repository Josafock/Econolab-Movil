# Diseño móvil y revisión visual

Actualización: 6 de octubre de 2026. HU02 #2; componentes #16, pantalla principal #17 y navegación #18. La adaptación conserva las consultas y validaciones de las HUs ya implementadas.

## Identidad de la web

`assets/econolab-brand.png` es una copia sin alteraciones de `frontend/public/econolab-brand.png`, la imagen completa usada por el login y la navegación de la web. El encabezado usa una variante compacta del mismo archivo. El login muestra el logo completo con una altura explícita para evitar que React Native Web reserve la altura original de la imagen.

Se mantienen el rojo de Econolab, las superficies blancas y los tonos slate. La pantalla inicial adapta el degradado oscuro y rojo de la web. Los iconos Lucide son componentes SVG; `react-native-svg` y `expo-linear-gradient` se instalaron con versiones compatibles con Expo SDK 57.

## Pantallas

- Login: logo original, campos con iconos, control accesible para mostrar la contraseña y botón principal.
- Inicio: saludo y rol recibidos del login, acceso al catálogo y al perfil. No incluye cifras ficticias del laboratorio.
- Estudios: búsqueda, filtros, contador real, tarjetas con estado y precio; conserva paginación, refresco y estados vacíos.
- Detalle: secciones de información y precios, parámetros y paquetes del backend.
- Perfil: nombre, correo y rol en lectura; formulario para el cambio de contraseña autorizado por el endpoint existente.
- Navegación: barra inferior con Inicio, Estudios y Perfil. El detalle conserva Estudios como sección seleccionada. Se respetan las áreas seguras y las pantallas protegidas.

## Validación

Lint y TypeScript aprobados; 88 pruebas unitarias aprobadas. Exportación Metro Android/iOS aprobada. La revisión funcional en Chromium recorrió login real, inicio, catálogo, detalle, búsqueda sin resultados, perfil, validación de contraseña, navegación inferior, logout y enlace protegido sin sesión. Se revisaron anchos de 320, 390 y 768 px sin desbordamiento horizontal. Las capturas locales están en `artifacts/`, ignorado por Git.

Las peticiones de esa revisión llegaron al Render real. Como Render rechaza localhost por CORS, la herramienta externa de QA reenviaba cada petición real sin Origin, igual que el cliente nativo. No simuló respuestas ni añadió un proxy a la aplicación. La revisión visual web no sustituye una prueba física en Expo Go.

El backend, las issues, los sprints y `main` conservan su estado. HU06 sigue teniendo la limitación documentada en `PROFILE_COMPATIBILITY.md`. El inicio por túnel y su QR permiten revisar la aplicación desde el teléfono; requieren que Metro y la computadora continúen encendidos.
