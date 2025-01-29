import { Router } from "express";
import { DB } from "../connect.js";
import {
  validateEventId,
  validateEventInput,
  checkEventExists,
  isStaff,
} from "../middleware/index.js";

const router = Router();

router.get("/:id", validateEventId, checkEventExists, (req, res) => {
  res.status(200).json(req.event);
});

router.post("/", validateEventInput, (req, res) => {
  const { title, description, location, created_by, role } = req.body;

  if (role !== "staff") {
    return res.status(403).json({ error: "Access denied. Staff only." });
  }

  const currentDate = new Date().toISOString();
  const sql = `
    INSERT INTO Events (title, description, location, date, created_by)
    VALUES (?, ?, ?, ?, ?)
  `;

  DB.run(
    sql,
    [title, description || null, location || null, currentDate, created_by],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to create event" });
      }
      res.status(201).json({
        message: "Event created successfully",
        eventId: this.lastID,
      });
    }
  );
});

router.delete("/:id", isStaff, validateEventId, (req, res) => {
  const sql = `DELETE FROM Events WHERE id = ?`;

  DB.run(sql, [req.validatedEventId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json({ message: `Event ${req.validatedEventId} deleted successfully` });
  });
});

router.get("/", (req, res) => {
  const sql = "SELECT * FROM Events";

  DB.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: "success",
      data: rows,
    });
  });
});

export default router;
