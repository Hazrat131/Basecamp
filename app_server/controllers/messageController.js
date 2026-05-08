const prisma = require("../lib/prisma");
const { getProjectAccess, parseId } = require("../lib/projectAccess");

function validateMessage(body) {
  const text = (body.body || "").trim();
  const errors = [];
  if (!text) errors.push("Mesaj bos ola bilmez.");
  if (text.length > 5000) errors.push("Mesaj 5000 simvoldan uzun ola bilmez.");
  return { errors, data: { body: text } };
}

async function loadThread(threadId, projectId) {
  const thread = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!thread || thread.projectId !== projectId) return null;
  return thread;
}

async function newGet(req, res) {
  const projectId = parseId(req.params.projectId);
  const threadId = parseId(req.params.threadId);
  if (projectId === null || threadId === null) return res.status(400).send("Invalid id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");

  const thread = await loadThread(threadId, projectId);
  if (!thread) return res.status(404).send("Thread not found");

  res.render("messages/new", {
    project: access.project,
    thread,
    error: null,
    form: {},
  });
}

async function newPost(req, res) {
  const projectId = parseId(req.params.projectId);
  const threadId = parseId(req.params.threadId);
  if (projectId === null || threadId === null) return res.status(400).send("Invalid id");

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");

  const thread = await loadThread(threadId, projectId);
  if (!thread) return res.status(404).send("Thread not found");

  const { errors, data } = validateMessage(req.body);
  if (errors.length) {
    if (req.body._inline === "1") {
      return res.redirect(`/projects/${projectId}/threads/${threadId}?msg_error=1`);
    }
    return res.render("messages/new", {
      project: access.project,
      thread,
      error: errors.join(" "),
      form: data,
    });
  }

  await prisma.message.create({
    data: {
      threadId,
      createdById: req.session.userId,
      body: data.body,
    },
  });

  res.redirect(`/projects/${projectId}/threads/${threadId}`);
}

async function editGet(req, res) {
  const projectId = parseId(req.params.projectId);
  const threadId = parseId(req.params.threadId);
  const id = parseId(req.params.id);
  if (projectId === null || threadId === null || id === null) {
    return res.status(400).send("Invalid id");
  }

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");

  const thread = await loadThread(threadId, projectId);
  if (!thread) return res.status(404).send("Thread not found");

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message || message.threadId !== threadId) {
    return res.status(404).send("Message not found");
  }

  const isOwner = message.createdById === req.session.userId;
  if (!isOwner && !access.isProjectAdmin) {
    return res.status(403).send("Forbidden");
  }

  res.render("messages/edit", {
    project: access.project,
    thread,
    message,
    error: null,
  });
}

async function editPost(req, res) {
  const projectId = parseId(req.params.projectId);
  const threadId = parseId(req.params.threadId);
  const id = parseId(req.params.id);
  if (projectId === null || threadId === null || id === null) {
    return res.status(400).send("Invalid id");
  }

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");

  const thread = await loadThread(threadId, projectId);
  if (!thread) return res.status(404).send("Thread not found");

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message || message.threadId !== threadId) {
    return res.status(404).send("Message not found");
  }

  const isOwner = message.createdById === req.session.userId;
  if (!isOwner && !access.isProjectAdmin) {
    return res.status(403).send("Forbidden");
  }

  const { errors, data } = validateMessage(req.body);
  if (errors.length) {
    return res.render("messages/edit", {
      project: access.project,
      thread,
      message: { ...message, body: data.body },
      error: errors.join(" "),
    });
  }

  await prisma.message.update({
    where: { id },
    data: { body: data.body },
  });

  res.redirect(`/projects/${projectId}/threads/${threadId}`);
}

async function destroy(req, res) {
  const projectId = parseId(req.params.projectId);
  const threadId = parseId(req.params.threadId);
  const id = parseId(req.params.id);
  if (projectId === null || threadId === null || id === null) {
    return res.status(400).send("Invalid id");
  }

  const access = await getProjectAccess(
    projectId,
    req.session.userId,
    req.session.userRole
  );
  if (!access) return res.status(403).send("Forbidden");

  const thread = await loadThread(threadId, projectId);
  if (!thread) return res.status(404).send("Thread not found");

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message || message.threadId !== threadId) {
    return res.status(404).send("Message not found");
  }

  const isOwner = message.createdById === req.session.userId;
  if (!isOwner && !access.isProjectAdmin) {
    return res.status(403).send("Forbidden");
  }

  await prisma.message.delete({ where: { id } });

  res.redirect(`/projects/${projectId}/threads/${threadId}`);
}

module.exports = { newGet, newPost, editGet, editPost, destroy };
