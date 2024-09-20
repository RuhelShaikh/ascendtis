const express = require("express");
const adminController = require("../controllers/adminController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);
router.get("/users", adminController.getUsers);
router.patch("/users/:id", adminController.updateUserDetails);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
