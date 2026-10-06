# Trazabilidad

La planificación oficial está en las issues y el Project existentes de Josafock/Econolab-Movil. No se crean HUs, sprints ni fechas alternativos. Se consultaron las relaciones sub-issue por API el 2026-10-05.

| HU | Issue | Sub-issues | Rama |
|---|---|---|---|
| 01 | #1 | #10 #11 #12 #13 #14; CI: #36 #37 #38 | feature/HU-01-arquitectura |
| 02 | #2 | #15 #16 #17 #18 | feature/HU-02-interfaz |
| 03 | #3 | #19 #20 #21 | feature/HU-03-autenticacion |
| 04 | #4 | #22 #23 #24 | feature/HU-04-modulos |
| 05 | #6 | #25 #26 #27 | feature/HU-05-estudios |
| 06 | #7 | #28 #29 | feature/HU-06-perfil |
| 07 | #8 | #30 #31 #32 | feature/HU-07-errores |
| 08 | #9 | #33 #34 #35 | feature/HU-08-pruebas |

#5 es PB-05 Módulos principales, no HU05. Las ramas se basan en la HU anterior cuando requieren su código. Los PR hacia main explicarán esa dependencia y el rango propio de commits; mientras las bases no se integren, su diff será acumulativo. No se fusionan ramas ni se modifica main. El responsable decide el orden según sus sprints. Conviene integrar conservando commits (merge commit) o rebasar las ramas dependientes después de un squash.

Los números TH del tablero se mantienen; los mensajes de commit emplean HU-XX/T-XX.YY y referencias a las issues reales. SemVer MAJOR.MINOR.PATCH conforme a #13. No se crean tags sprint ni se decide un cierre de sprint.

La sesión disponible carece de `read:project`. Las issues y su jerarquía fueron consultadas, pero Sprint/fechas/estados del Project no pudieron verificarse. No se infieren ni se modifican. Para habilitar lectura, el titular puede ejecutar `gh auth refresh -s read:project`.
