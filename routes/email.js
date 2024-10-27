// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const fs = require("fs");
// // Middleware to check authentication
// function isAuthenticated(req, res, next) {
//   if (req.cookies.auth) {
//     return next();
//   }
//   res.redirect("/signin");
// }

// // Configure multer for file uploads
// const upload = multer({ dest: "uploads/" });

// // Inbox Page with Pagination
// router.get("/inbox", isAuthenticated, (req, res) => {
//   const userId = req.cookies.auth;
//   const page = parseInt(req.query.page) || 1;
//   const limit = 5;
//   const offset = (page - 1) * limit;

//   req.connection.query(
//     "SELECT COUNT(*) AS total FROM emails WHERE receiver_id = ? AND receiveDeleted = false",
//     [userId],
//     (err, results) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Database error");
//       }

//       const totalEmails = results[0].total;
//       const totalPages = Math.ceil(totalEmails / limit);

//       req.connection.query(
//         "SELECT emails.*, users.fullname AS sender FROM emails JOIN users ON emails.sender_id = users.id WHERE receiver_id = ? AND receiveDeleted = false ORDER BY emails.created_at DESC LIMIT ? OFFSET ?",
//         [userId, limit, offset],
//         (err, emails) => {
//           if (err) {
//             console.error(err);
//             return res.status(500).send("Database error");
//           }

//           res.render("inbox", {
//             user: { fullname: "User" },
//             emails,
//             currentPage: page,
//             totalPages,
//           });
//         }
//       );
//     }
//   );
// });

// // Compose Page - GET route
// router.get("/compose", isAuthenticated, (req, res) => {
//   req.connection.query(
//     "SELECT * FROM users WHERE id != ?",
//     [req.cookies.auth],
//     (err, users) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Database error");
//       }
//       // Pass success as null for initial load
//       res.render("compose", {
//         user: { fullname: "User" },
//         users,
//         error: null,
//         success: null,
//       });
//     }
//   );
// });

// // Handle sending an email with attachment - POST route
// router.post(
//   "/compose",
//   upload.single("attachment"),
//   isAuthenticated,
//   (req, res) => {
//     const { receiver, subject, body } = req.body;
//     const senderId = req.cookies.auth;
//     const attachment = req.file ? req.file.filename : null;

//     if (!receiver) {
//       req.connection.query(
//         "SELECT * FROM users WHERE id != ?",
//         [senderId],
//         (err, users) => {
//           if (err) {
//             console.error(err);
//             return res.status(500).send("Database error");
//           }
//           res.render("compose", {
//             user: { fullname: "User" },
//             users,
//             error: "Recipient is required.",
//             success: null,
//           });
//         }
//       );
//       return;
//     }

//     req.connection.query(
//       "INSERT INTO emails (sender_id, receiver_id, subject, body, created_at, attachment) VALUES (?, ?, ?, ?, NOW(), ?)",
//       [senderId, receiver, subject, body, attachment],
//       (err) => {
//         if (err) {
//           console.error(err);
//           return res.status(500).send("Database error");
//         }

//         // If email sent successfully, reload the compose page with success message
//         req.connection.query(
//           "SELECT * FROM users WHERE id != ?",
//           [senderId],
//           (err, users) => {
//             if (err) {
//               console.error("Database error:", err);
//               return res.status(500).send("Database error");
//             }
//             res.render("compose", {
//               user: { fullname: "User" },
//               users,
//               error: null,
//               success: "Email sent successfully!",
//             });
//           }
//         );
//       }
//     );
//   }
// );

// // Outbox Page
// router.get("/outbox", isAuthenticated, (req, res) => {
//   const userId = req.cookies.auth;

//   req.connection.query(
//     "SELECT emails.*, users.fullname AS receiver FROM emails JOIN users ON emails.receiver_id = users.id WHERE sender_id = ? AND sendDeleted = false ORDER BY emails.created_at DESC",
//     [userId],
//     (err, emails) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Database error");
//       }
//       res.render("outbox", { user: { fullname: "User" }, emails });
//     }
//   );
// });

// // Email Detail Page
// router.get("/:id", isAuthenticated, (req, res) => {
//   const emailId = req.params.id;
//   req.connection.query(
//     "SELECT emails.*, users.fullname AS sender FROM emails JOIN users ON emails.sender_id = users.id WHERE emails.id = ?",
//     [emailId],
//     (err, emails) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Database error");
//       }
//       if (emails.length === 0) {
//         return res.status(404).send("Email not found");
//       }
//       res.render("detail", { email: emails[0] });
//     }
//   );
// });

// // API to delete selected emails for the user
// router.post("/api/delete-emails", isAuthenticated, (req, res) => {
//   const userId = req.cookies.auth;
//   const { emailIds } = req.body;

//   if (!Array.isArray(emailIds) || emailIds.length === 0) {
//     return res
//       .status(400)
//       .json({ message: "No emails selected for deletion." });
//   }

//   // Use a single query to update the sendDeleted or receiveDeleted field
//   const placeholders = emailIds.map(() => "?").join(",");
//   const query = `UPDATE emails
//     SET sendDeleted = CASE WHEN sender_id = ? THEN true ELSE sendDeleted END,
//         receiveDeleted = CASE WHEN receiver_id = ? THEN true ELSE receiveDeleted END
//     WHERE id IN (${placeholders})`;
//   req.connection.query(query, [userId, userId, ...emailIds], (err) => {
//     if (err) {
//       console.error("Database error during email deletion:", err);
//       return res.status(500).json({ message: "Failed to delete emails." });
//     }
//     res.status(200).json({ message: "Emails marked as deleted." });
//   });
// });

