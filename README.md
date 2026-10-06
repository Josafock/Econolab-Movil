# ECONOLAB m?vil

Cliente React Native con Expo SDK 57 y TypeScript. Reutiliza la API NestJS existente de ECONOLAB.

## Ejecutar

1. Usar Node 24 LTS (.nvmrc).
2. Ejecutar `npm ci` dentro de mobile.
3. Copiar .env.example a .env y completar EXPO_PUBLIC_API_URL con la base del backend, incluido /api.
4. Ejecutar `npm start` y abrir con Expo Go compatible con SDK 57, o un emulador/compilaci?n de desarrollo.

En un tel?fono, localhost es el tel?fono: para backend local utiliza la IP de la computadora en la misma red. Android Emulator usa 10.0.2.2. HTTP solo se permite durante desarrollo; la versi?n publicada necesita HTTPS. El preview web necesita un origen autorizado por la configuraci?n CORS del backend.

## Validaci?n

`npm run verify` ejecuta lint, TypeScript, pruebas y exportaci?n Metro Android/iOS. `npm run build` verifica los bundles nativos; no genera APK/IPA ni sustituye una prueba en dispositivo.

## Planificaci?n

Las issues y el Project existentes en https://github.com/Josafock/Econolab-Movil son la planificaci?n oficial. Ver docs/GIT.md para jerarqu?a y dependencias. Cada HU tiene una rama; el responsable integra los PR manualmente. No se alteran los sprints.

## Documentaci?n

- docs/ARCHITECTURE.md: estructura y contratos le?dos del backend.
- docs/GIT.md: HUs, sub-issues y ramas.

No se incluyen secretos ni credenciales. .env y .env.integration permanecen fuera del repositorio.
