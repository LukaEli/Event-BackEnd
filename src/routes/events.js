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
  const { title, description, location, created_by } = req.body;

  // Check for missing required fields
  if (!title || !created_by) {
    return res.status(400).json({
      error: "Missing required fields: title and created_by",
    });
  }

  const currentDate = new Date().toISOString();

  const sql = `
    INSERT INTO Events (title, description, location, date, created_by)
    VALUES ($1, $2, $3, $4, $5) RETURNING id;
  `;

  DB.query(sql, [
    title,
    description || null,
    location || null,
    currentDate,
    created_by,
  ])
    .then((result) => {
      res.status(201).json({
        message: "Event created successfully",
        eventId: result.rows[0].id,
      });
    })
    .catch((err) => {
      console.error("Error creating event:", err);
      return res
        .status(500)
        .json({ error: "Failed to create event", details: err.message });
    });
});

router.delete("/:id", isStaff, validateEventId, (req, res) => {
  const eventId = req.validatedEventId;

  const deleteRegistrationsSql = `DELETE FROM EventRegistrations WHERE event_id = $1`;

  DB.query(deleteRegistrationsSql, [eventId])
    .then(() => {
      const sql = `DELETE FROM Events WHERE id = $1`;

      return DB.query(sql, [eventId]);
    })
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json({
        message: `Event ${eventId} deleted successfully`,
      });
    })
    .catch((err) => {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    });
});

router.get("/", (req, res) => {
  const sql = "SELECT * FROM Events";

  DB.query(sql)
    .then((result) => {
      res.json({
        message: "success",
        data: result.rows,
      });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

export default router;