// // Download Attachment without using `path`
// router.get("/download/:filename", (req, res) => {
//   const filePath = __dirname + "/../uploads/" + req.params.filename;
//   res.download(filePath);
// });
// module.exports = router;
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.cookies.auth) {
    return next();
  }
  res.redirect("/signin");
}

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Inbox Page with Pagination
router.get("/inbox", isAuthenticated, (req, res) => {
  const userId = req.cookies.auth;
  const page = Math.max(parseInt(req.query.page) || 1, 1); // Ensure page is at least 1
  const limit = 5;
  const offset = (page - 1) * limit;

  req.connection.query(
    "SELECT COUNT(*) AS total FROM emails WHERE receiver_id = ? AND receiveDeleted = false",
    [userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }

      const totalEmails = results[0].total;
      const totalPages = Math.ceil(totalEmails / limit);

      req.connection.query(
        `SELECT emails.*, 
                users.fullname AS sender, 
                CASE 
                  WHEN emails.subject = '' THEN '(no subject)' 
                  ELSE emails.subject 
                END AS display_subject 
         FROM emails 
         JOIN users ON emails.sender_id = users.id 
         WHERE receiver_id = ? AND receiveDeleted = false 
         ORDER BY emails.created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, emails) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Database error");
          }

          res.render("inbox", {
            user: { fullname: "User" },
            emails,
            currentPage: page,
            totalPages,
          });
        }
      );
    }
  );
});

// Compose Page - GET route
router.get("/compose", isAuthenticated, (req, res) => {
  req.connection.query(
    "SELECT * FROM users WHERE id != ?",
    [req.cookies.auth],
    (err, users) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }
      res.render("compose", {
        user: { fullname: "User" },
        users,
        error: null,
        success: null,
      });
    }
  );
});

// Compose Page - POST route
router.post(
  "/compose",
  isAuthenticated,
  upload.single("attachment"), // Middleware to handle file upload
  (req, res) => {
    const { receiver, subject, body } = req.body;
    const senderId = req.cookies.auth;
    const attachment = req.file ? req.file.filename : null; // Get filename if file exists

    if (!receiver) {
      // If receiver is not selected, reload page with error
      return req.connection.query(
        "SELECT * FROM users WHERE id != ?",
        [senderId],
        (err, users) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Database error");
          }
          res.render("compose", {
            user: { fullname: "User" },
            users,
            error: "Recipient is required.",
            success: null,
          });
        }
      );
    }

    // Insert email with attachment (if provided) into database
    req.connection.query(
      "INSERT INTO emails (sender_id, receiver_id, subject, body, created_at, attachment) VALUES (?, ?, ?, ?, NOW(), ?)",
      [senderId, receiver, subject, body, attachment],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Database error");
        }

        // If email sent successfully, reload the compose page with success message
        req.connection.query(
          "SELECT * FROM users WHERE id != ?",
          [senderId],
          (err, users) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).send("Database error");
            }
            res.render("compose", {
              user: { fullname: "User" },
              users,
              error: null,
              success: "Email sent successfully!",
            });
          }
        );
      }
    );
  }
);

// Outbox Page
router.get("/outbox", isAuthenticated, (req, res) => {
  const userId = req.cookies.auth;

  req.connection.query(
    "SELECT emails.*, users.fullname AS receiver FROM emails JOIN users ON emails.receiver_id = users.id WHERE sender_id = ? AND sendDeleted = false ORDER BY emails.created_at DESC",
    [userId],
    (err, emails) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }
      res.render("outbox", { user: { fullname: "User" }, emails });
    }
  );
});

// Email Detail Page
router.get("/:id", isAuthenticated, (req, res) => {
  const emailId = req.params.id;
  req.connection.query(
    "SELECT emails.*, users.fullname AS sender FROM emails JOIN users ON emails.sender_id = users.id WHERE emails.id = ?",
    [emailId],
    (err, emails) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }
      if (emails.length === 0) {
        return res.status(404).send("Email not found");
      }
      res.render("detail", { email: emails[0] });
    }
  );
});

// Delete Emails API Route
router.post("/delete-emails", isAuthenticated, (req, res) => {
  const { emailIds } = req.body;
  const userId = req.cookies.auth;

  if (!emailIds || emailIds.length === 0) {
    return res.status(400).json({ message: "No emails selected" });
  }

  // Update the `receiveDeleted` column for Inbox or `sendDeleted` for Outbox
  req.connection.query(
    "UPDATE emails SET receiveDeleted = true WHERE id IN (?) AND receiver_id = ?",
    [emailIds, userId],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json({
        message: "Emails deleted successfully",
        deletedIds: emailIds,
      });
    }
  );
});

// Download Attachment with Path Safety (without using `path`)
router.get("/download/:filename", (req, res) => {
  const filename = req.params.filename.replace(/\.\.\//g, ""); // Sanitize filename
  const filePath = __dirname + "/../uploads/" + filename;

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("File not found:", filePath);
      return res.status(404).send("File not found");
    }
    res.download(filePath);
  });
});

module.exports = router;
