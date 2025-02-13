import { Router } from "express";
import { DB } from "../connect.js";
import { validateTokenInput } from "../middleware/index.js";

const router = Router();

router.post("/", validateTokenInput, (req, res) => {
  const { user_id, access_token, refresh_token, token_expiry } = req.body;
  const sql = `
    INSERT INTO GoogleCalendarTokens 
    (user_id, access_token, refresh_token, token_expiry)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id) DO UPDATE SET 
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expiry = EXCLUDED.token_expiry
    RETURNING id;
  `;

  DB.query(sql, [user_id, access_token, refresh_token, token_expiry])
    .then((result) => {
      res.status(200).json({
        message: "Token saved successfully",
        tokenId: result.rows[0].id,
      });
    })
    .catch((err) => {
      console.error("Error saving token:", err.message);
      return res
        .status(500)
        .json({ error: "Failed to save token", details: err.message });
    });
});

router.get("/:userId", (req, res) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const sql = `SELECT * FROM GoogleCalendarTokens WHERE user_id = $1`;
  DB.query(sql, [userId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Token not found for user" });
      }
      res.status(200).json(result.rows[0]);
    })
    .catch((err) => {
      console.error(err.message);
      return res.status(500).json({ error: "Database error" });
    });
});

export default router;
