import { Router } from "express";
import { DB } from "../connect.js";
import { validateTokenInput } from "../middleware/index.js";

const router = Router();

router.post("/", validateTokenInput, (req, res) => {
  const { user_id, access_token, refresh_token, token_expiry } = req.body;
  const sql = `
    INSERT OR REPLACE INTO GoogleCalendarTokens 
    (user_id, access_token, refresh_token, token_expiry)
    VALUES (?, ?, ?, ?)
  `;

  DB.run(
    sql,
    [user_id, access_token, refresh_token, token_expiry],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Failed to save token" });
      }
      res.status(200).json({ message: "Token saved successfully" });
    }
  );
});

router.get("/:userId", (req, res) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const sql = `SELECT * FROM GoogleCalendarTokens WHERE user_id = ?`;
  DB.get(sql, [userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ message: "Token not found for user" });
    }
    res.status(200).json(row);
  });
});

export default router;
