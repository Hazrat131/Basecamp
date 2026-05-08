const prisma = require("../lib/prisma");

async function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/users/login");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, isAdmin: true, status: true, ad: true },
    });

    if (!user) {
      return req.session.destroy(() => res.redirect("/users/login"));
    }

    if (user.status === "banned") {
      return req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/users/login");
      });
    }

    req.session.userRole = user.isAdmin ? "admin" : "user";
    res.locals.user = { id: user.id, ad: user.ad };
    res.locals.userRole = req.session.userRole;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).send("Server error");
  }
}

module.exports = requireAuth;
