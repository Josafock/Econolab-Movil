# Revisión de la rúbrica — 25 de octubre de 2026

**El proyecto todavía no acredita el 100 % de la rúbrica.** La implementación avanzó y ya existen APK/AAB firmados, pero quedan pruebas nativas completas, publicación y evidencias del equipo.

**Actualización para la entrega de octubre:** se creó `develop` el 25/10 y se abrió el [PR59](https://github.com/Josafock/Econolab-Movil/pull/59). Las [aportaciones de ambos integrantes](APORTACIONES_EQUIPO_OCTUBRE.md) ya están vinculadas con cambios reales. El estado específico de las actividades 5 y 4 está en [Entrega de octubre](ENTREGA_OCTUBRE_2026.md); no debe confundirse con los pendientes de noviembre de esta revisión integral.

Esta revisión compara los 15 criterios del «Instrumento Integral de Evaluación Móvil» proporcionado por el alumno. «Cumple técnicamente» significa que hay implementación y evidencia en el alcance señalado; no asigna puntos ni sustituye el dictamen del docente.

## Estado de los 15 criterios

| Criterio | Estado | Evidencia actual / lo que falta |
| --- | --- | --- |
| A5.1 · Versionamiento | Estructura completada el 25/10 | Existen `main`, `develop`, ramas `feature/*`, correcciones y PR59 hacia develop. La rama develop parte del main real; no se reescribió el historial ni se cambió la planeación. La aceptación de esta actualización después de la entrega del 22/10 corresponde al docente; el responsable revisa la integración de los PR acumulados. |
| A5.2 · SAST/DAST en CI | Cumple técnicamente | Semgrep: 66 archivos, cero hallazgos/errores; 16 casos HTTP aprobados y ZAP con dos avisos informativos de caché, sin hallazgos bajos/medios/altos en el alcance analizado. La auditoría de dependencias conserva ocho avisos transitivos: cinco altos, tres moderados, cero críticos. |
| A5.3 · Organización y aportaciones | Evidencia documentada; validación del equipo | Hay organización por funcionalidades y cambios reales de ambos integrantes: David en aplicación/pruebas y Kristofer en automatización/controles del repositorio. La tabla enlaza commits y PR. Los dos deben confirmar sus aportaciones y explicar el reparto; no se certifica el equilibrio solo por contar commits. |
| A4.1 · Interfaces móviles | Cumple técnicamente | React Native/Expo con acceso, Inicio, Estudios, detalle, Perfil, Ayuda, Privacidad y Cortes. El recorrido Android QA aprobó en dos configuraciones del emulador; practicar en el teléfono del equipo sigue siendo recomendable. |
| A4.2 · Arquitectura y patrones | Cumple técnicamente | MVVM/Clean explícitos en estudios y privacidad, con Singleton, Factory, Repository y Observer documentados y aplicados. No se afirma que todos los módulos hayan sido reescritos como casos de uso separados. |
| A4.3 · Caja blanca | Cumple técnicamente | 179 pruebas en 19 suites y 22 comprobaciones de configuración/CI aprobadas. Hay pruebas en `/test` y se conserva la regresión previa en `/tests`. |
| A4.4 · Navegación y UX/UI | Cumple en el alcance comprobado | [Android QA Release](https://github.com/Josafock/Econolab-Movil/actions/runs/40229958547) aprobó el recorrido completo en 1080×2400, texto 1.0, y 720×1280, texto 1.3. Incluye correo visible con teclado, búsqueda/detalle, Cortes, edición exacta del nombre, Ayuda, Atrás y logout. No se atribuye una prueba física, iOS, lector de pantalla ni la matriz completa de noviembre. |
| A6.1 · Cloud y JWT | Cumple técnicamente | Backend real en Render, Bearer, JWT corto, renovación agrupada ante 401, rotación y revocación. Ocho comprobaciones funcionales y seis de sesión/privacidad contra Render aprobaron la última ejecución conservada. |
| A6.2 · Pinning y cifrado | Parcial de evidencia | Pinning SPKI SHA-256 y SecureStore implementados. Tres casos TLS OkHttp aprobados y acceso real de la app QA observado. Falta completar la validación del cliente Release; las pruebas JVM no se presentan como caja negra completa del APK. |
| A6.3 · ARCO | Parcial de evidencia | Aviso público, casilla inicialmente desmarcada, perfil GET/PUT, cancelación DELETE /account y preferencias opcionales implementados; 16 casos HTTP cubren estos contratos. Falta acreditar el recorrido completo de cancelación y acceso posterior rechazado en Android Debug/Release. El responsable debe revisar conservación, proveedores y atención real de solicitudes. |
| A6.4 · R8/ProGuard y análisis | Cumple técnicamente, con límites | Minificación y reducción persistentes; tarea R8 ejecutada y reportes de JADX conservados. JADX recuperó 9138 archivos Java y reportó 130 errores parciales de decompilación: la ofuscación no hace imposible recuperar código. |
| A6.5 · Caja negra Debug/Release | Incompleto para noviembre | El recorrido de octubre aprobó en Release QA y dos tamaños. La matriz integral de noviembre, especialmente cancelación y rechazo del acceso posterior, sigue sin aprobarse completa en Debug y Release. No se transfieren resultados entre variantes o casos no ejecutados. |
| A7.1 · Google Play | Pendiente | No hay publicación ni envío activo a revisión acreditado. El AAB listo y un enlace de Expo no cumplen este criterio por sí solos. |
| A7.2 · APK/AAB firmado | Cumple técnicamente, con versiones identificadas | APK 1.1.0 código 6 finalizado y firma verificada, con el ajuste de teclado. APK 4 y AAB 5 conservan sus verificaciones históricas; regenerar el AAB desde el código corregido antes de publicar. |
| A7.3 · Permisos a demanda | Justificar con el docente | El manifiesto final evita cámara, ubicación, micrófono y almacenamiento externo. Usa permisos normales de red/vibración y un permiso interno. Esos permisos no requieren diálogo runtime; adjuntar manifiesto y explicación. No añadir permisos peligrosos únicamente para producir una captura. |

## Pendiente nativo de noviembre

El [run nativo 40142877531](https://github.com/Josafock/Econolab-Movil/actions/runs/40142877531) terminó con fallo. JUnit registra «Unknown error» y el log del controlador identifica `device offline` al abrir la app. No acredita un defecto funcional de Econolab: impide comprobar el recorrido completo. En esa ejecución no se generó un resultado funcional aprobado de Release.

Debe estabilizarse la conexión del emulador y repetirse la misma matriz sobre Debug y Release, incluida la cancelación con contraseña/frase/confirmación y el rechazo del acceso de la cuenta cancelada. Conservar resultados, capturas, incidencias y repetición sobre Release. Los casos manuales no ejecutados deben seguir marcados como tales.

## Lo que corresponde al titular/equipo

1. Crear/verificar Play Console, completar declaraciones y pruebas de distribución, cargar el AAB y obtener estado enviado a revisión o publicado. Seguir [la guía de publicación](PUBLICAR_GOOGLE_PLAY.md).
2. Probar el APK final en un teléfono propio y guardar capturas; completar los casos restantes de [la matriz](evidencias-rubrica/MATRIZ_CAJA_NEGRA.csv).
3. Revisar el aviso y los procesos reales de privacidad con el laboratorio. El contacto confirmado es Jesús David Saldaña Hernández, `20230009@uthh.edu.mx`; la cancelación implementada cubre la cuenta de acceso, no expedientes clínicos.
4. Confirmar entre ambos las aportaciones documentadas y revisar el [PR59 de octubre](https://github.com/Josafock/Econolab-Movil/pull/59) hacia develop. El [PR58](https://github.com/Josafock/Econolab-Movil/pull/58) histórico sigue abierto; no integrar dos veces los mismos cambios acumulados. No se modificaron los Sprints.
5. El propietario del repositorio debe completar secrets/reglas que requieran administración. La cuenta conectada tiene push, pero no administración.

## Evidencias disponibles

- [Resumen de seguridad CI](evidencias-rubrica/SEGURIDAD_CI_ACTUAL.json).
- [APK final](evidencias-rubrica/APK_ACTUAL.json) y [verificación del AAB](evidencias-rubrica/AAB_ACTUAL_VERIFICACION.json).
- [Registro de incidencias nativas](evidencias-rubrica/INCIDENCIAS_NATIVAS.md).
- [Implementación y límites de seguridad/privacidad](SEGURIDAD_Y_PRIVACIDAD.md).

El aviso público y la vía externa de cancelación respondieron HTTP 200 en esta revisión. `npm audit` se consultó nuevamente: ocho avisos, sin críticos. El cierre de octubre añadió develop, evidencias de ambos integrantes y la corrección del teclado; no se cambiaron los Sprints ni los estados del Project. La ejecución de octubre aprobada no cierra la matriz de noviembre.
