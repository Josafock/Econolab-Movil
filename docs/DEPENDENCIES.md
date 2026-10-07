# Revisión de dependencias

Actualización del 6 de octubre de 2026: se aplicaron parches compatibles del lockfile mediante `npm audit fix`, sin `--force`, y se incorporaron las herramientas del túnel y del diseño. El resultado actual es **57 alertas: 49 altas, 8 moderadas y 0 críticas**. El override `uuid@11.1.1` también se limita a `@expo/ngrok`, cuyo código usa `v4()` sin argumentos. El túnel arrancó correctamente. Los resultados del 5 de octubre que siguen son históricos.

Fecha: 5 de octubre de 2026. Se revisaron `npm audit`, el árbol instalado y los avisos oficiales. Los números cuentan paquetes afectados, incluidos consumidores transitivos; no son defectos independientes encontrados en las pantallas de ECONOLAB.

Antes del ajuste: 66 alertas (50 altas y 16 moderadas). Después: **58 alertas (50 altas y 8 moderadas; 0 críticas)**. No se considera una auditoría de seguridad aprobada sin pendientes.

## Cambio aplicado

`package.json` limita el override a `xcode@3.0.1 → uuid@11.1.1`. El lockfile se regeneró y `npm ci` instaló esa resolución. La versión contiene el [parche oficial](https://github.com/uuidjs/uuid/releases/tag/v11.1.1) para [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) y conserva CommonJS.

El único llamado observado en xcode es `require('uuid').v4()` sin argumentos. Se probó su método real `generateUuid` con la versión corregida: 100 identificadores únicos válidos. El CI de HU08 incluye `expo prebuild --platform ios --no-install` en Ubuntu para verificar la generación del proyecto iOS; en Windows la CLI no permite ese prebuild. Esta generación no compila ni ejecuta una aplicación iOS.

## Alertas que permanecen

| Dependencia raíz | Severidad | Superficie observada y situación del parche |
| --- | --- | --- |
| `braces@3.0.3` | Alta | Patrones excesivamente anidados pueden agotar la pila. Está en herramientas Metro/Jest. No existe versión corregida publicada según [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). |
| `node-forge@1.4.0` | Alta | Fallo de verificación de determinadas firmas RSA. Está en Expo CLI y herramientas de certificados; no se demostró una ruta explotable en esta app. Sin parche publicado en [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv). |
| `sprintf-js@1.0.3` | Moderada | Excepciones con precisiones excesivas en formatos. Llega a herramientas de cobertura; la última versión publicada sigue afectada por [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). |
| `decode-uri-component@0.2.2` | Moderada | Consumo excesivo de CPU con entradas malformadas. Está en `query-string@7.1.3` de la cadena de navegación. Existe parche 0.5.0, pero su export ESM no sustituye directamente el `require()` actual. Riesgo potencial de enlaces, sin explotación demostrada en la app: [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). |

No se utilizó `npm audit fix --force`: propone combinaciones que no corresponden a Expo 57/React Native 0.86/Jest 29. Tampoco se anuncia un override incompatible como solución.

Antes de distribuir la app, revisar nuevas versiones compatibles y el manejo de enlaces malformados en dispositivos. Los avisos sin parche requieren seguimiento de sus mantenedores. Compartir el QR del túnel solo con el equipo de pruebas y no aceptar configuraciones de compilación de fuentes no confiables.
