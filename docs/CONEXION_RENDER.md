# Conexión al backend publicado y Expo Go

Actualización: 6 de octubre de 2026. HU01 #1, comunicación #12; autenticación HU03 #3; errores HU07 #8.

La API utilizada por la app es `https://backend-econolab-escuela-1.onrender.com/api`. Se comprobó el prefijo `/api` contra el servidor publicado: el catálogo sin sesión devuelve 401; el login de la cuenta independiente devuelve token e identidad válidos. `.env.example` y `.env.integration.example` contienen la dirección pública; las credenciales solo permanecen en `.env.integration` ignorado.

## Arranque para teléfono

Desde `mobile`, ejecutar `npm start`. El script inicia Expo Go por túnel para evitar depender de la dirección LAN y de conexiones entrantes bloqueadas por la red. `@expo/ngrok` está instalado como herramienta de desarrollo. Escanear el QR nuevo, manteniendo computadora, consola e internet disponibles durante la prueba.

Para limpiar una dirección o bundle anterior: `npm start -- --clear`. Cerrar la instancia anterior si el puerto ya está ocupado. El QR de una sesión anterior puede apuntar a un servidor que ya no está funcionando; volver a abrirlo no inicia Expo.

Alternativa en la misma red: `npm run start:lan`. El túnel usa internet y puede fallar temporalmente por el proveedor; la opción LAN sigue disponible. La app obtiene los datos directamente de Render por HTTPS en ambos casos y ya no necesita arrancar el backend local.

El aviso «Cannot connect to Expo CLI» corresponde a la conexión con el servidor de desarrollo. Cambiar la URL de la API por sí solo no mantiene Metro encendido. No se silencia LogBox ni se modifican paquetes internos para ocultar ese aviso.

## Validación

`npm run test:integration` se ejecutó contra Render: acceso anónimo, login, catálogo/paginación, búsqueda/filtros, detalle y revocación, seis comprobaciones aprobadas. Se usaron datos reales y se cerraron las sesiones de la prueba. La cuenta anterior funciona en este backend; no se creó otra cuenta ni se modificaron estudios o esquema.

Actualización posterior del 6 de octubre: el propietario autorizó integrar el PR1 del backend para publicar el perfil. Se comprobó `GET/PATCH /api/users/me` en el mismo Render y pasaron las siete comprobaciones de la suite actual, incluido perfil. La edición HTTP y desde el formulario móvil verificó nombre/correo, contraseña obligatoria para cambiar correo, login nuevo y saludo actualizado; los datos originales de la cuenta de pruebas quedaron restaurados. Ver [perfil publicado](PROFILE_COMPATIBILITY.md). El despliegue del backend no integra los PR ni modifica `main` del móvil.

Login y restauración de sesión permiten hasta 60 segundos para la primera conexión. El resto del transporte conserva su timeout habitual y cancelación; no se reintentan automáticamente contraseñas para evitar bloqueos.

El Render publicado rechaza los orígenes localhost del preview web mediante CORS. La prueba normal con datos debe realizarse en Expo Go o desde un origen web autorizado. CORS no bloquea las peticiones nativas sin Origin. No se cambia la configuración del backend para el preview.

Los workflows por Sprint se mantienen; no se generan tags ni se decide el cierre. Las alertas de dependencias se revisaron sin `--force`, conservando Expo57/RN0.86. El override de uuid se limita también al cliente de túnel, que utiliza `v4()` sin argumentos.
