# HU04 — Cortes por fecha

Ampliación solicitada el 20 de octubre de 2026. El propietario confirmó el alcance: **solo resumen de servicios por fecha**. Se vincula a [HU04 #4](https://github.com/Josafock/Econolab-Movil/issues/4), dashboard #22, menú #23 y acceso #24. El Project oficial sigue asignando HU04 a Sprint 3 (11–17 de octubre); no se cambian sus fechas, estado, responsables ni Sprint por esta solicitud posterior. Validaciones: HU07 #30–#32. Pruebas: HU08 #33–#35. No se crean HUs o calendarios alternativos ni tags de cierre.

**Evidencia del 25/10:** [recorrido Android aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/40229958547), en tamaño normal y compacto con texto 1.3. Backend real con PostgreSQL desechable: dos servicios incluidos, uno cancelado, neto $135.50 e importe cancelado $45.00. Son datos ficticios; no representan el efectivo ni los servicios de Render. La regresión vigente tiene 179 pruebas; los totales de pruebas del apartado histórico de la entrega inicial se conservan con su fecha.

## Uso

Un administrador puede abrir **Cortes** desde Inicio o la barra inferior. Recepción conserva Estudios y Perfil, pero no tiene acceso al corte. La ruta está protegida por Expo Router y el backend vuelve a comprobar el rol real del usuario.

Se puede consultar hoy, ayer, los últimos siete días o un periodo personalizado de hasta 366 días, incluyendo ambos extremos. Las fechas usan AAAA-MM-DD y el horario de Ciudad de México, independientemente de la zona del teléfono. El filtro opcional de sucursal utiliza su nombre exacto; dejarlo vacío consulta todas.

El módulo muestra subtotal, descuento por cortesía, importe neto, número de servicios, cancelados excluidos y su importe, desglose diario y detalle paginado por folio. Los totales abarcan todo el periodo, aunque solo haya veinte órdenes visibles. Los importes conservan los centavos como textos decimales. Las respuestas del periodo anterior se cancelan y descartan al cambiar filtros o páginas.

Un periodo sin registros muestra cero y un estado vacío a partir de la respuesta real. Si la consulta falla, se ocultan las cifras y se ofrece reintentar. «Actualizar corte» vuelve a consultar la base.

## Alcance de los datos

En la web actual «Corte de hoy» es una referencia visual; no existe un reporte funcional de caja ni un registro de cobros en el backend. El módulo nuevo usa los importes reales de ServiceOrder a través de [PR2 del backend](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/2), `GET /api/cash-cuts` con Bearer y rol admin.

La fecha considerada es la de registro del servicio; se excluyen órdenes dadas de baja y se separan los cancelados. El reporte devuelve solo folio, fecha, sucursal, estado e importes. No necesita expedientes, notas clínicas, médicos ni resultados.

Los datos existentes no incluyen pagos, abonos, retiros, método de pago o arqueo. La pantalla informa que estos importes **no confirman el efectivo recibido**; el contrato declara `basis: service-registration` y `paymentsTracked: false`. Es una consulta de importes vigentes, sin cierre contable persistido o bloqueo de órdenes. No se presume que concluir un servicio significa cobrarlo ni se generan pagos históricos.

La lectura se incorpora al backend existente sin tablas, columnas o migraciones nuevas. Usa una instantánea consistente para resumen/días/página, sumas decimales en PostgreSQL y límites de medianoche local convertidos a UTC.

## Entrega y pruebas

Rama `feature/HU-04-cortes`, basada en la acumulada HU08 `684755e` para conservar autenticación, estudios, perfil, identidad visual y el pipeline actual. El diff hacia main incluye las bases pendientes; el responsable integra los PR móviles conforme a su planeación. Main remoto al iniciar el trabajo: `bbd004f`; no se integra ningún PR móvil.

Para resolver los conflictos con HU01 ya integrada por el propietario, se aplicó rebase únicamente a la rama nueva sobre `origin/main`. Se conservaron el código probado y los workflows actuales; las otras ramas y main no se reescribieron. El PR móvil es [#56](https://github.com/Josafock/Econolab-Movil/pull/56). El backend fue integrado con la autorización previa del propietario: PR2, merge `07404d6`.

132 pruebas móviles en diez suites y 77 del backend en diez suites aprobadas; lint/TypeScript, build Nest y exportación Metro Android/iOS aprobados. Se incorporan pruebas del dashboard, permisos, fechas, precisión decimal, paginación, respuestas tardías y errores de red. El registro `ci/features.json` vincula las suites nuevas con HU04 y la regresión HU08 sin modificar el mecanismo obligatorio del PR.

El smoke con controladores reales y la base existente verificó JWT, revocación, filtros, fechas, centavos, cancelados, resumen completo, paginación, proyección segura y límites de medianoche; comparó con un cálculo independiente en centavos. La prueba de desarrollo no escribe servicios o importes ni constituye un cierre de Sprint. La ejecución física Android/iOS sigue pendiente del equipo.

La revisión Chromium aprobó entrada desde Inicio/barra, fechas inválidas, periodo con registros reales, sucursal vacía, fallo de red y reintento sin mostrar cifras anteriores, logout y enlace protegido. Se revisaron 320/390/768 px sin desbordamiento. Para esta primera prueba solo Cortes se dirigió al módulo real local; login usó Render y se retiró Origin en la herramienta externa de QA por el CORS existente. No se simularon respuestas.
