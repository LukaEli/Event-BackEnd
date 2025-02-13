import request from "supertest";
import { app } from "../src/index.js";
import { DB } from "../src/connect.js";
import { jest } from "@jest/globals";

jest.setTimeout(30000);

describe("API Endpoints", () => {
  beforeAll(async () => {
    // Create a test database
    await DB.query("CREATE DATABASE test_db");

    const clearTables = `
      DELETE FROM GoogleCalendarTokens;
      DELETE FROM EventRegistrations;
      DELETE FROM Events;
      DELETE FROM Users;
    `;

    await DB.query(clearTables);
  });

  afterAll(async () => {
    // Drop the test database
    await DB.query("DROP DATABASE test_db");
  });

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
    token_expiry: new Date(Date.now() + 3600000).toISOString(),
  };

  describe("User Endpoints", () => {
    let userId;

    describe("POST /users", () => {
      let previousUserId; // Variable to store the previous user ID

      it("should create a new user", async () => {
        const res = await request(app).post("/users").send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/User \d+ saved/);
        userId = parseInt(res.body.message.match(/User (\d+) saved/)[1]);
      });

      it("should verify user ID is incrementing correctly", async () => {
        const res = await request(app).post("/users").send({
          name: "Another Test User",
          email: "another_test@example.com",
          password: "password123",
          role: "user",
        });

        expect(res.status).toBe(201);
        const newUserId = parseInt(
          res.body.message.match(/User (\d+) saved/)[1]
        );
        expect(newUserId).toBe(userId + 1);
        userId = newUserId;
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
        expect(res.body.error).toContain(
          "duplicate key value violates unique constraint"
        );
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

  describe("Event Endpoints", () => {
    let eventId;

    beforeAll(async () => {
      const userRes = await request(app).post("/users").send({
        name: "Test User",
        email: "test_user@example.com",
        password: "password123",
        role: "user",
      });

      expect(userRes.status).toBe(201);

      const res = await request(app)
        .post("/events")
        .send({
          title: "Test Event",
          description: "Test Description",
          location: "Test Location",
          date: new Date().toISOString(),
          created_by: userRes.body.message.match(/User (\d+) saved/)[1],
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Event created successfully");
      expect(res.body.eventId).toBeDefined();
      eventId = res.body.eventId;
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
    });
  });

  describe("Event Registration Endpoints", () => {
    let registrationId;
    let userId;
    let registrationEventId;

    beforeAll(async () => {
      // Create a user to register for the event
      const userRes = await request(app).post("/users").send({
        name: "Register Test User",
        email: "register_test@example.com",
        password: "password123",
        role: "staff",
      });

      userId = userRes.body.message.match(/User (\d+) saved/)[1];

      // Create a new event for registration
      const eventRes = await request(app).post("/events").send({
        title: "Test Event for Registration",
        description: "Test Description",
        location: "Test Location",
        date: new Date().toISOString(),
        created_by: userId,
      });

      expect(eventRes.status).toBe(201);
      registrationEventId = eventRes.body.eventId;

      const regRes = await request(app).post("/event-registrations").send({
        user_id: userId,
        event_id: registrationEventId,
      });

      expect(regRes.status).toBe(201);
      registrationId = regRes.body.registrationId;
    });

    describe("DELETE /users/:id", () => {
      it("should delete user and their registrations", async () => {
        const res = await request(app)
          .delete(`/users/${userId}`)
          .send({ role: "staff" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe(`User ${userId} deleted successfully`);

        const regCheckRes = await request(app).get(
          `/event-registrations/${registrationId}`
        );

        expect(regCheckRes.status).toBe(404);
        expect(regCheckRes.body.message).toBe("Registration not found");
      });
    });
  });
});
