# Cómo Funciona Este Repositorio

## Stack de Orquestación
- **Luna/Droid** — escribe y modifica código/especificaciones
- **Gemini CLI** — revisa cada commit automáticamente
- **n8n** — workflows de automatización ejecutándose en VPS

Ver `specs/architecture.md` para detalles completos de la arquitectura n8n-First y la integración con Google Cloud, Supabase y Upstash Redis.

## Flujo de Trabajo
1. Luna/Droid realiza cambios localmente
2. `git commit` activa el revisor Gemini CLI (pre-commit hook)
3. Gemini escribe tareas de mejora en `droid-tasks.md`
4. Luna lee `droid-tasks.md` al inicio de la siguiente sesión
5. Los commits aprobados se envían al VPS vía `git push`

## Estrategia de Ramas
- `main` — producción (VPS)
- `feature/*` — trabajo en progreso de Luna/Droid
