const prisma = require("../lib/prisma");
const { getProjectAccess, parseId } = require("../lib/projectAccess");

function validateProjectInput(body) {
  const title = (body.title || "").trim();
  const description = (body.description || "").trim();
  const errors = [];
  if (!title) errors.push("Basliq teleb olunur.");
  if (title.length > 200) errors.push("Basliq 200 simvoldan uzun ola bilmez.");
  if (description.length > 5000)
    errors.push("Tesvir 5000 simvoldan uzun ola bilmez.");
  return { errors, data: { title, description } };
}

async function index(req, res) {
  const userId = req.session.userId;

  const owned = await prisma.project.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
  });

  const memberOf = await prisma.project.findMany({
    where: {
      members: { some: { userId } },
      NOT: { createdById: userId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, kullaniciAdi: true, ad: true } },
    },
  });

  res.render("projects/index", { projects: owned, memberOf });
}

async function adminProjectView(req, res) {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, kullaniciAdi: true, ad: true } } },
  });
  res.render("admin/projects", { projects });
}

function newGet(req, res) {
  res.render("projects/new", { error: null, form: {} });
}

async function newPost(req, res) {
  const { errors, data } = validateProjectInput(req.body);
  if (errors.length) {
    return res.render("projects/new", { error: errors.join(" "), form: data });
  }
  await prisma.project.create({
    data: {
      title: data.title,
      description: data.description || null,
      createdById: req.session.userId,
    },
  });
  res.redirect("/projects");
}

async function showOne(req, res) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).send("Invalid id");

    const access = await getProjectAccess(
      id,
      req.session.userId,
      req.session.userRole
    );
    if (!access) {
      const exists = await prisma.project.findUnique({ where: { id } });
      if (!exists) return res.status(404).send("Project not found");
      return res.status(403).send("Forbidden");
    }

    const [attachments, threads] = await Promise.all([
      prisma.attachment.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, kullaniciAdi: true, ad: true } },
        },
      }),
      prisma.thread.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, kullaniciAdi: true, ad: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    res.render("projects/show", {
      project: access.project,
      attachments,
      threads,
      isProjectAdmin: access.isProjectAdmin,
      currentUserId: req.session.userId,
      memberError: req.query.member_error || null,
      attachError: req.query.attach_error ? "Fayl yuklenemedi. Format ve olcunu yoxlayin." : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

async function editGet(req, res) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).send("Invalid id");

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).send("Project not found");

    if (
      project.createdById !== req.session.userId &&
      req.session.userRole !== "admin"
    ) {
      return res.status(403).send("Forbidden");
    }

    res.render("projects/edit", { project, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

async function editPost(req, res) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).send("Invalid id");

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).send("Project not found");

    if (
      project.createdById !== req.session.userId &&
      req.session.userRole !== "admin"
    ) {
      return res.status(403).send("Forbidden");
    }

    const { errors, data } = validateProjectInput(req.body);
    if (errors.length) {
      return res.render("projects/edit", {
        project: { ...project, title: data.title, description: data.description },
        error: errors.join(" "),
      });
    }

    await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
      },
    });

    if (req.session.userRole === "admin" && project.createdById !== req.session.userId) {
      return res.redirect("/admin/projects");
    }
    res.redirect("/projects/" + id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

async function deleteOne(req, res) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).send("Invalid id");

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).send("Project not found");

    if (
      project.createdById !== req.session.userId &&
      req.session.userRole !== "admin"
    ) {
      return res.status(403).send("Forbidden");
    }

    await prisma.project.delete({ where: { id } });

    if (req.session.userRole === "admin" && project.createdById !== req.session.userId) {
      return res.redirect("/admin/projects");
    }
    res.redirect("/projects");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

module.exports = {
  index,
  adminProjectView,
  newGet,
  newPost,
  showOne,
  editGet,
  editPost,
  deleteOne,
};
