const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // MySQL connection
require("dotenv").config();

// Admin Registration Controller
const registerAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    // Check if username already exists
    const [existingAdmin] = await pool.query(
      "SELECT * FROM admins WHERE username = ?",
      [username]
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new admin into the database
    await pool.query("INSERT INTO admins (username, password) VALUES (?, ?)", [
      username,
      hashedPassword,
    ]);

    return res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the admin exists by username
    const [admin] = await pool.query(
      "SELECT * FROM admins WHERE username = ?",
      [username]
    );

    if (admin.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const adminData = admin[0]; // Get the first admin

    // Verify the password
    const isMatch = await bcrypt.compare(password, adminData.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: adminData.id, username: adminData.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      admin: {
        id: adminData.id,
        username: adminData.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, username, email FROM users");

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserDetails = async (req, res) => {
  const userId = req.params.id;
  const { username, email } = req.body;

  try {
    // Update user details
    await pool.query("UPDATE users SET username = ?, email = ? WHERE id = ?", [
      username,
      email,
      userId,
    ]);

    res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    // Delete user from the database
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = { registerAdmin, loginAdmin, getUsers, updateUserDetails, deleteUser };
