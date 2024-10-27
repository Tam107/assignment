const express = require("express");
const router = express.Router();

// Inline authentication middleware
function isAuthenticated(req, res, next) {
  if (req.cookies && req.cookies.auth) {
    return next();
  }
  res.redirect("/signin");
}

// Delete selected emails
router.post("/delete-emails", isAuthenticated, (req, res) => {
  const userId = req.cookies.auth;
  const { emailIds } = req.body;

  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res
      .status(400)
      .json({ message: "No emails selected for deletion." });
  }

  const placeholders = emailIds.map(() => "?").join(",");
  const query = `
    UPDATE emails
    SET sendDeleted = CASE WHEN sender_id = ? THEN true ELSE sendDeleted END,
        receiveDeleted = CASE WHEN receiver_id = ? THEN true ELSE receiveDeleted END
    WHERE id IN (${placeholders})
  `;

  req.connection.query(query, [userId, userId, ...emailIds], (err, result) => {
    if (err) {
      console.error("Database error during email deletion:", err);
      return res.status(500).json({ message: "Failed to delete emails." });
    }
    res.status(200).json({ message: "Emails marked as deleted." });
  });
});

module.exports = router;
