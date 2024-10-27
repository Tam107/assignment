const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("sign_in", { error: null, message: null });
});

// Handle Sign-in
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.render("sign_in", {
      error: "All fields are required.",
      message: null,
    });
  }

  // Authenticate user
  req.connection.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }
      if (results.length > 0) {
        res.cookie("auth", results[0].id, { httpOnly: true });
        return res.redirect("/email/inbox");
      }
      res.render("sign_in", {
        error: "Invalid credentials!",
        message: null,
      });
    }
  );
});

// Sign-up Page
router.get("/signup", (req, res) => {
  res.render("sign_up", { error: null });
});

// Handle Sign-up
router.post("/signup", (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;

  // Validate input
  if (!fullname || !email || !password || !confirmPassword) {
    return res.render("sign_up", { error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.render("sign_up", {
      error: "Password must be at least 6 characters long.",
    });
  }
  if (password !== confirmPassword) {
    return res.render("sign_up", { error: "Passwords do not match." });
  }

  // Check if email exists
  req.connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, existingUser) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }
      if (existingUser.length > 0) {
        return res.render("sign_up", { error: "Email already in use." });
      }

      // Register new user
      req.connection.query(
        "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)",
        [fullname, email, password],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Database error");
          }
          res.render("sign_in", {
            message: "Registration successful! Please log in.",
            error: null,
          });
        }
      );
    }
  );
});

// Logout
router.get("/logout", (req, res) => {
  res.clearCookie("auth");
  res.redirect("/");
});

module.exports = router;
