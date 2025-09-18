import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function logAudit(
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: any
) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      entityType,
      entityId,
      metadata,
    },
  });
}