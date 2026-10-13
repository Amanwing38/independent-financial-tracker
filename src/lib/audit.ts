import { prisma } from "./prisma";

interface AuditLogParams {
  action: string;
  entityType: "TRANSACTION" | "TRANSFER" | "VERIFICATION" | "USER" | "SETTINGS";
  entityId: string;
  performedById: string;
  performedByName: string;
  performedByRole: string;
  details: Record<string, unknown> | string;
}

export async function logAudit(params: AuditLogParams) {
  try {
    const detailsStr =
      typeof params.details === "string"
        ? params.details
        : JSON.stringify(params.details);

    return await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        performedById: params.performedById,
        performedByName: params.performedByName,
        performedByRole: params.performedByRole,
        details: detailsStr,
      },
    });
  } catch (error) {
    console.error("Failed to write immutable audit log:", error);
    // Rethrow to preserve atomic transaction guarantees if in a transaction
    throw error;
  }
}
