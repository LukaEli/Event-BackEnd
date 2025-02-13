import { Router } from "express";
import { DB } from "../connect.js";
import { validateRegistrationInput, isStaff } from "../middleware/index.js";

const router = Router();

router.get("/", (req, res) => {
  const sql = `SELECT * FROM EventRegistrations`;

  DB.query(sql)
    .then((result) => {
      res.status(200).json({ registrations: result.rows });
    })
    .catch((err) => {
      console.error(err.message);
      return res
        .status(500)
        .json({ error: "Failed to retrieve registrations" });
    });
});

router.post("/", validateRegistrationInput, (req, res) => {
  const { user_id, event_id } = req.body;
  const sql = `INSERT INTO EventRegistrations (user_id, event_id) VALUES ($1, $2) RETURNING id`;

  DB.query(sql, [user_id, event_id])
    .then((result) => {
      res.status(201).json({
        message: "Event registration created successfully",
        registrationId: result.rows[0].id,
      });
    })
    .catch((err) => {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: err.message });
      }
      console.error(err.message);
      return res.status(500).json({ error: "Failed to create registration" });
    });
});

router.delete("/:id", isStaff, (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid registration ID" });
  }

  const sql = `DELETE FROM EventRegistrations WHERE id = $1`;

  DB.query(sql, [id])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.status(200).json({
        message: `Registration ${id} deleted successfully`,
      });
    })
    .catch((err) => {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to delete registration" });
    });
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid registration ID" });
  }

  const sql = `SELECT * FROM EventRegistrations WHERE id = $1`;

  DB.query(sql, [id])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.status(200).json(result.rows[0]);
    })
    .catch((err) => {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to retrieve registration" });
    });
});

export default router;
