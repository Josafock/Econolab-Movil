# Icono de la aplicación

Se reutiliza el símbolo original de `frontend/public/econolab-logo.svg`. La copia vectorial está en `assets/econolab-symbol.svg`; no se redibujó el logo ni se usó el icono de ejemplo de Expo.

`app.json` configura los recursos de `assets/branding`:

- `icon.png`: icono de 1024 × 1024, fondo blanco opaco, para iOS y el icono general.
- `adaptive-foreground.png`: símbolo con transparencia para Android, sobre fondo blanco.
- `adaptive-monochrome.png`: máscara del mismo símbolo para los iconos temáticos de Android.
- `splash.png`: símbolo para la pantalla de arranque nativa.
- `favicon.png`: icono del preview web.

Los archivos se generan con `npm run generate:icons` a partir del SVG, mediante Sharp como herramienta de desarrollo. Están incluidos en Git; no hace falta regenerarlos para ejecutar la app.

## Verificación

`npx expo prebuild --platform android --no-install` terminó correctamente y generó iconos normales, redondos, adaptativos y monocromáticos para las cinco densidades. Los XML de los iconos adaptativos referencian el fondo, el símbolo y la máscara correctos. Las carpetas nativas generadas permanecen ignoradas por Git.

La comprobación de iOS se ejecuta en el workflow Mobile CI mediante prebuild. Exportar los bundles con Metro no produce un instalador ni comprueba cómo se ve el icono en un teléfono.

## Verlo en el teléfono

Expo Go conserva su propio icono en el menú del teléfono. El icono de ECONOLAB aparece al compilar e instalar una aplicación independiente. Según la [documentación de iconos de Expo](https://docs.expo.dev/develop/user-interface/app-icons/), estos cambios requieren una compilación nueva.

En un equipo con JDK, Android SDK y teléfono con depuración USB o emulador configurados, ejecutar `npx expo run:android` dentro de `mobile`. Para iOS se necesita macOS con Xcode y `npx expo run:ios`. En este equipo no están disponibles el SDK/JDK de Android ni el simulador iOS, por lo que no se declara una instalación física verificada.
