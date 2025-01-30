export const validateUserId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid ID" });
  }
  req.validatedId = id;
  next();
};

export const validateEventId = (req, res, next) => {
  const eventId = parseInt(req.params.id);
  if (isNaN(eventId) || eventId <= 0) {
    return res.status(400).json({ message: "Invalid event ID" });
  }
  req.validatedEventId = eventId;
  next();
};

export const validateUserInput = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  next();
};

export const validateEventInput = (req, res, next) => {
  const { title, created_by } = req.body;
  if (!title || !created_by) {
    return res
      .status(400)
      .json({ error: "Missing required fields: title and created_by" });
  }
  next();
};

export const validateRegistrationInput = (req, res, next) => {
  const { user_id, event_id } = req.body;
  if (!user_id || !event_id) {
    return res.status(400).json({
      error: "Missing required fields: user_id and event_id",
    });
  }
  next();
};

export const validateTokenInput = (req, res, next) => {
  const { user_id, access_token, refresh_token, token_expiry } = req.body;
  if (!user_id || !access_token || !refresh_token || !token_expiry) {
    return res.status(400).json({
      error:
        "Missing required fields: user_id, access_token, refresh_token, token_expiry",
    });
  }
  next();
};

export const isStaff = (req, res, next) => {
  const headerRole = req.headers["x-user-role"];
  const bodyRole = req.body.role;
  const role = headerRole || bodyRole;

  if (!role) {
    return res.status(403).json({
      error: "Access denied. No role provided.",
    });
  }

  if (role !== "staff") {
    return res.status(403).json({
      error: "Access denied. Staff only.",
    });
  }

  next();
};
