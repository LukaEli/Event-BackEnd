import { Router } from "express";
import { DB } from "../connect.js";
import {
  validateUserId,
  validateUserInput,
  checkUserExists,
} from "../middleware/index.js";

const router = Router();

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

router.get("/:id", validateUserId, checkUserExists, (req, res) => {
  res.status(200).json(req.user);
});

router.post("/", validateUserInput, (req, res) => {
  const { name, email, password, role } = req.body;
  const sql = `INSERT INTO Users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING id`;

  DB.query(sql, [name, email, password, role || "user"])
    .then((result) => {
      res
        .status(201)
        .json({ status: 201, message: `User ${result.rows[0].id} saved` });
    })
    .catch((err) => {
      return res.status(400).json({ status: 400, error: err.message });
    });
});

// Add DELETE route
router.delete("/:id", isStaff, validateUserId, (req, res) => {
  const userId = req.validatedId;

  const deleteRegistrationsSql = `DELETE FROM EventRegistrations WHERE user_id = $1`;

  DB.query(deleteRegistrationsSql, [userId])
    .then(() => {
      const sql = `DELETE FROM Users WHERE id = $1`;

      return DB.query(sql, [userId]);
    })
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: `User ${userId} deleted successfully` });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

export default router;
