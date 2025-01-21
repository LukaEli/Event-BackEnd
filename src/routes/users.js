import { Router } from "express";
import { DB } from "../connect.js";
import {
  validateUserId,
  validateUserInput,
  checkUserExists,
} from "../middleware/index.js";

const router = Router();

// Add this middleware to check if user is staff
const isStaff = (req, res, next) => {
  const { role } = req.body;
  if (role !== "staff") {
    return res.status(403).json({
      error: "Access denied. Staff only.",
    });
  }
  next();
};

router.get("/", (req, res) => {
  const sql = "SELECT * FROM Users";

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

router.get("/:id", validateUserId, checkUserExists, (req, res) => {
  res.status(200).json(req.user);
});

router.post("/", validateUserInput, (req, res) => {
  const { name, email, password, role } = req.body;
  const sql = `INSERT INTO Users(name, email, password, role) VALUES(?, ?, ?, ?)`;

  DB.run(sql, [name, email, password, role || "user"], function (err) {
    if (err) {
      return res.status(400).json({ status: 400, error: err.message });
    }
    res.status(201).json({ status: 201, message: `User ${this.lastID} saved` });
  });
});

// Add DELETE route
router.delete("/:id", isStaff, validateUserId, (req, res) => {
  const sql = `DELETE FROM Users WHERE id = ?`;

  DB.run(sql, [req.validatedId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: `User ${req.validatedId} deleted successfully` });
  });
});

export default router;
