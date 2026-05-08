const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/authMiddleWare");
const userController = require("../controllers/userController");
const sessionController = require("../controllers/sessionController");

router.get("/signup", userController.signUpGet);
router.post("/signup", userController.signUpPost);
router.get("/login", sessionController.loginGetOne);
router.post("/login", sessionController.loginPostOne);

router.post("/logout", sessionController.logOut);

router.get("/:id", requireAuth, userController.showUser);
router.post("/:id/delete", requireAuth, userController.deleteUser);

module.exports = router;
