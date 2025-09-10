import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCSR } from "../middlewares/requireAuth.js";
import ImpactMetrics from "../models/ImpactMetrics.js";
import User from "../models/User.js";
import GameProgress from "../models/GameProgress.js";
import MoodLog from "../models/MoodLog.js";
import Wallet from "../models/Wallet.js";
import VoucherRedemption from "../models/VoucherRedemption.js";

const router = express.Router();

// Middleware to ensure only CSR users can access these routes
router.use(requireAuth);
router.use(requireCSR);

// Get overall impact metrics
router.get("/impact", async (req, res) => {
  try {
    const { region = 'all', period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get students based on region filter
    let studentQuery = { role: 'student', createdAt: { $gte: startDate } };
    if (region !== 'all') {
      studentQuery.city = region;
    }

    const students = await User.find(studentQuery);
    const studentIds = students.map(s => s._id);

    // Get voucher redemptions (items distributed)
    const redemptions = await VoucherRedemption.find({
      studentId: { $in: studentIds },
      status: 'approved',
      createdAt: { $gte: startDate }
    }).populate('productId', 'price');

    // Calculate metrics
    const studentsImpacted = students.length;
    const itemsDistributed = redemptions.length;
    const totalValueFunded = redemptions.reduce((sum, r) => sum + (r.productId?.price || 0), 0);
    
    // Get unique schools (assuming institution field represents school)
    const schoolsReached = [...new Set(students.map(s => s.institution).filter(Boolean))].length;

    // Calculate module progress
    const gameProgress = await GameProgress.find({
      userId: { $in: studentIds }
    });

    const moduleProgress = {
      finance: { progress: 0, students: 0, completion: 0 },
      mental: { progress: 0, students: 0, completion: 0 },
      values: { progress: 0, students: 0, completion: 0 },
      ai: { progress: 0, students: 0, completion: 0 }
    };

    // Calculate module statistics (simplified)
    const financeGames = gameProgress.filter(g => g.gameType?.includes('finance') || g.gameType?.includes('budget'));
    const mentalGames = gameProgress.filter(g => g.gameType?.includes('mental') || g.gameType?.includes('mood'));
    
    moduleProgress.finance.students = financeGames.length;
    moduleProgress.finance.progress = financeGames.length > 0 ? 
      financeGames.reduce((sum, g) => sum + (g.progress || 0), 0) / financeGames.length : 0;
    
    moduleProgress.mental.students = mentalGames.length;
    moduleProgress.mental.progress = mentalGames.length > 0 ? 
      mentalGames.reduce((sum, g) => sum + (g.progress || 0), 0) / mentalGames.length : 0;

    res.json({
      studentsImpacted,
      itemsDistributed,
      totalValueFunded,
      schoolsReached,
      moduleProgress,
      period,
      region,
    });
  } catch (error) {
    console.error("Error fetching impact metrics:", error);
    res.status(500).json({ message: "Failed to fetch impact metrics" });
  }
});

// Get regional breakdown
router.get("/regional", async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Aggregate students by region/city
    const regionalData = await User.aggregate([
      {
        $match: {
          role: 'student',
          createdAt: { $gte: startDate },
          city: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$city',
          students: { $sum: 1 },
          schools: { $addToSet: '$institution' }
        }
      },
      {
        $project: {
          region: '$_id',
          students: 1,
          schools: { $size: { $filter: { input: '$schools', cond: { $ne: ['$$this', null] } } } },
          impact: { $multiply: [{ $divide: ['$students', 100] }, 85] } // Simplified impact calculation
        }
      },
      {
        $sort: { students: -1 }
      }
    ]);

    res.json(regionalData);
  } catch (error) {
    console.error("Error fetching regional data:", error);
    res.status(500).json({ message: "Failed to fetch regional breakdown" });
  }
});

// Get trend data for charts
router.get("/trends", async (req, res) => {
  try {
    const { period = 'month', metric = 'students' } = req.query;

    const now = new Date();
    const trends = [];

    // Get data for the last 6 periods
    for (let i = 5; i >= 0; i--) {
      let periodStart, periodEnd, label;

      if (period === 'week') {
        periodStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        periodEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        label = `Week ${6 - i}`;
      } else if (period === 'quarter') {
        periodStart = new Date(now.getFullYear(), now.getMonth() - (i + 1) * 3, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() - i * 3, 0);
        label = `Q${Math.ceil((now.getMonth() - i * 3 + 1) / 3)}`;
      } else { // month
        periodStart = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);
        label = periodStart.toLocaleDateString('en-US', { month: 'short' });
      }

      let value = 0;

      if (metric === 'students') {
        const count = await User.countDocuments({
          role: 'student',
          createdAt: { $gte: periodStart, $lte: periodEnd }
        });
        value = count;
      } else if (metric === 'items') {
        const count = await VoucherRedemption.countDocuments({
          status: 'approved',
          createdAt: { $gte: periodStart, $lte: periodEnd }
        });
        value = count;
      }

      trends.push({ label, value, period: periodStart });
    }

    res.json(trends);
  } catch (error) {
    console.error("Error fetching trend data:", error);
    res.status(500).json({ message: "Failed to fetch trend data" });
  }
});

// Generate and export reports
router.post("/reports/generate", async (req, res) => {
  try {
    const { format = 'pdf', period = 'month', region = 'all' } = req.body;

    // Get comprehensive data for the report
    const impactData = await fetch(`${req.protocol}://${req.get('host')}/api/csr/impact?period=${period}&region=${region}`);
    const regionalData = await fetch(`${req.protocol}://${req.get('host')}/api/csr/regional?period=${period}`);
    const trendsData = await fetch(`${req.protocol}://${req.get('host')}/api/csr/trends?period=${period}`);

    const reportData = {
      generatedAt: new Date(),
      period,
      region,
      format,
      impact: await impactData.json(),
      regional: await regionalData.json(),
      trends: await trendsData.json(),
    };

    // In a real implementation, you would generate the actual PDF/Excel file here
    // For now, we'll just return the report data structure

    res.json({
      message: "Report generated successfully",
      reportData,
      downloadUrl: `/api/csr/reports/download?id=${Date.now()}&format=${format}`,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

// Schedule automated reports
router.post("/reports/schedule", async (req, res) => {
  try {
    const { frequency, recipients, reportType } = req.body;

    // In a real implementation, you would set up cron jobs or scheduled tasks
    // For now, we'll just save the schedule preferences

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        "preferences.reportSchedule": {
          frequency,
          recipients,
          reportType,
          enabled: true,
          createdAt: new Date(),
        }
      }
    });

    res.json({
      message: "Report schedule configured successfully",
      schedule: { frequency, recipients, reportType },
    });
  } catch (error) {
    console.error("Error scheduling reports:", error);
    res.status(500).json({ message: "Failed to schedule reports" });
  }
});

export default router;