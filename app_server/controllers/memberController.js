const prisma = require("../lib/prisma");
const { getProjectAccess, parseId } = require("../lib/projectAccess");

async function add(req, res) {
  const projectId = parseId(req.params.projectId);
  if (projectId === null) return res.status(400).send("Invalid project id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");
  if (!access.isProjectAdmin) {
    return res.status(403).send("Yalniz layihe admini uzv elave ede biler.");
  }

  const identifier = (req.body.identifier || "").trim();
  if (!identifier) {
    return res.redirect(`/projects/${projectId}?member_error=empty`);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ kullaniciAdi: identifier }, { email: identifier.toLowerCase() }],
    },
    select: { id: true },
  });

  if (!user) {
    return res.redirect(`/projects/${projectId}?member_error=notfound`);
  }

  if (user.id === access.project.createdById) {
    return res.redirect(`/projects/${projectId}?member_error=owner`);
  }

  try {
    await prisma.projectMember.create({
      data: { projectId, userId: user.id },
    });
  } catch (err) {
    if (err.code !== "P2002") throw err;
  }

  res.redirect(`/projects/${projectId}`);
}

async function remove(req, res) {
  const projectId = parseId(req.params.projectId);
  const userId = parseId(req.params.userId);
  if (projectId === null || userId === null) return res.status(400).send("Invalid id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");
  if (!access.isProjectAdmin) {
    return res.status(403).send("Yalniz layihe admini uzvu sile biler.");
  }

  await prisma.projectMember
    .deleteMany({ where: { projectId, userId } })
    .catch(() => {});

  res.redirect(`/projects/${projectId}`);
}

module.exports = { add, remove };
