import { Router } from "express";
import { DB } from "../connect.js";
import { validateRegistrationInput, isStaff } from "../middleware/index.js";

const router = Router();

router.get("/", (req, res) => {
  const sql = `SELECT * FROM EventRegistrations`;
  DB.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res
        .status(500)
        .json({ error: "Failed to retrieve registrations" });
    }
    res.status(200).json({ registrations: rows });
  });
});

router.post("/", validateRegistrationInput, (req, res) => {
  const { user_id, event_id } = req.body;
  const sql = `INSERT INTO EventRegistrations (user_id, event_id) VALUES (?, ?)`;

  DB.run(sql, [user_id, event_id], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: err.message });
      }
      console.error(err.message);
      return res.status(500).json({ error: "Failed to create registration" });
    }
    res.status(201).json({
      message: "Event registration created successfully",
      registrationId: this.lastID,
    });
  });
});

router.delete("/:id", isStaff, (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid registration ID" });
  }

  const sql = `DELETE FROM EventRegistrations WHERE id = ?`;

  DB.run(sql, [id], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to delete registration" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }
    res.status(200).json({
      message: `Registration ${id} deleted successfully`,
    });
  });
});

export default router;
