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
        return res.status(200).json({
          message: `User with ID ${userId} was removed from the list`,
        });
      } else {
        return res
          .status(404)
          .json({ message: `User with ID ${userId} not found` });
      }
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/events", (req, res) => {
  const sql = `SELECT * FROM Events`;
  DB.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ events: rows });
  });
});

app.get("/events/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  const sql = "SELECT * FROM Events WHERE id = ?";
  DB.get(sql, [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: `Event ${id} not found` });
    }

    res.status(200).json({
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      date: row.date,
      created_by: row.created_by,
    });
  });
});

app.post("/events", (req, res) => {
  const { title, description, location, created_by } = req.body;

  if (!title || !created_by) {
    return res
      .status(400)
      .json({ error: "Missing required fields: title and created_by" });
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

app.delete("/events/:id", (req, res) => {
  const eventId = parseInt(req.params.id);
  const { user_id, role } = req.body;

  if (isNaN(eventId) || eventId <= 0 || !user_id || !role) {
    return res
      .status(400)
      .json({ error: "Invalid event ID or missing user information" });
  }

  const selectSql = "SELECT * FROM Events WHERE id = ?";
  DB.get(selectSql, [eventId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ message: `Event ${eventId} not found` });
    }

    if (role === "staff" || row.created_by === user_id) {
      const deleteSql = "DELETE FROM Events WHERE id = ?";
      DB.run(deleteSql, [eventId], function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: "Failed to delete event" });
        }

        res
          .status(200)
          .json({ message: `Event ${eventId} deleted successfully` });
      });
    } else {
      res
        .status(403)
        .json({ message: "You do not have permission to delete this event" });
    }
  });
});

app.put("/events/:id", (req, res) => {
  const eventId = parseInt(req.params.id);
  const { title, description, location, date, user_id, role } = req.body;

  if (isNaN(eventId) || eventId <= 0 || !user_id || !role) {
    return res
      .status(400)
      .json({ error: "Invalid event ID or missing user information" });
  }

  const selectSql = "SELECT * FROM Events WHERE id = ?";
  DB.get(selectSql, [eventId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ message: `Event ${eventId} not found` });
    }

    if (role === "staff" || row.created_by === user_id) {
      const updateSql = `
        UPDATE Events
        SET title = ?, description = ?, location = ?, date = ?
        WHERE id = ?
      `;

      DB.run(
        updateSql,
        [
          title || row.title,
          description || row.description,
          location || row.location,
          date || row.date,
          eventId,
        ],
        function (err) {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Failed to update event" });
          }

          res
            .status(200)
            .json({ message: `Event ${eventId} updated successfully` });
        }
      );
    } else {
      res
        .status(403)
        .json({ message: "You do not have permission to update this event" });
    }
  });
});

// Retrieve all event registrations
app.get("/event-registrations", (req, res) => {
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

// Retrieve a specific event registration by ID
app.get("/event-registrations/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const sql = "SELECT * FROM EventRegistrations WHERE id = ?";
  DB.get(sql, [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to retrieve registration" });
    }
    if (!row) {
      return res.status(404).json({ message: `Registration ${id} not found` });
    }
    res.status(200).json(row);
  });
});

// Create a new event registration
app.post("/event-registrations", (req, res) => {
  const { user_id, event_id } = req.body;

  if (!user_id || !event_id) {
    return res
      .status(400)
      .json({ error: "Missing required fields: user_id and event_id" });
  }

  const sql = `
    INSERT INTO EventRegistrations (user_id, event_id)
    VALUES (?, ?)
  `;
  DB.run(sql, [user_id, event_id], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({
      message: "Event registration created successfully",
      registrationId: this.lastID,
    });
  });
});

// Delete a specific event registration by ID
app.delete("/event-registrations/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid registration ID" });
  }

  const sql = `DELETE FROM EventRegistrations WHERE id = ?`;
  DB.run(sql, [id], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Failed to delete registration" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: `Registration ${id} not found` });
    }

    res
      .status(200)
      .json({ message: `Registration ${id} deleted successfully` });
  });
});

// Retrieve all registrations for a specific event
app.get("/event-registrations/event/:eventId", (req, res) => {
  const eventId = parseInt(req.params.eventId);

  if (isNaN(eventId) || eventId <= 0) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  const sql = `SELECT * FROM EventRegistrations WHERE event_id = ?`;
  DB.all(sql, [eventId], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res
        .status(500)
        .json({ error: "Failed to retrieve registrations for event" });
    }
    res.status(200).json({ registrations: rows });
  });
});

app.listen(3000, (err) => {
  if (err) {
    console.error("ERROR:", err.message);
  } else {
    console.log("LISTENING on port: 3000");
  }
});
