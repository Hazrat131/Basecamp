const prisma = require("../lib/prisma");

async function isAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/users/login");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, isAdmin: true, status: true },
    });

    if (!user || user.status === "banned") {
      return req.session.destroy(() => res.redirect("/users/login"));
    }

    if (!user.isAdmin) {
      return res.status(403).send("Access denied");
    }

    req.session.userRole = "admin";
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    res.status(500).send("Server error");
  }
}

module.exports = isAdmin;
