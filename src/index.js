import express from "express";
import bodyParser from "body-parser";
import userRoutes from "./routes/users.js";
import eventRoutes from "./routes/events.js";
import registrationRoutes from "./routes/registrations.js";
import tokenRoutes from "./routes/tokens.js";
import cors from "cors";
import { testConnection } from "./connect.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Add CORS for frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Events API",
    version: "1.0.0",
    endpoints: {
      users: {
        GET: "/users - Get all users",
        POST: "/users - Create a new user",
        GET_ONE: "/users/:id - Get user by ID",
        DELETE: "/users/:id - Delete user (Staff only)",
      },
      events: {
        GET: "/events - Get all events",
        POST: "/events - Create a new event",
        GET_ONE: "/events/:id - Get event by ID",
        DELETE: "/events/:id - Delete event (Staff only)",
      },
      registrations: {
        GET: "/event-registrations - Get all registrations",
        POST: "/event-registrations - Register for an event",
        DELETE: "/event-registrations/:id - Delete registration (Staff only)",
      },
      tokens: {
        GET: "/tokens/:userId - Get user's token",
        POST: "/tokens - Save/update token",
      },
    },
  });
});

// Routes
app.use("/users", userRoutes);
app.use("/events", eventRoutes);
app.use("/event-registrations", registrationRoutes);
app.use("/tokens", tokenRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: `Cannot ${req.method} ${req.url}`,
    error: "Not Found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log("Press Ctrl+C to quit.");

  // Test database connection
  await testConnection();
});

export { app };
