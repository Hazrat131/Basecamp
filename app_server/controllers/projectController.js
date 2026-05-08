const prisma = require("../lib/prisma");

async function getHome(req, res) {
  let user = null;
  let projectCount = 0;

  if (req.session.userId) {
    user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (user) {
      projectCount = await prisma.project.count({
        where: { createdById: user.id },
      });
    }
  }

  const message = req.session.message || null;
  req.session.message = null;

  res.render("home", { user, message, projectCount });
}

module.exports = { getHome };
