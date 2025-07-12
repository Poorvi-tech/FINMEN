import express from "express";
import {
  getAllStudents,
  getRedemptionRequests,
  approveRedemption,
  rejectRedemption,
  getLeaderboard,
  getAllEducators,
  getPendingEducators,
  approveEducator,
  rejectEducator,
  getAdminStats,
} from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth.js";
import { registerByAdmin } from "../controllers/authController.js";

const router = express.Router();

// 🔒 Protect all admin routes
router.use(requireAuth, requireAdmin);

// 📊 Admin Dashboard Statistics
router.get("/stats", getAdminStats);

// 👩‍🏫 Educator Management
router.get("/educators", getAllEducators);
router.get("/educators/pending", getPendingEducators);
router.put("/educators/approve/:id", approveEducator);
router.put("/educators/reject/:id", rejectEducator);

// 👨‍🎓 Student Management
router.get("/students", getAllStudents);

// 🏆 Leaderboard
router.get("/leaderboard", getLeaderboard);

// 💸 Redemptions
router.get("/redemptions", getRedemptionRequests);
router.put("/redemptions/approve/:id", approveRedemption);
router.put("/redemptions/reject/:id", rejectRedemption);

// ➕ Admin Creates Admin or Educator
router.post("/create-user", registerByAdmin);

export default router;
