const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminMiddleWare = require("../middlewares/adminMiddleWare");
const projectsController = require("../controllers/projectsController");

router.get("/", adminMiddleWare, adminController.dashboard);
router.get("/users", adminMiddleWare, adminController.renderUsers);
router.post("/users/:id/role", adminMiddleWare, adminController.changeUserRole);
router.post("/users/:id/ban", adminMiddleWare, adminController.banUsersPost);
router.get("/projects", adminMiddleWare, projectsController.adminProjectView);

module.exports = router;
