# Incidencias observadas durante la verificación Android

Los fallos se conservaron en Actions y motivaron estas correcciones. Una compilación aprobada no se contó como recorrido funcional aprobado.

| Evidencia | Resultado observado | Corrección |
| --- | --- | --- |
| Run 40057009325 | El runner no tenía `rg`; la comprobación terminaba antes de compilar. | Usar `grep` en los comandos Linux de CI. |
| Run 40057177098 | Android Lint rechazó el recurso de red QA por faltar `includeSubdomains`. | Declararlo explícitamente como `false`; mantener Lint activo. |
| Run 40059121558 | Debug no podía cargar Metro porque la política de red prohibía HTTP. Las tres pruebas TLS sí aprobaron. | Excepción solo para `10.0.2.2` en el recurso de **QA Debug**. Release y distribución conservan HTTPS. |
| Run 40134693485 | Metro rechazó `NODE_ENV=test`, reservado por React Native para sus pruebas internas. | Iniciar Metro con `NODE_ENV=development`; el backend aislado mantiene `test`. Agregar comprobación de disponibilidad y cierre temprano si el proceso termina. |
| Comprobación local de Metro | `--localhost` escuchaba en IPv6 y no atendía `127.0.0.1`. | Usar LAN en el runner para el enlace IPv4 del emulador. |
| Run 40136033299 | Acceso, aceptación y búsqueda funcionaron. La prueba de detalle esperaba un parámetro fuera del área visible de una lista virtualizada. Release aún no se ejecutó en ese run. | Desplazarse al precio conocido y después al parámetro; hacer lo mismo para controles de perfil y privacidad. Ocultar el teclado antes de buscar la confirmación de cancelación. |
| Run 40138021112 | El acceso de Econolab estaba renderizado, pero un diálogo «Pixel Launcher isn't responding» bloqueaba el emulador. Metro también intentaba preparar DevTools de escritorio. | Modo headless del CLI, bundle Debug compilado antes de arrancar el emulador y cierre exclusivo del diálogo del launcher. No se cierra ni se oculta un ANR de Econolab. |
| Run 40139705619 | Estudios, precios, parámetros y preferencias aprobaron sus pasos. Al cancelar, la automatización escribió la frase en el campo que seguía enfocado; la confirmación quedó vacía y la app mantuvo deshabilitada la acción. | Seleccionar los inputs mediante su posición bajo la etiqueta, comprobar foco y frase escrita y verificar el botón antes de abrir la confirmación. |

También se protegieron las áreas superior e inferior de la pantalla del primer consentimiento para que sus controles respeten las barras del sistema. Este ajuste se incluye en el APK distribuible código 4.

El recorrido final comprueba la misma secuencia en Debug y Release, el rechazo del acceso después de cancelar la cuenta de prueba y que Metro ya no responda antes de instalar Release. Su resultado final se registra en [Resultado técnico 1.1](../RESULTADO_TECNICO_RUBRICA_1_1.md). Si un run falla o se cancela, no se considera una ejecución aprobada.
