# Evidencias para la rúbrica de ECONOLAB móvil

**Entrega de octubre actualizada el 25/10:** consultar [actividades 5 y 4](../ENTREGA_OCTUBRE_2026.md) y [aportaciones comprobadas](../APORTACIONES_EQUIPO_OCTUBRE.md). `develop` ya existe desde esta fecha; la matriz integral de Debug/Release que aparece abajo corresponde a noviembre y conserva los casos todavía no ejecutados.

Revisión base: 23 de octubre de 2026. Este archivo organiza la entrega académica; el Project de GitHub sigue siendo la única planeación oficial. Los nombres E01–E15 identifican evidencias, no nuevas HUs ni Sprints.

Cada captura o registro debe mostrar lo necesario para reconocer la función, versión y resultado. Anota fecha, responsable y dispositivo. Usa cuentas de prueba y evita datos clínicos, contraseñas, tokens, documentos de identidad, medios de pago y secretos de Actions.

**Actualizado para la versión 1.1.** La [revisión del 23 de octubre](../REVISION_RUBRICA_2026-10-23.md) es el diagnóstico anterior a estos cambios. Consulta [Seguridad y privacidad](../SEGURIDAD_Y_PRIVACIDAD.md) y los artifacts de Actions para distinguir implementación de ejecución. Una prueba no ejecutada no debe presentarse como aprobada.

| Evidencia | Dónde obtenerla | Qué debe demostrar |
| --- | --- | --- |
| E01 · Versionamiento | GitHub → repositorio → Branches; después un PR real y su historial | `main`, `develop` y `feature/*`, con PR59 hacia develop. Mostrar la creación real de develop el 25/10 y el historial anterior; la aceptación de la actualización posterior al 22/10 corresponde al docente. |
| E02 · Seguridad CI | GitHub → Actions → ejecución del análisis de seguridad → resumen y artifact del reporte | Herramienta, commit analizado, hallazgos y tratamiento. El pipeline 1.1 ejecuta Semgrep y pruebas HTTP del backend aislado más ZAP. Adjuntar JSON/HTML de la ejecución y explicar su alcance. |
| E03 · Colaboración | Historial de PR/commits y Project oficial | Trabajo real de cada integrante y revisión del equipo. Agregar una tabla integrante → tarea oficial → PR/commit → aportación. No alterar fechas ni fabricar aportaciones. |
| E04 · Interfaces | Teléfono → app instalada → acceso, Inicio, Estudios, detalle, Perfil y Cortes con rol permitido | Pantallas del framework móvil, logo, navegación y datos de prueba. Las capturas de navegador deben etiquetarse como web, no como Android. |
| E05 · Arquitectura | Editor → diagrama y archivos que implementan los patrones | MVVM/Clean y ejemplos reales de Singleton, Factory, Repository y Observer, relacionados con sus pruebas. La versión 1.1 aplica estos patrones en privacidad y estudios; ver ARCHITECTURE.md. |
| E06 · Caja blanca | Terminal en `mobile` → `npm test -- --runInBand --coverage`; luego `node --test tests/ci/*.test.cjs` | Totales de pruebas, asserts y cobertura real. Guardar salida sin secretos. La regresión 1.1 tiene 174 pruebas en 18 suites y 22 comprobaciones de CI; registrar el commit de la salida adjunta. |
| E07 · UX | Teléfono → recorrido con teclado, Atrás, fuentes grandes, carga, error y reintento | Uso fluido y ausencia de bloqueos. Adjuntar dispositivo, Android y resultado de cada caso de la matriz. |
| E08 · Cloud/JWT | Terminal → `npm run test:integration`, más pantallas de datos de prueba | Ocho comprobaciones reales contra Render y uso autenticado. No mostrar el valor del token ni el archivo `.env.integration`. La versión 1.1 añade seis comprobaciones de sesión/privacidad con test:integration:security; no imprimir tokens. |
| E09 · Pinning y cifrado | Código/configuración nativa + prueba controlada del build | Pin válido aceptado, pin incorrecto rechazado y almacenamiento cifrado. Ya está implementado. Las tres pruebas TLS de OkHttp están en el artifact nativo; distinguirlas de una prueba de caja negra del APK. Un candado HTTPS del navegador no sirve como esta evidencia. |
| E10 · ARCO | App final → privacidad/perfil; política pública en navegador | Consentimiento desmarcado inicialmente, acceso/rectificación, cancelación propia y opciones de oposición persistidas. La versión 1.1 añade aceptación, preferencias y cancelación. Probar con cuentas desechables; no eliminar cuentas operativas. |
| E11 · R8 y análisis | EAS/Gradle → tarea R8 y configuración generada; JADX o MobSF → reporte del APK final | Minificación/reducción reales, reglas, efecto observado y limitaciones. El APK 1.1 ejecutó minifyReleaseWithR8. Conservar el reporte JADX del APK distribuible y el análisis con mapping del Release QA, identificando sus variantes y límites. |
| E12 · Caja negra | Teléfono o emulador → builds Debug y Release; CSV de la matriz | Resultado y evidencia en ambos builds, incidencias y repetición en Release. No trasladar aprobaciones de Jest o del navegador a estas columnas. |
| E13 · Play Store | Play Console → estado de publicación; ficha pública cuando exista | Estado enviado a revisión/publicado y versión. El enlace de Expo o una ficha en borrador no bastan. No existe evidencia de ese estado en esta revisión. |
| E14 · APK firmado | Build EAS finalizado, APK, metadatos de firma y app instalada | Versión, firma y paquete que efectivamente se evaluó. El archivo `APK_ACTUAL.json` identifica el APK 1.1.0, código 4. La inspección del 23 de octubre es histórica. |
| E15 · Permisos | Manifiesto del APK final + Ajustes de Android → Aplicaciones → Econolab → Permisos | Permisos reales y su finalidad. Actualmente no hay cámara, GPS, micrófono ni almacenamiento externo; explicar por qué no aparece un diálogo runtime. Si se añade un permiso peligroso en el futuro, probar aceptar y rechazar a demanda. |

