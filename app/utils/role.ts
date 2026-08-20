import { humanizeRoleName } from "~~/shared/constants/permission"

/**
 * What an operator reads where a role appears. `name` is a machine key the
 * guard matches on (`super_admin`, `content_editor`) and is never shown raw —
 * roles created before `label` existed fall back to a title-cased key.
 */
export const roleLabel = (
  role: { name: string; label?: string | null } | null | undefined,
) => {
  if (!role) return "—"
  return role.label?.trim() || humanizeRoleName(role.name)
}
