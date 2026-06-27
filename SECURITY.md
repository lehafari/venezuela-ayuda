# Política de seguridad

`venezuela-ayuda` maneja **datos personales de personas en una emergencia** (nombres,
contactos, ubicaciones, fotos). Una fuga tiene consecuencias reales. Tratamos la seguridad y
la privacidad como prioridad máxima.

## Reportar una vulnerabilidad o una fuga de datos

**No abras un issue público ni un PR que exponga el problema.** Repórtalo en privado:

- Vía GitHub: **Security → Report a vulnerability** (Private Vulnerability Reporting), o
- Escribe directamente al equipo de mantenimiento por el canal privado del proyecto.

Incluye: qué encontraste, cómo reproducirlo y el impacto potencial. Te responderemos lo antes
posible y coordinaremos la divulgación una vez haya un arreglo.

## Qué consideramos sensible

- **PII**: teléfonos, contactos, `manage_token` y cualquier dato que identifique a una persona.
  Nunca debe aparecer en logs, en endpoints/vistas públicas ni en capturas de issues/PRs.
- **Secretos**: claves de Supabase, API keys de socios, tokens de admin, variables `.env*`.
- **Acceso de escritura a producción** y al pipeline de despliegue/migraciones.

## Reglas para contribuidores

- No subas `.env*` ni secretos. Si filtras uno por error, **avisa de inmediato** para rotarlo.
- No registres PII en logs ni la devuelvas por endpoints públicos.
- Todo acceso de escritura requiere **2FA**.
- Ante la duda con datos reales o con producción, **pregunta antes de actuar**.

Gracias por ayudar a mantener seguras a las personas que dependen de esta herramienta.