## Cómo llenar la matriz

1. Abrir `MATRIZ_CAJA_NEGRA.csv` en Excel con codificación UTF-8 y separador coma. También puede importarse en otra hoja de cálculo.
2. Registrar para cada ejecución: versión, tipo de build, dispositivo, Android, fecha y persona responsable. Mantener estos datos en las columnas correspondientes.
3. Seguir los pasos sin revisar el código durante la ejecución. Usar datos de prueba que permitan saber el resultado esperado.
4. Cambiar cada celda de Debug y Release a **Aprobado**, **Falló**, **Bloqueado** o **No aplica con justificación**. “No ejecutado” no significa aprobado. Los casos bloqueados por funciones ausentes requieren implementación antes de probarse.
5. Guardar la captura o video con el ID del caso y build, por ejemplo `CN01-release.png`, y anotar el nombre en Evidencia. No es obligatorio producir un video largo si capturas y registro reproducible bastan.
6. Ante un fallo, registrar en Incidencia: resultado observado, pasos para repetir, versión y PR/commit de la corrección cuando exista. Repetir el caso y las funciones relacionadas sobre el Release nuevo, conservando el historial de la primera ejecución.
7. Para cancelación de cuenta, contraseñas y pinning usar un entorno/cuenta desechable autorizado. No eliminar cuentas reales ni interceptar tráfico del laboratorio para obtener una captura.

## Si una herramienta ya está instalada

No hace falta desinstalar una herramienta para simular la instalación. Si se adjunta también el reporte de preparación del entorno, escribir “ya estaba instalada” y capturar su versión y funcionamiento: `node --version`, `npm --version`, Git o la pantalla de la herramienta. Esa evidencia acredita disponibilidad actual, no una instalación que no se observó.

## Publicación a nombre del alumno

El titular debe realizar personalmente verificaciones de identidad, acuerdos y pagos de Google. Las capturas académicas de Console deben mostrar solamente aplicación, versión y estado; recortar datos personales o financieros. El nombre indicado por el alumno es Jesús David Saldaña Hernández, grupo 10° A; eso no permite inventar los datos legales del laboratorio ni completar identidades de otros integrantes.

La prueba cerrada de Play y la matriz Debug/Release se complementan: la primera es un requisito de distribución para ciertas cuentas y la segunda es evidencia de calidad del proyecto. Completar una no sustituye automáticamente la otra.
