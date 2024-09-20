const express = require("express");
const userController = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/forgot-password", userController.forgotPassword);
router.get("/reset-password", userController.resetPassword);
router.post("/reset-password", userController.handlePasswordReset);
router.patch("/deactivate", authMiddleware, userController.deactivateUser);
router.patch("/update", authMiddleware, userController.updateUserDetails);
router.patch("/update-password", authMiddleware, userController.updatePassword);

module.exports = router;
