# Seguimiento de las correcciones A4

## ADB offline en aceptación

- Evidencia inicial: run 40142877531 del 24 de octubre.
- Observado: Maestro no pudo lanzar la app; ADB informó `device offline`.
- Tratamiento: esperar arranque, conexión y Package Manager estables; conservar
  diagnóstico y no reintentar aserciones funcionales para convertirlas en éxito.
- Resultado de repetición: se registra desde el run nativo terminado; no se
  acredita por disponer del script.

## Dependencia de Render en una prueba TLS

- Evidencia inicial: [run 40371704079](https://github.com/Josafock/Econolab-Movil/actions/runs/40371704079), commit 948403b.
- Observado: dos de tres pruebas TLS Java fallaron con SocketTimeoutException
  esperando cabeceras HTTP del servidor público. El rechazo de pin incorrecto
  sí pasó. El fallo se propagó a Gradle y al check final.
- Causa comprobada: las pruebas de pinning dependían también de recibir una
  respuesta HTTP de un servicio público; no era un entorno de prueba aislado.
- Corrección: dos certificados reales de claves distintas bajo una CA QA
  efímera, servidor local y cinco casos de conexión válida, respaldo de CA,
  rechazo de pin, rechazo de CA no confiable y verificación de hostname.
- Alcance: valida TLS y pinning en QA; no certifica disponibilidad ni renovación
  real del certificado de producción. No se agrega TrustAll ni se desactiva la
  comprobación de hostname.
- Validación posterior: completar con JUnit y run de repetición finalizados.

## Servicios externos

El equipo confirmó que todavía no dispone de cuentas de Play Console, Firebase
y SonarCloud. Los workflows y parámetros de publicación/SonarCloud son
preparación, no resultados ejecutados ni publicación de tienda. DeepWiki mostró
que falta indexar y exige un correo para avisar al titular.
