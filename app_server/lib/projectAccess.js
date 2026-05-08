const prisma = require("../lib/prisma");

async function getProjectAccess(projectId, userId, userRole) {
  if (!projectId || !userId) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: { select: { id: true, kullaniciAdi: true, ad: true } },
      members: {
        include: { user: { select: { id: true, kullaniciAdi: true, ad: true } } },
      },
    },
  });
  if (!project) return null;

  const isCreator = project.createdById === userId;
  const isMember = project.members.some((m) => m.userId === userId);
  const isSiteAdmin = userRole === "admin";

  if (!isCreator && !isMember && !isSiteAdmin) return null;

  return {
    project,
    isProjectAdmin: isCreator || isSiteAdmin,
    isMember: isCreator || isMember || isSiteAdmin,
  };
}

function parseId(raw) {
  const id = parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
}

module.exports = { getProjectAccess, parseId };
