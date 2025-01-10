import { DB } from "./connect.js";
import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.status(200).send("Backend service is online");
});

app.get("/users", (req, res) => {
  const sql = `SELECT * FROM Users`;
  let data = { Users: [] };

  DB.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: err.message });
    }
    rows.forEach((row) => {
      data.Users.push({
        id: row.id,
        name: row.name,
        email: row.email,
        password: row.password,
        role: row.role,
        created_at: row.created_at,
      });
    });
    res.status(200).json(data);
  });
});

app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const sql = "SELECT * FROM Users WHERE id = ?";

  DB.get(sql, [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: `User ${id} not found` });
    }
    res.status(200).json({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role,
      created_at: row.created_at,
    });
  });
});

app.put("/users/:id", (req, res) => {
  const { name, email, password, role } = req.body;
  const id = parseInt(req.params.id);
  const sql = `UPDATE Users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?`;

  DB.run(sql, [name, email, password, role, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 1) {
      res.status(200).json({ message: `User ${id} updated successfully` });
    } else {
      res.status(404).json({ message: `User ${id} not found` });
    }
  });
});

app.post("/users", (req, res) => {
  res.set("Content-Type", "application/json");

  const sql = `INSERT INTO Users(name, email, password, role) VALUES(?, ?, ?, ?)`;
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ status: 400, error: "Missing required fields" });
  }

  DB.run(sql, [name, email, password, role || "user"], function (err) {
    if (err) {
      return res.status(400).json({ status: 400, error: err.message });
    }
    res.status(201).json({ status: 201, message: `User ${this.lastID} saved` });
  });
});

app.delete("/users", (req, res) => {
  res.set("Content-Type", "application/json");

  // Validate the 'id' query parameter
  const userId = req.query.id;
  if (!userId) {
    return res.status(400).json({ message: "Missing 'id' query parameter" });
  }

  const sql = `DELETE FROM Users WHERE id = ?`;

  try {
    DB.run(sql, [userId], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 1) {
        // One item was deleted
        return res.status(200).json({
          message: `User with ID ${userId} was removed from the list`,
        });
      } else {
        // No rows were deleted
        return res
          .status(404)
          .json({ message: `User with ID ${userId} not found` });
      }
    });
  } catch (err) {
    // Catch any unexpected errors
    console.error(err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, (err) => {
  if (err) {
    console.error("ERROR:", err.message);
  } else {
    console.log("LISTENING on port: 3000");
  }
});
