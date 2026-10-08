// Append-only audit writer. Every important CMS/ops mutation calls this.
// Never pass passwords, tokens, OTPs, or medical free text in metadata.

export async function recordAudit(db, { actorId = null, actorRole = null, action, entityType = null, entityId = null, metadata = {} }) {
  if (!action) throw new Error('recordAudit requires an action');
  await db.query(
    `INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [actorId, actorRole, action, entityType, entityId ? String(entityId) : null, JSON.stringify(metadata ?? {})],
  );
}

export function actorFrom(req) {
  return {
    actorId: req.user?.id ?? null,
    actorRole: req.user?.roles?.[0] ?? null,
  };
}
