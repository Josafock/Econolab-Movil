# HU06 — compatibilidad del perfil

Issue #7; consulta #28 y edición #29.

Datos reales disponibles: id, nombre, email, rol devueltos en POST /api/auth/login. Se muestran solo campos conocidos en modo lectura; el token nunca se muestra. No existe endpoint para volver a consultar el perfil. Por ello los datos son una instantánea del último login, no una lectura actualizada del servidor.

Edición disponible: PATCH /api/users/update-password con current_password y password. Su validación sigue UpdatePasswordDto: 8–128 caracteres y al menos mayúscula, minúscula, número y símbolo. Un 401 puede significar contraseña actual incorrecta o sesión inválida; se comprueba la sesión mediante la consulta existente de estudios antes de clasificar ese error.

Edición de nombre/correo y consulta actualizada: NO implementables con el contrato actual. frontend/src/app/perfil/page.tsx contiene datos de ejemplo y no persiste cambios. No se reutilizan esos datos ni se simula el guardado. HU06 está parcialmente implementada; #29 no se marca completa.

Propuesta para revisión del responsable del backend: una lectura autenticada del usuario actual con id/nombre/email/rol, y una modificación que acepte únicamente los campos personales autorizados y vuelva a devolver esos datos. Los nombres/rutas deben ser definidos por ese equipo. La app podrá añadir esos contratos cuando existan; no se inventan endpoints ahora.

Cambios al código/esquema del backend: 0.
