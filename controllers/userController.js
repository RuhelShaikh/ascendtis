const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db"); // MySQL connection
const sendEmail = require("../utils/sendEmail"); // Email utility
require("dotenv").config();

// Register User Controller
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  // Check if all required fields are provided
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if username or email is already in use
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if the user exists by email
    const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = user[0]; // Get the first user

    // 2. Verify the password
    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: userData.id, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Return token and user info
    res.json({
      token,
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deactivateUser = async (req, res) => {
  const { id } = req.user; // Assuming user ID is extracted from the JWT

  try {
    // Mark the user account as deactivated in the database
    await pool.query("UPDATE users SET is_active = 0 WHERE id = ?", [id]);

    res.status(200).json({ message: "User account deactivated successfully" });
  } catch (error) {
    console.error("Account deactivation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserDetails = async (req, res) => {
  const { id } = req.user; // User ID from the JWT
  const { username, email } = req.body;

  try {
    // Check if all required fields are provided
    if (!username && !email) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Prepare the update query and values
    const updateFields = [];
    const updateValues = [];
    if (username) {
      updateFields.push("username = ?");
      updateValues.push(username);
    }
    if (email) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    updateValues.push(id);
    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;

    // Execute the update query
    await pool.query(query, updateValues);

    res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    console.error("Update user details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePassword = async (req, res) => {
  const { id } = req.user; // User ID from the JWT
  const { oldPassword, newPassword } = req.body;

  try {
    // Check if old and new passwords are provided
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old and new passwords are required" });
    }

    // Fetch the current hashed password from the database
    const [user] = await pool.query("SELECT password FROM users WHERE id = ?", [
      id,
    ]);
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentHashedPassword = user[0].password;

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, currentHashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedNewPassword,
      id,
    ]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password Controller
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }

    const userData = rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the reset token and store it in the database
    const hashedToken = await bcrypt.hash(resetToken, 10);
    await pool.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [
        hashedToken,
        Date.now() + 3600000, // Token valid for 1 hour
        userData.id,
      ]
    );

    // Create a reset link
    const resetLink = `${process.env.CLIENT_URL}/api/users/reset-password?token=${resetToken}&id=${userData.id}`;

    // Prepare email options
    const emailOptions = {
      email: email,
      subject: "Password Reset Request",
      message: `Hello ${userData.username},\n\nPlease use the following link to reset your password: ${resetLink}\n\nIf you did not request this, please ignore this email.\n\nThank you.`,
    };

    // Send reset password email
    await sendEmail(emailOptions);

    return res
      .status(200)
      .json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password Controller
const resetPassword = async (req, res) => {
  const { token, id } = req.query;

  try {
    // Get user data based on ID
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userData = rows[0];

    // Verify the token using bcrypt.compare
    const isTokenValid = await bcrypt.compare(token, userData.reset_token);
    if (!isTokenValid || userData.reset_token_expires < Date.now()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    res.send(
      `<form action="/api/users/reset-password" method="POST">
        <input type="hidden" name="id" value="${id}">
        <input type="hidden" name="token" value="${token}">
        New Password: <input type="password" name="password" required>
        <button type="submit">Reset Password</button>
      </form>`
    );
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const handlePasswordReset = async (req, res) => {
  const { id, token, password } = req.body;

  console.log("ID from form:", id);

  try {
    // Check if the ID exists in the database
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userData = rows[0];

    // Verify the token using bcrypt.compare
    const isTokenValid = await bcrypt.compare(token, userData.reset_token);
    if (!isTokenValid || userData.reset_token_expires < Date.now()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash the new password and update it
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hashedPassword, id]
    );

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Handle password reset error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  deactivateUser,
  updateUserDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  handlePasswordReset,
};
