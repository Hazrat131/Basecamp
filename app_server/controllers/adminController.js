const prisma = require("../lib/prisma");

async function dashboard(req, res) {
  const [totalUsers, adminCount, normalUsers, totalProjects, bannedUsers, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.user.count({ where: { isAdmin: false } }),
      prisma.project.count(),
      prisma.user.count({ where: { status: "banned" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  res.render("admin/dashboard", {
    totalUsers,
    adminCount,
    normalUsers,
    totalProjects,
    bannedUsers,
    recentUsers,
  });
}

async function renderUsers(req, res) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });
  res.render("admin/users", { users, currentAdminId: req.session.userId });
}

async function changeUserRole(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).send("Invalid id");

  if (id === req.session.userId) {
    return res.status(400).send("Oz rolunuzu deyise bilmezsiniz.");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).send("User not found");

  await prisma.user.update({
    where: { id },
    data: { isAdmin: !user.isAdmin },
  });

  res.redirect("/admin/users");
}

async function banUsersPost(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).send("Invalid id");

  if (id === req.session.userId) {
    return res.status(400).send("Ozunuzu ban ede bilmersiniz.");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).send("User not found.");

  await prisma.user.update({
    where: { id },
    data: { status: user.status === "banned" ? "active" : "banned" },
  });

  res.redirect("/admin/users");
}

module.exports = { dashboard, changeUserRole, renderUsers, banUsersPost };
