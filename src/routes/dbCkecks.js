import { DB } from "../connect.js";

export const checkUserExists = (req, res, next) => {
  const id = req.validatedId;
  const sql = "SELECT * FROM Users WHERE id = $1";

  DB.query(sql, [id])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: `User ${id} not found` });
      }
      req.user = result.rows[0];
      next();
    })
    .catch((err) => {
      return next(err);
    });
};

export const checkEventExists = (req, res, next) => {
  const id = req.validatedEventId;
  const sql = "SELECT * FROM Events WHERE id = $1";

  DB.query(sql, [id])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: `Event ${id} not found` });
      }
      req.event = result.rows[0];
      next();
    })
    .catch((err) => {
      return next(err);
    });
};
