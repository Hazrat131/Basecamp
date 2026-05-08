const path = require("path");
const fs = require("fs");
const prisma = require("../lib/prisma");
const { getProjectAccess, parseId } = require("../lib/projectAccess");
const { UPLOAD_ROOT } = require("../lib/uploads");

async function create(req, res) {
  try {
    const projectId = parseId(req.params.projectId);
    if (projectId === null) return res.status(400).send("Invalid project id");

    const access = await getProjectAccess(
      projectId,
      req.session.userId,
      req.session.userRole
    );
    if (!access) return res.status(403).send("Forbidden");

    if (!req.file) {
      return res.redirect(`/projects/${projectId}?attach_error=1`);
    }

    const ext = path.extname(req.file.originalname).replace(".", "").toLowerCase();

    await prisma.attachment.create({
      data: {
        projectId,
        uploadedById: req.session.userId,
        fileName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        format: ext || "bin",
        sizeBytes: req.file.size,
      },
    });

    res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error("Attachment create error:", err);
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).send("Server error");
  }
}

async function download(req, res) {
  try {
    const projectId = parseId(req.params.projectId);
    const id = parseId(req.params.id);
    if (projectId === null || id === null) return res.status(400).send("Invalid id");

    const access = await getProjectAccess(
      projectId,
      req.session.userId,
      req.session.userRole
    );
    if (!access) return res.status(403).send("Forbidden");

    const att = await prisma.attachment.findUnique({ where: { id } });
    if (!att || att.projectId !== projectId) {
      return res.status(404).send("Attachment not found");
    }

    const filePath = path.join(UPLOAD_ROOT, att.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File missing on disk");
    }

    res.download(filePath, att.fileName);
  } catch (err) {
    console.error("Attachment download error:", err);
    res.status(500).send("Server error");
  }
}

async function destroy(req, res) {
  try {
    const projectId = parseId(req.params.projectId);
    const id = parseId(req.params.id);
    if (projectId === null || id === null) return res.status(400).send("Invalid id");

    const access = await getProjectAccess(
      projectId,
      req.session.userId,
      req.session.userRole
    );
    if (!access) return res.status(403).send("Forbidden");

    const att = await prisma.attachment.findUnique({ where: { id } });
    if (!att || att.projectId !== projectId) {
      return res.status(404).send("Attachment not found");
    }

    const isUploader = att.uploadedById === req.session.userId;
    if (!isUploader && !access.isProjectAdmin) {
      return res.status(403).send("Forbidden");
    }

    await prisma.attachment.delete({ where: { id } });

    const filePath = path.join(UPLOAD_ROOT, att.storedName);
    fs.unlink(filePath, () => {});

    res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error("Attachment delete error:", err);
    res.status(500).send("Server error");
  }
}

module.exports = { create, download, destroy };
