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
  console.log(req.body);
  const { title, description, location, date, startTime, endTime, created_by } =
    req.body;

  // Check for missing required fields
  if (!title || !created_by) {
    return res.status(400).json({
      error: "Missing required fields: title and created_by",
    });
  }

  const sql = `
    INSERT INTO Events (title, description, location, date,start_time,end_time,created_by)
    VALUES ($1, $2, $3, $4, $5,$6,$7) RETURNING id;
  `;

  DB.query(sql, [
    title,
    description || null,
    location || null,
    date,
    startTime,
    endTime,
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

router.put(
  "/:id",
  validateEventId,
  checkEventExists,
  validateEventInput,
  (req, res) => {
    const eventId = req.validatedEventId;
    const { title, description, location, date, startTime, endTime } = req.body;

    // Check for missing required fields
    if (!title) {
      return res.status(400).json({
        error: "Missing required field: title",
      });
    }

    const sql = `
        UPDATE Events
        SET title = $1, description = $2, location = $3, date = $4, start_time = $5, end_time = $6
        WHERE id = $7 RETURNING *;
    `;

    DB.query(sql, [
      title,
      description || null,
      location || null,
      date,
      startTime,
      endTime,
      eventId,
    ])
      .then((result) => {
        if (result.rowCount === 0) {
          return res.status(404).json({ message: "Event not found" });
        }
        res.status(200).json({
          message: "Event updated successfully",
          event: result.rows[0],
        });
      })
      .catch((err) => {
        console.error("Error updating event:", err);
        return res
          .status(500)
          .json({ error: "Failed to update event", details: err.message });
      });
  }
);

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
