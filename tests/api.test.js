import request from "supertest";
import { app } from "../src/index.js"; // Updated path
import { DB } from "../src/connect.js"; // Updated path
import { jest } from "@jest/globals";

jest.setTimeout(30000);

describe("API Endpoints", () => {
  // Setup database before all tests
  beforeAll((done) => {
    // Clear existing data from tables
    const clearTables = `
      DELETE FROM GoogleCalendarTokens;
      DELETE FROM EventRegistrations;
      DELETE FROM Events;
      DELETE FROM Users;
    `;

    DB.exec(clearTables, (err) => {
      if (err) {
        console.error("Error clearing tables:", err);
        return done(err);
      }
      done();
    });
  });

  // Clean up after all tests
  afterAll((done) => {
    // Clear all test data
    const clearTables = `
      DELETE FROM GoogleCalendarTokens;
      DELETE FROM EventRegistrations;
      DELETE FROM Events;
      DELETE FROM Users;
    `;

    DB.exec(clearTables, (err) => {
      if (err) {
        console.error("Error clearing tables:", err);
      }
      done(err);
    });
  });

  // Test data
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    role: "user",
  };

  const testEvent = {
    title: "Test Event",
    description: "Test Description",
    location: "Test Location",
    date: new Date().toISOString(),
    created_by: 1,
  };

  const testToken = {
    user_id: 1,
    access_token: "test_access_token",
    refresh_token: "test_refresh_token",
    token_expiry: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  };

  // User endpoints tests
  describe("User Endpoints", () => {
    let userId;

    describe("POST /users", () => {
      it("should create a new user", async () => {
        const res = await request(app).post("/users").send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/User \d+ saved/);
        userId = parseInt(res.body.message.match(/User (\d+) saved/)[1]);
      });

      it("should return 400 when required fields are missing", async () => {
        const res = await request(app)
          .post("/users")
          .send({ name: "Incomplete User" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Missing required fields");
      });

      it("should return 400 when email is duplicate", async () => {
        const res = await request(app).post("/users").send(testUser);

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("UNIQUE constraint failed");
      });
    });

    describe("DELETE /users/:id", () => {
      it("should not delete user without staff role", async () => {
        const res = await request(app)
          .delete(`/users/${userId}`)
          .send({ role: "user" });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Access denied. Staff only.");
      });

      it("should delete user as staff", async () => {
        const res = await request(app)
          .delete(`/users/${userId}`)
          .send({ role: "staff" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe(`User ${userId} deleted successfully`);
      });

      it("should return 404 when deleting non-existent user", async () => {
        const res = await request(app)
          .delete(`/users/99999`)
          .send({ role: "staff" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("User not found");
      });
    });
  });

  // Event endpoints tests
  describe("Event Endpoints", () => {
    let eventId;

    describe("POST /events", () => {
      it("should create a new event", async () => {
        const res = await request(app).post("/events").send(testEvent);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Event created successfully");
        expect(res.body.eventId).toBeDefined();
        eventId = res.body.eventId;
      });

      it("should return 400 when required fields are missing", async () => {
        const res = await request(app)
          .post("/events")
          .send({ title: "Incomplete Event" });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(
          "Missing required fields: title and created_by"
        );
      });
    });

    describe("DELETE /events/:id", () => {
      it("should not delete event without staff role", async () => {
        const res = await request(app)
          .delete(`/events/${eventId}`)
          .send({ role: "user" });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Access denied. Staff only.");
      });

      it("should delete event as staff", async () => {
        const res = await request(app)
          .delete(`/events/${eventId}`)
          .send({ role: "staff" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe(`Event ${eventId} deleted successfully`);
      });

      it("should return 404 when deleting non-existent event", async () => {
        const res = await request(app)
          .delete(`/events/99999`)
          .send({ role: "staff" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Event not found");
      });
    });
  });

  // Event Registration endpoints tests
  describe("Event Registration Endpoints", () => {
    let registrationId;

    // Create test user and event before registration tests
    beforeAll(async () => {
      // Create test user
      const userRes = await request(app).post("/users").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      // Create test event
      const eventRes = await request(app).post("/events").send({
        title: "Test Event",
        created_by: 1,
      });

      // Create test registration
      const regRes = await request(app).post("/event-registrations").send({
        user_id: 1,
        event_id: 1,
      });

      registrationId = regRes.body.registrationId;
    });

    describe("DELETE /event-registrations/:id", () => {
      it("should not delete registration without staff role", async () => {
        const res = await request(app)
          .delete(`/event-registrations/${registrationId}`)
          .send({ role: "user" });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Access denied. Staff only.");
      });

      it("should delete registration as staff", async () => {
        const res = await request(app)
          .delete(`/event-registrations/${registrationId}`)
          .send({ role: "staff" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe(
          `Registration ${registrationId} deleted successfully`
        );
      });

      it("should return 404 when deleting non-existent registration", async () => {
        const res = await request(app)
          .delete("/event-registrations/99999")
          .send({ role: "staff" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Registration not found");
      });
    });
  });

  // Google Calendar Token endpoints tests
  describe("Google Calendar Token Endpoints", () => {
    describe("POST /tokens", () => {
      it("should create a new token", async () => {
        const res = await request(app).post("/tokens").send(testToken);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Token saved successfully");
      });

      it("should update existing token", async () => {
        const updatedToken = {
          ...testToken,
          access_token: "new_access_token",
        };

        const res = await request(app).post("/tokens").send(updatedToken);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Token saved successfully");
      });
    });

    describe("GET /tokens/:userId", () => {
      it("should return token for user", async () => {
        const res = await request(app).get(`/tokens/${testToken.user_id}`);

        expect(res.status).toBe(200);
        expect(res.body.access_token).toBeDefined();
        expect(res.body.refresh_token).toBeDefined();
      });

      it("should return 404 for non-existent token", async () => {
        const res = await request(app).get("/tokens/99999");

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Token not found for user");
      });
    });
  });

  describe("Non-existent Endpoints", () => {
    it("should return 404 for undefined routes", async () => {
      const res = await request(app).get("/nonexistent-route");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Not Found");
      expect(res.body.message).toBe("Cannot GET /nonexistent-route");
    });
  });
});
