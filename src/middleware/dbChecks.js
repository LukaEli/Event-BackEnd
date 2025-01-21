import { DB } from "../connect.js";

export const checkUserExists = (req, res, next) => {
  const id = req.validatedId;
  const sql = "SELECT * FROM Users WHERE id = ?";

  DB.get(sql, [id], (err, row) => {
    if (err) {
      return next(err);
    }
    if (!row) {
      return res.status(404).json({ message: `User ${id} not found` });
    }
    req.user = row;
    next();
  });
};

export const checkEventExists = (req, res, next) => {
  const id = req.validatedEventId;
  const sql = "SELECT * FROM Events WHERE id = ?";

  DB.get(sql, [id], (err, row) => {
    if (err) {
      return next(err);
    }
    if (!row) {
      return res.status(404).json({ message: `Event ${id} not found` });
    }
    req.event = row;
    next();
  });
};
