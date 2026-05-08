const express = require("express");
const router = express.Router();

const requireAuth = require("../middlewares/authMiddleWare");
const projectsController = require("../controllers/projectsController");
const attachmentController = require("../controllers/attachmentController");
const threadController = require("../controllers/threadController");
const messageController = require("../controllers/messageController");
const memberController = require("../controllers/memberController");
const { upload } = require("../lib/uploads");

router.get("/", requireAuth, projectsController.index);
router.get("/new", requireAuth, projectsController.newGet);
router.post("/new", requireAuth, projectsController.newPost);
router.get("/:id", requireAuth, projectsController.showOne);
router.get("/:id/edit", requireAuth, projectsController.editGet);
router.post("/:id/edit", requireAuth, projectsController.editPost);
router.post("/:id/delete", requireAuth, projectsController.deleteOne);

router.post("/:projectId/members/add", requireAuth, memberController.add);
router.post("/:projectId/members/:userId/remove", requireAuth, memberController.remove);

router.post(
  "/:projectId/attachments",
  requireAuth,
  upload.single("file"),
  attachmentController.create
);
router.get(
  "/:projectId/attachments/:id/download",
  requireAuth,
  attachmentController.download
);
router.post(
  "/:projectId/attachments/:id/delete",
  requireAuth,
  attachmentController.destroy
);

router.get("/:projectId/threads/new", requireAuth, threadController.newGet);
router.post("/:projectId/threads/new", requireAuth, threadController.newPost);
router.get("/:projectId/threads/:id", requireAuth, threadController.showOne);
router.get("/:projectId/threads/:id/edit", requireAuth, threadController.editGet);
router.post("/:projectId/threads/:id/edit", requireAuth, threadController.editPost);
router.post("/:projectId/threads/:id/delete", requireAuth, threadController.destroy);

router.get(
  "/:projectId/threads/:threadId/messages/new",
  requireAuth,
  messageController.newGet
);
router.post(
  "/:projectId/threads/:threadId/messages/new",
  requireAuth,
  messageController.newPost
);
router.get(
  "/:projectId/threads/:threadId/messages/:id/edit",
  requireAuth,
  messageController.editGet
);
router.post(
  "/:projectId/threads/:threadId/messages/:id/edit",
  requireAuth,
  messageController.editPost
);
router.post(
  "/:projectId/threads/:threadId/messages/:id/delete",
  requireAuth,
  messageController.destroy
);

module.exports = router;
