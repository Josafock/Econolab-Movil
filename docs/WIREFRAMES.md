# Interfaz móvil de Econolab · HU-02

Este documento corresponde a T-02.01 (wireframes), T-02.02 (componentes), T-02.03 (pantalla principal) y T-02.04 (navegación). Los diagramas describen la distribución; los nombres, estudios y datos que aparecen en la aplicación se obtienen del backend existente.

Trazabilidad en el repositorio: [HU-02 #2](https://github.com/Josafock/Econolab-Movil/issues/2), [TH2-01 #15](https://github.com/Josafock/Econolab-Movil/issues/15), [TH2-02 #16](https://github.com/Josafock/Econolab-Movil/issues/16), [TH2-03 #17](https://github.com/Josafock/Econolab-Movil/issues/17) y [TH2-04 #18](https://github.com/Josafock/Econolab-Movil/issues/18). Se conservan los nombres oficiales de las Issues y sus asignaciones existentes.

## Identidad y reglas de diseño

- Se reutiliza el logotipo de `frontend/public/econolab-logo.png` como `assets/econolab-logo.png`.
- Rojo principal `#dc2626`, fondo `#f9fafb`, tarjetas blancas, texto `#111827`, texto secundario `#4b5563`. Son colores de la identidad existente en `frontend/src/app/globals.css`.
- Contenido de una columna, con ancho máximo de 720 puntos en tabletas y web. Los márgenes son de 20 puntos en teléfono y 32 en pantallas amplias.
- Campos y botones con altura mínima de 52 puntos. Las etiquetas permanecen visibles al escribir. El texto admite el tamaño de fuente del sistema y salto de línea.
- La jerarquía usa título, descripción breve, contenido y acción principal. Los mensajes de error incluyen texto; el color nunca es la única señal.
- El encabezado de la navegación muestra el título y la acción de regreso. `Screen` respeta los bordes laterales e inferior sin duplicar el área superior que ya proporciona `Stack`.
- El formulario permite desplazarse con el teclado abierto. Las listas usan `Screen scroll={false}` y su propia lista virtualizada para evitar anidar desplazamientos.

## Acceso

```text
┌───────────────────────────────────┐
│ Encabezado: Iniciar sesión         │
├───────────────────────────────────┤
│ [Logotipo] ECONOLAB                │
│            Laboratorio clínico    │
│                                   │
│ Bienvenido                        │
│ Accede con tu cuenta de Econolab.  │
│ ┌───────────────────────────────┐ │
│ │ Correo electrónico            │ │
│ │ [                            ]│ │
│ │ Contraseña                    │ │
│ │ [••••••••                    ]│ │
│ │ Mensaje si un campo es inválido│ │
│ │ [       Iniciar sesión       ]│ │
│ └───────────────────────────────┘ │
│ [Mensaje y reintento si hay error]│
└───────────────────────────────────┘
```

El botón indica la carga y evita envíos repetidos. El contrato de login existente utiliza correo y contraseña; no se añade un segundo factor inexistente. La contraseña no se conserva después de iniciar sesión ni se incluye en registros.

## Inicio / dashboard

```text
┌───────────────────────────────────┐
│ Encabezado: Econolab               │
├───────────────────────────────────┤
│ [Logotipo] ECONOLAB                │
│ Hola, [nombre de la sesión]        │
│ [Rol del usuario]                 │
│                                   │
│ ┌───────────────────────────────┐ │
│ │ Estudios                      │ │
│ │ Consulta el catálogo.         │ │
│ │ [        Ver estudios        ]│ │
│ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │
│ │ Mi perfil                     │ │
│ │ Consulta tus datos de cuenta. │ │
│ │ [         Ver perfil         ]│ │
│ └───────────────────────────────┘ │
│ [          Cerrar sesión         ]│
└───────────────────────────────────┘
```

El inicio funciona como menú de los módulos implementados. No se agregan estadísticas sin una fuente real ni accesos que conduzcan a pantallas vacías. Los permisos se resuelven con la sesión y el contrato del backend.

## Consulta de estudios

```text
┌───────────────────────────────────┐
│ ‹ Inicio              Estudios    │
├───────────────────────────────────┤
│ Catálogo de estudios              │
│ Buscar                            │
│ [Nombre o término de búsqueda   ] │
│                                   │
│ ┌───────────────────────────────┐ │
│ │ [Nombre real del estudio]     │ │
│ │ [Información disponible]      │ │
│ │ [         Ver detalle        ]│ │
│ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │
│ │ [Siguiente estudio]           │ │
│ │ [         Ver detalle        ]│ │
│ └───────────────────────────────┘ │
│          Desliza para actualizar  │
└───────────────────────────────────┘
```

La lista debe permitir desplazamiento, búsqueda y actualización. Solo se agregan filtros y paginación que admita el contrato existente. Al volver del detalle se mantiene una navegación coherente hacia el listado.

## Detalle de estudio

```text
┌───────────────────────────────────┐
│ ‹ Estudios               Detalle  │
├───────────────────────────────────┤
│ [Nombre real del estudio]         │
│ ┌───────────────────────────────┐ │
│ │ [Campo del contrato]          │ │
│ │ [Valor recibido]              │ │
│ │                               │ │
│ │ [Otro campo disponible]       │ │
│ │ [Valor recibido]              │ │
│ └───────────────────────────────┘ │
│ [Información adicional disponible]│
└───────────────────────────────────┘
```

Los textos largos se ajustan y la pantalla se desplaza. Los campos ausentes se omiten o se identifican como no disponibles sin inventar datos clínicos. Un estudio eliminado o inaccesible muestra una explicación y permite regresar.

## Mi perfil

```text
┌───────────────────────────────────┐
│ ‹ Inicio               Mi perfil  │
├───────────────────────────────────┤
│ Mi cuenta                         │
│ ┌───────────────────────────────┐ │
│ │ [Nombre de la cuenta]         │ │
│ │ [Correo de la cuenta]         │ │
│ │ [Rol; solo lectura]           │ │
│ └───────────────────────────────┘ │
│ [Edición de campos autorizados]   │
│ [       Guardar cambios          ]│
│ [Confirmación o mensaje de error] │
└───────────────────────────────────┘
```

La edición depende de las operaciones y permisos reales. Si el backend no admite que el usuario modifique su propio perfil, la pantalla queda en consulta y explica la limitación; no se muestra una acción de guardar ficticia ni se habilitan operaciones administrativas como sustituto.

## Estados y accesibilidad

| Situación | Presentación | Acción disponible |
| --- | --- | --- |
| Primera carga | Indicador con texto «Cargando…» | Esperar el resultado |
| Formulario en envío | Botón con indicador, estado ocupado y bloqueo de nuevos envíos | Esperar o conservar la navegación admitida |
| Catálogo vacío o búsqueda sin coincidencias | «No encontramos estudios», con la búsqueda y filtros actuales visibles | Actualizar, cambiar la búsqueda o limpiar los filtros |
| Error de red o timeout | Mensaje comprensible sin detalles internos | Volver a intentar |
| Credenciales inválidas | Mensaje junto al formulario; no se revela si una cuenta existe | Corregir los datos |
| Validación | Etiqueta y explicación junto al campo | Corregir el campo |
| Sesión expirada | Regreso al acceso y explicación del motivo | Iniciar sesión de nuevo |
| Sin permiso | Mensaje de acceso no autorizado, sin mostrar datos protegidos | Volver a una pantalla permitida |
| Operación correcta | Confirmación textual «Listo» y datos actualizados | Continuar |

Los títulos anuncian su papel de encabezado. Botones y campos tienen etiquetas accesibles; los botones publican sus estados deshabilitado y ocupado. Los errores y cambios de carga se anuncian a tecnologías de asistencia. El foco de teclado se distingue visualmente en botones y campos. Deben verificarse en dispositivo el lector de pantalla, tamaño de fuente grande, orientación horizontal, teclado abierto y botón físico de regreso.

## Componentes compartidos

`src/ui/index.tsx` exporta `Screen`, `Brand`, `Heading`, `Button`, `Field`, `Card`, `Feedback` y `Loading`. `src/ui/theme.ts` concentra colores y medidas. Estos componentes no contienen llamadas a la API, reglas de autorización ni datos simulados.

## Referencias técnicas consultadas

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/): versiones compatibles y paquetes nativos.
- [Safe area en Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/): aplicación de bordes seguros y proveedor de contexto.
