const prisma = require("../lib/prisma");
const { getProjectAccess, parseId } = require("../lib/projectAccess");

function validateThreadInput(body) {
  const title = (body.title || "").trim();
  const description = (body.description || "").trim();
  const errors = [];
  if (!title) errors.push("Basliq teleb olunur.");
  if (title.length > 200) errors.push("Basliq 200 simvoldan uzun ola bilmez.");
  if (description.length > 5000) errors.push("Tesvir 5000 simvoldan uzun ola bilmez.");
  return { errors, data: { title, description } };
}

async function newGet(req, res) {
  const projectId = parseId(req.params.projectId);
  if (projectId === null) return res.status(400).send("Invalid project id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");
  if (!access.isProjectAdmin) {
    return res.status(403).send("Yalniz layihe adminleri thread yarada biler.");
  }

  res.render("threads/new", {
    project: access.project,
    error: null,
    form: {},
  });
}

async function newPost(req, res) {
  const projectId = parseId(req.params.projectId);
  if (projectId === null) return res.status(400).send("Invalid project id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");
  if (!access.isProjectAdmin) {
    return res.status(403).send("Yalniz layihe adminleri thread yarada biler.");
  }

  const { errors, data } = validateThreadInput(req.body);
  if (errors.length) {
    return res.render("threads/new", {
      project: access.project,
      error: errors.join(" "),
      form: data,
    });
  }

  const thread = await prisma.thread.create({
    data: {
      projectId,
      createdById: req.session.userId,
      title: data.title,
      description: data.description || null,
    },
  });

  res.redirect(`/projects/${projectId}/threads/${thread.id}`);
}

async function showOne(req, res) {
  const projectId = parseId(req.params.projectId);
  const id = parseId(req.params.id);
  if (projectId === null || id === null) return res.status(400).send("Invalid id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, kullaniciAdi: true, ad: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          createdBy: { select: { id: true, kullaniciAdi: true, ad: true } },
        },
      },
    },
  });
  if (!thread || thread.projectId !== projectId) {
    return res.status(404).send("Thread not found");
  }

  res.render("threads/show", {
    project: access.project,
    thread,
    isProjectAdmin: access.isProjectAdmin,
    currentUserId: req.session.userId,
  });
}

async function editGet(req, res) {
  const projectId = parseId(req.params.projectId);
  const id = parseId(req.params.id);
  if (projectId === null || id === null) return res.status(400).send("Invalid id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");
  if (!access.isProjectAdmin) {
    return res.status(403).send("Yalniz layihe adminleri threadi redakte ede biler.");
  }

  const thread = await prisma.thread.findUnique({ where: { id } });
  if (!thread || thread.projectId !== projectId) {
    return res.status(404).send("Thread not found");
  }

  res.render("threads/edit", {
    project: access.project,
    thread,
    error: null,
  });
}

async function editPost(req, res) {
  const projectId = parseId(req.params.projectId);
  const id = parseId(req.params.id);
  if (projectId === null || id === null) return res.status(400).send("Invalid id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");
  if (!access.isProjectAdmin) {
    return res.status(403).send("Yalniz layihe adminleri threadi redakte ede biler.");
  }

  const thread = await prisma.thread.findUnique({ where: { id } });
  if (!thread || thread.projectId !== projectId) {
    return res.status(404).send("Thread not found");
  }

  const { errors, data } = validateThreadInput(req.body);
  if (errors.length) {
    return res.render("threads/edit", {
      project: access.project,
      thread: { ...thread, title: data.title, description: data.description },
      error: errors.join(" "),
    });
  }

  await prisma.thread.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
    },
  });

  res.redirect(`/projects/${projectId}/threads/${id}`);
}

async function destroy(req, res) {
  const projectId = parseId(req.params.projectId);
  const id = parseId(req.params.id);
  if (projectId === null || id === null) return res.status(400).send("Invalid id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");
  if (!access.isProjectAdmin) {
    return res.status(403).send("Yalniz layihe adminleri threadi sile biler.");
  }

  const thread = await prisma.thread.findUnique({ where: { id } });
  if (!thread || thread.projectId !== projectId) {
    return res.status(404).send("Thread not found");
  }

  await prisma.thread.delete({ where: { id } });

  res.redirect(`/projects/${projectId}`);
}

module.exports = { newGet, newPost, showOne, editGet, editPost, destroy };
