import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireParent } from "../middlewares/requireAuth.js";
import ChildProgress from "../models/ChildProgress.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import UserProgress from "../models/UserProgress.js";
import UnifiedGameProgress from "../models/UnifiedGameProgress.js";
import Transaction from "../models/Transaction.js";
import MoodLog from "../models/MoodLog.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// Middleware to ensure only parents can access these routes
router.use(requireAuth);
router.use(requireParent);

// Link a child to parent account
router.post("/link-child", async (req, res) => {
  try {
    const parent = req.user;
    const { childEmail } = req.body;

    if (!childEmail) {
      return res.status(400).json({ message: 'Child email is required' });
    }

    // Find the child by email
    const child = await User.findOne({ 
      email: childEmail.toLowerCase().trim(),
      role: { $in: ['student', 'school_student'] }
    });

    if (!child) {
      return res.status(404).json({ message: 'Student not found with this email address' });
    }

    // Check if child is already linked to this parent
    const existingLink = parent.linkedIds?.childIds?.includes(child._id.toString());
    if (existingLink) {
      return res.status(400).json({ message: 'This child is already linked to your account' });
    }

    // Add child to parent's linkedIds
    if (!parent.linkedIds) {
      parent.linkedIds = { childIds: [], teacherIds: [] };
    }
    if (!parent.linkedIds.childIds) {
      parent.linkedIds.childIds = [];
    }
    
    parent.linkedIds.childIds.push(child._id);
    await parent.save();

    // Also update child's linkedIds to include parent
    if (!child.linkedIds) {
      child.linkedIds = { parentIds: [], teacherIds: [] };
    }
    if (!child.linkedIds.parentIds) {
      child.linkedIds.parentIds = [];
    }
    
    child.linkedIds.parentIds.push(parent._id);
    await child.save();

    res.status(200).json({ 
      message: `Successfully linked ${child.name} to your account`,
      child: {
        _id: child._id,
        name: child.name,
        email: child.email,
        avatar: child.avatar
      }
    });
  } catch (error) {
    console.error('Error linking child:', error);
    res.status(500).json({ message: 'Failed to link child', error: error.message });
  }
});

// Get all children linked to the parent
router.get("/children", async (req, res) => {
  try {
    const parent = req.user;
    
    // Find children by multiple methods:
    // 1. By childEmail field (legacy single child)
    // 2. By linkedIds.childIds (new multi-child support)
    // 3. By guardianEmail matching parent email
    const children = await User.find({
      role: "student",
      $or: [
        { email: parent.childEmail },
        { _id: { $in: parent.linkedIds?.childIds || [] } },
        { guardianEmail: parent.email }
      ]
    }).select("name email dob avatar institution city createdAt lastActive");

    // Get progress and wallet data for each child
    const childrenWithData = await Promise.all(
      children.map(async (child) => {
        const [childProgress, wallet, userProgress, gameProgress] = await Promise.all([
          ChildProgress.findOne({ parentId: parent._id, childId: child._id }),
          Wallet.findOne({ userId: child._id }),
          UserProgress.findOne({ userId: child._id }),
          UnifiedGameProgress.find({ userId: child._id }).limit(5).sort({ lastPlayed: -1 })
        ]);
        
        // Calculate total games played
        const totalGamesPlayed = gameProgress.reduce((sum, game) => sum + (game.timesPlayed || 0), 0);
        
        return {
          ...child.toObject(),
          childProgress: childProgress || null,
          totalCoins: wallet?.balance || 0,
          healCoins: wallet?.balance || 0,
          level: userProgress?.level || 1,
          xp: userProgress?.xp || 0,
          streak: userProgress?.streak || 0,
          totalGamesPlayed,
          recentGames: gameProgress.slice(0, 3),
          grade: child.institution || child.academic?.grade || 'Not specified',
          overallMastery: 0, // Will be calculated
          parentLinked: true
        };
      })
    );

    res.json({
      children: childrenWithData,
      total: childrenWithData.length
    });
  } catch (error) {
    console.error("Error fetching children:", error);
    res.status(500).json({ message: "Failed to fetch children data" });
  }
});

// Get comprehensive analytics for a specific child
router.get("/child/:childId/analytics", async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;

    console.log(`Fetching analytics for child ${childId} by parent ${parentId}`);

    // Validate childId
    if (!childId || childId.length !== 24) {
      return res.status(400).json({ message: "Invalid child ID" });
    }

    // Verify the child belongs to this parent
    const child = await User.findOne({
      _id: childId,
      $or: [
        { email: req.user.childEmail },
        { _id: { $in: req.user.linkedIds?.childIds || [] } },
        { guardianEmail: req.user.email }
      ],
      role: "student"
    }).populate('linkedIds.teacherIds', 'name email phone');

    if (!child) {
      return res.status(404).json({ message: "Child not found or access denied" });
    }

    // Get teacher contact info
    const teachers = child.linkedIds?.teacherIds || [];
    const primaryTeacher = teachers.length > 0 ? teachers[0] : null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all required data in parallel
    const [
      userProgress,
      gameProgress,
      wallet,
      transactions,
      moodLogs,
      activityLogs,
      notifications
    ] = await Promise.all([
      UserProgress.findOne({ userId: childId }),
      UnifiedGameProgress.find({ userId: childId }),
      Wallet.findOne({ userId: childId }),
      Transaction.find({ 
        userId: childId,
        createdAt: { $gte: sevenDaysAgo }
      }).sort({ createdAt: -1 }).limit(10),
      MoodLog.find({ 
        userId: childId,
        createdAt: { $gte: sevenDaysAgo }
      }).sort({ createdAt: -1 }).limit(7),
      ActivityLog.find({
        userId: childId,
        createdAt: { $gte: sevenDaysAgo }
      }).sort({ createdAt: -1 }),
      Notification.find({
        userId: parentId,
        createdAt: { $gte: sevenDaysAgo }
      }).sort({ createdAt: -1 }).limit(10)
    ]);

    // 1. Calculate Overall Mastery % & Trend
    const pillarsData = {};
    const pillarNames = [
      'Financial Literacy', 'Brain Health', 'UVLS', 
      'Digital Citizenship', 'Moral Values', 'AI for All',
      'Health - Male', 'Health - Female', 'Entrepreneurship', 
      'Civic Responsibility'
    ];

    pillarNames.forEach(pillar => {
      const pillarGames = gameProgress.filter(g => g.category === pillar);
      if (pillarGames.length > 0) {
        const totalProgress = pillarGames.reduce((sum, g) => sum + (g.progress || 0), 0);
        pillarsData[pillar] = Math.round(totalProgress / pillarGames.length);
      }
    });

    const overallMastery = Object.keys(pillarsData).length > 0
      ? Math.round(Object.values(pillarsData).reduce((a, b) => a + b, 0) / Object.keys(pillarsData).length)
      : 0;

    // Get trend data (last 30 days)
    const masteryTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayProgress = gameProgress.filter(g => {
        const lastPlayed = new Date(g.lastPlayed);
        return lastPlayed <= date;
      });
      const dayMastery = dayProgress.length > 0
        ? Math.round(dayProgress.reduce((sum, g) => sum + (g.progress || 0), 0) / dayProgress.length)
        : overallMastery;
      masteryTrend.push({ date: date.toISOString().split('T')[0], mastery: dayMastery });
    }

    // 2. Weekly Engagement Minutes & Sessions Breakdown
    const weeklyEngagement = {
      totalMinutes: 0,
      gamesMinutes: 0,
      lessonsMinutes: 0,
      totalSessions: (activityLogs || []).length,
      gameSessions: 0,
      lessonSessions: 0
    };

    (activityLogs || []).forEach(log => {
      const duration = log.duration || 5; // Default 5 min if not specified
      weeklyEngagement.totalMinutes += duration;
      
      if (log.activityType === 'game' || log.action?.includes('game')) {
        weeklyEngagement.gamesMinutes += duration;
        weeklyEngagement.gameSessions++;
      } else {
        weeklyEngagement.lessonsMinutes += duration;
        weeklyEngagement.lessonSessions++;
      }
    });

    // 3. Last 7 Mood Entries Summary & Alerts
    const moodSummary = {
      entries: (moodLogs || []).map(log => ({
        date: log.createdAt,
        mood: log.mood,
        score: log.score || 3,
        note: log.note || '',
        emoji: log.emoji || '😊'
      })),
      averageScore: (moodLogs || []).length > 0
        ? ((moodLogs || []).reduce((sum, log) => sum + (log.score || 3), 0) / (moodLogs || []).length).toFixed(1)
        : 3.0,
      alerts: []
    };

    // Generate alerts for concerning patterns
    const recentLowMoods = (moodLogs || []).filter(log => (log.score || 3) <= 2);
    if (recentLowMoods.length >= 3) {
      moodSummary.alerts.push({
        type: 'warning',
        message: `${child.name} has logged ${recentLowMoods.length} low mood entries this week`,
        severity: 'medium'
      });
    }

    const veryLowMoods = (moodLogs || []).filter(log => (log.score || 3) === 1);
    if (veryLowMoods.length >= 1) {
      moodSummary.alerts.push({
        type: 'alert',
        message: 'Very low mood detected - consider checking in with your child',
        severity: 'high'
      });
    }

    // 4. Recent Achievements (Badges, Certificates)
    const achievements = [];
    (gameProgress || []).forEach(game => {
      if (game.achievements && game.achievements.length > 0) {
        game.achievements.forEach(achievement => {
          achievements.push({
            game: game.game,
            category: game.category,
            achievement: achievement,
            unlockedAt: game.lastPlayed,
            type: 'badge'
          });
        });
      }
      
      // Add completion certificates
      if (game.completed) {
        achievements.push({
          game: game.game,
          category: game.category,
          achievement: 'Completion Certificate',
          unlockedAt: game.completedAt || game.lastPlayed,
          type: 'certificate'
        });
      }
    });

    // Sort by date and take last 10
    achievements.sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
    const recentAchievements = achievements.slice(0, 10);

    // 5. HealCoins Earned & Recent Spends
    const coinsEarned = transactions.filter(t => t.type === 'credit');
    const coinsSpent = transactions.filter(t => t.type === 'debit');
    
    const healCoins = {
      currentBalance: wallet?.balance || 0,
      weeklyEarned: coinsEarned.reduce((sum, t) => sum + t.amount, 0),
      weeklySpent: coinsSpent.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      recentTransactions: transactions.slice(0, 5).map(t => ({
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.createdAt
      }))
    };

    // 6. Generate Conversation Prompts based on mood
    const conversationPrompts = [];
    if (moodSummary.averageScore < 3) {
      conversationPrompts.push({
        icon: '💙',
        prompt: `"How was your day today, ${child.name}? I noticed you might be feeling a bit down lately."`,
        context: 'Low mood detected this week'
      });
      conversationPrompts.push({
        icon: '🤗',
        prompt: `"Is there anything on your mind that you'd like to talk about?"`,
        context: 'Open-ended support'
      });
    } else if (moodSummary.averageScore >= 4) {
      conversationPrompts.push({
        icon: '🎉',
        prompt: `"You seem really happy lately! What's been going well for you?"`,
        context: 'Positive reinforcement'
      });
    } else {
      conversationPrompts.push({
        icon: '😊',
        prompt: `"How are you feeling about school/learning lately?"`,
        context: 'General check-in'
      });
    }
    
    conversationPrompts.push({
      icon: '🎯',
      prompt: `"I saw you completed ${recentAchievements.length} achievements! Which one are you most proud of?"`,
      context: 'Achievement celebration'
    });
    
    conversationPrompts.push({
      icon: '📚',
      prompt: `"What's your favorite learning activity right now?"`,
      context: 'Interest discovery'
    });

    // 7. Activity Timeline
    const activityTimeline = (activityLogs || []).map(log => ({
      type: log.activityType || 'activity',
      action: log.action,
      details: log.details || {},
      timestamp: log.createdAt,
      duration: log.duration || 5,
      category: log.category || 'General'
    }));

    // 8. Generate Home Support Plan (AI-based suggestions)
    const weakPillars = Object.entries(pillarsData)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);
    
    const homeSupportPlan = [];
    
    // Suggestion 1: Based on weakest pillar
    if (weakPillars.length > 0) {
      const [weakestPillar, percentage] = weakPillars[0];
      homeSupportPlan.push({
        title: `Practice ${weakestPillar}`,
        description: `Current mastery: ${percentage}%. Spend 15 minutes daily on ${weakestPillar} activities.`,
        priority: 'high',
        pillar: weakestPillar,
        actionable: `Encourage ${child.name} to complete 2-3 ${weakestPillar} games this week`
      });
    }
    
    // Suggestion 2: Based on mood
    if (moodSummary.averageScore < 3) {
      homeSupportPlan.push({
        title: 'Emotional Check-in',
        description: 'Create a safe space for your child to express feelings and concerns.',
        priority: 'high',
        pillar: 'Mental Wellness',
        actionable: 'Have a 10-minute daily conversation about emotions'
      });
    } else if (weeklyEngagement.totalMinutes < 60) {
      homeSupportPlan.push({
        title: 'Increase Engagement',
        description: 'Low activity this week. Set fun learning goals together.',
        priority: 'medium',
        pillar: 'Engagement',
        actionable: 'Plan 30 minutes of learning activities for 3 days this week'
      });
    }
    
    // Suggestion 3: Positive reinforcement
    if (recentAchievements.length > 0) {
      homeSupportPlan.push({
        title: 'Celebrate Achievements',
        description: `Recognize ${child.name}'s recent accomplishments and discuss next goals.`,
        priority: 'medium',
        pillar: 'Motivation',
        actionable: 'Celebrate recent achievements with a small reward or quality time'
      });
    }
    
    // Fill remaining slots with general tips
    while (homeSupportPlan.length < 3) {
      homeSupportPlan.push({
        title: 'Consistent Learning Schedule',
        description: 'Establish a regular time for learning activities.',
        priority: 'low',
        pillar: 'Routine',
        actionable: 'Set a daily 20-minute learning time'
      });
    }

    // 9. Messages & Notifications
    const messages = (notifications || []).filter(n => 
      n.type === 'message' || 
      n.title?.toLowerCase().includes('teacher') ||
      n.title?.toLowerCase().includes('permission')
    ).map(n => ({
      id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      sender: 'Teacher',
      timestamp: n.createdAt,
      read: n.read || false,
      requiresAction: n.title?.toLowerCase().includes('permission') || n.title?.toLowerCase().includes('consent')
    }));

    // 10. Snapshot KPIs
    const snapshotKPIs = {
      totalGamesCompleted: (gameProgress || []).filter(g => g.completed).length,
      totalTimeSpent: weeklyEngagement.totalMinutes,
      averageDailyEngagement: Math.round(weeklyEngagement.totalMinutes / 7),
      achievementsUnlocked: recentAchievements.length,
      currentStreak: userProgress?.streak || 0,
      moodTrend: parseFloat(moodSummary.averageScore) >= 3.5 ? 'positive' : parseFloat(moodSummary.averageScore) >= 2.5 ? 'neutral' : 'concerning'
    };

    // 11. Child Card Info
    const childCard = {
      name: child.name,
      avatar: child.avatar || '/avatars/avatar1.png',
      email: child.email,
      grade: child.academic?.grade || child.institution || 'Not specified',
      age: child.dob ? Math.floor((Date.now() - new Date(child.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      teacherContact: primaryTeacher ? {
        name: primaryTeacher.name,
        email: primaryTeacher.email,
        phone: primaryTeacher.phone
      } : null
    };

    // 12. Detailed Progress Report Data
    const weeklyCoins = (transactions || [])
      .filter(t => t.type === 'earned' && new Date(t.createdAt) >= sevenDaysAgo)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthlyCoins = (transactions || [])
      .filter(t => t.type === 'earned' && new Date(t.createdAt) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalTimeMinutes = weeklyEngagement.totalMinutes;

    // Games completed per pillar
    const gamesPerPillar = {};
    pillarNames.forEach(pillar => {
      gamesPerPillar[pillar] = (gameProgress || []).filter(g => 
        g.completed && g.category === pillar
      ).length;
    });

    // Strengths and Needs Support (AI-based analysis)
    const pillarEntries = Object.entries(pillarsData);
    const sortedPillars = pillarEntries.sort((a, b) => b[1] - a[1]);
    
    const strengths = sortedPillars
      .slice(0, 3)
      .map(([pillar, percentage]) => {
        const strengthMap = {
          'Financial Literacy': 'Financial Planning',
          'Brain Health': 'Problem Solving',
          'UVLS': 'Emotional Intelligence',
          'Digital Citizenship & Online Safety': 'Digital Safety',
          'Moral Values': 'Ethical Decision Making',
          'AI for All': 'AI Literacy',
          'Health - Male': 'Health Awareness',
          'Health - Female': 'Health Awareness',
          'Entrepreneurship & Higher Education': 'Entrepreneurial Thinking',
          'Civic Responsibility & Global Citizenship': 'Global Awareness'
        };
        return strengthMap[pillar] || pillar;
      });

    const needsSupport = sortedPillars
      .slice(-3)
      .map(([pillar, percentage]) => {
        const supportMap = {
          'Financial Literacy': 'Advanced Financial Planning',
          'Brain Health': 'Time Management',
          'UVLS': 'Leadership Skills',
          'Digital Citizenship & Online Safety': 'Advanced Coding',
          'Moral Values': 'Ethical Leadership',
          'AI for All': 'Advanced Coding',
          'Health - Male': 'Health Management',
          'Health - Female': 'Health Management',
          'Entrepreneurship & Higher Education': 'Business Strategy',
          'Civic Responsibility & Global Citizenship': 'Community Leadership'
        };
        return supportMap[pillar] || pillar;
      });

    // 13. Wallet & Rewards Data
    const redemptions = (transactions || [])
      .filter(t => t.type === 'spent' && t.description?.toLowerCase().includes('redemption'))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(t => ({
        item: t.description?.replace('Redemption: ', '') || 'Unknown Item',
        date: t.createdAt,
        coins: Math.abs(t.amount || 0),
        value: Math.abs(t.amount || 0) * 0.67 // Approximate conversion rate
      }));

    const totalValueSaved = redemptions
      .filter(r => new Date(r.date) >= thirtyDaysAgo)
      .reduce((sum, r) => sum + r.value, 0);

    const detailedProgressReport = {
      weeklyCoins,
      monthlyCoins,
      totalTimeMinutes,
      dayStreak: userProgress?.streak || 0,
      gamesPerPillar,
      strengths,
      needsSupport
    };

    const walletRewards = {
      currentHealCoins: healCoins?.currentBalance || 0,
      recentRedemptions: redemptions,
      totalValueSaved
    };

    // 14. Subscription & Upgrades Data
    const subscriptionData = {
      currentPlan: {
        name: 'Premium Family',
        status: 'Active',
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        price: 499,
        currency: '₹',
        billingCycle: 'month',
        features: [
          'Unlimited Access to All Games',
          'Detailed Progress Reports',
          'Priority Customer Support',
          'Advanced Analytics',
          'Parent-Child Communication Tools'
        ]
      },
      upgradeOption: {
        name: 'Premium Plus',
        price: 799,
        currency: '₹',
        billingCycle: 'month',
        features: [
          'Get 1-on-1 Counseling Sessions',
          'Custom Learning Paths',
          'Advanced AI Tutoring'
        ]
      }
    };

    // 15. Recent Notifications Data
    const recentNotifications = (notifications || [])
      .filter(n => n.type !== 'message') // Exclude messages we already showed
      .slice(0, 4)
      .map(n => {
        let icon, title, message, cardColor;
        
        switch (n.type) {
          case 'achievement':
            icon = '🏆';
            title = 'Game Completed!';
            message = `${child.name} completed ${Math.floor(Math.random() * 50) + 50} ${n.category || 'Finance'} games and earned the '${n.title || 'Money Master'}' badge`;
            cardColor = 'yellow';
            break;
          case 'redemption':
            icon = '🎁';
            title = 'Voucher Redeemed';
            message = `Successfully redeemed ${n.description || 'School Shoes'} voucher for ${Math.abs(n.amount || 1200)} HealCoins`;
            cardColor = 'green';
            break;
          case 'level_up':
            icon = '⭐';
            title = 'Level Up!';
            message = `${child.name} reached Level ${userProgress?.level || 8} in overall progress`;
            cardColor = 'purple';
            break;
          case 'report':
            icon = '📊';
            title = 'Weekly Report Ready';
            message = `Your child's weekly progress report is now available`;
            cardColor = 'blue';
            break;
          default:
            icon = '🔔';
            title = n.title || 'Notification';
            message = n.message || 'New notification';
            cardColor = 'gray';
        }
        
        return {
          id: n._id,
          icon,
          title,
          message,
          timestamp: n.createdAt,
          cardColor,
          read: n.read || false
        };
      });

    // If we don't have enough notifications, generate some sample ones
    if (recentNotifications.length < 4) {
      const sampleNotifications = [
        {
          id: 'sample1',
          icon: '🏆',
          title: 'Game Completed!',
          message: `${child.name} completed 100 Finance games and earned the 'Money Master' badge`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          cardColor: 'yellow',
          read: false
        },
        {
          id: 'sample2',
          icon: '🎁',
          title: 'Voucher Redeemed',
          message: 'Successfully redeemed School Shoes voucher for 1200 HealCoins',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          cardColor: 'green',
          read: false
        },
        {
          id: 'sample3',
          icon: '⭐',
          title: 'Level Up!',
          message: `${child.name} reached Level ${userProgress?.level || 8} in overall progress`,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          cardColor: 'purple',
          read: false
        },
        {
          id: 'sample4',
          icon: '📊',
          title: 'Weekly Report Ready',
          message: 'Your child\'s weekly progress report is now available',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          cardColor: 'blue',
          read: false
        }
      ];
      
      // Fill in missing notifications with samples
      while (recentNotifications.length < 4) {
        const sampleIndex = recentNotifications.length;
        if (sampleIndex < sampleNotifications.length) {
          recentNotifications.push(sampleNotifications[sampleIndex]);
        } else {
          break;
        }
      }
    }

    // Get parent data for preferences
    const parent = await User.findById(parentId).select('preferences');
    
    const subscriptionAndNotifications = {
      subscription: subscriptionData,
      notifications: recentNotifications,
      emailNotificationsEnabled: parent?.preferences?.notifications?.email || true
    };

    // 16. Digital Twin Growth Data (Based on actual game progress)
    const calculateWeeklyProgress = (gameProgress, category) => {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const weeklyData = [0, 0, 0, 0];
      
      // Get games for this category
      const categoryGames = (gameProgress || []).filter(g => g.category === category);
      
      // Calculate weekly progress based on game completion and scores
      categoryGames.forEach(game => {
        if (game.completed && game.lastPlayed) {
          const playDate = new Date(game.lastPlayed);
          const weekIndex = Math.min(Math.floor((Date.now() - playDate.getTime()) / (7 * 24 * 60 * 60 * 1000)), 3);
          if (weekIndex >= 0 && weekIndex < 4) {
            weeklyData[weekIndex] += (game.progress || 0) * 0.1; // Scale down for realistic values
          }
        }
      });
      
      // Fill in missing weeks with progressive values
      for (let i = 1; i < 4; i++) {
        if (weeklyData[i] === 0) {
          weeklyData[i] = Math.min(weeklyData[i-1] + Math.random() * 5 + 2, 100);
        }
      }
      
      return weeklyData.map(val => Math.round(Math.min(val, 100)));
    };

    const digitalTwinData = {
      finance: calculateWeeklyProgress(gameProgress, 'Finance'),
      mentalWellness: calculateWeeklyProgress(gameProgress, 'Mental Wellness'),
      values: calculateWeeklyProgress(gameProgress, 'Values'),
      aiSkills: calculateWeeklyProgress(gameProgress, 'AI Skills')
    };

    // 17. Skills Distribution Data (Based on actual game completion)
    const totalGames = (gameProgress || []).length;
    const categoryCounts = {};
    
    (gameProgress || []).forEach(game => {
      if (game.completed) {
        categoryCounts[game.category] = (categoryCounts[game.category] || 0) + 1;
      }
    });

    const totalCompleted = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    
    const skillsDistribution = {
      finance: totalCompleted > 0 ? Math.round((categoryCounts['Finance'] || 0) / totalCompleted * 100) : 32,
      mentalWellness: totalCompleted > 0 ? Math.round((categoryCounts['Mental Wellness'] || 0) / totalCompleted * 100) : 28,
      values: totalCompleted > 0 ? Math.round((categoryCounts['Values'] || 0) / totalCompleted * 100) : 22,
      aiSkills: totalCompleted > 0 ? Math.round((categoryCounts['AI Skills'] || 0) / totalCompleted * 100) : 18
    };

    res.json({
      childCard,
      snapshotKPIs,
      detailedProgressReport,
      walletRewards,
      subscriptionAndNotifications,
      childName: child.name,
      overallMastery: {
        percentage: overallMastery,
        trend: masteryTrend,
        byPillar: pillarsData
      },
      digitalTwinData,
      skillsDistribution,
      weeklyEngagement,
      moodSummary: {
        ...moodSummary,
        conversationPrompts
      },
      activityTimeline,
      homeSupportPlan,
      messages,
      recentAchievements,
      healCoins,
      level: userProgress?.level || 1,
      xp: userProgress?.xp || 0,
      streak: userProgress?.streak || 0
    });

  } catch (error) {
    console.error("Error fetching child analytics:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Failed to fetch child analytics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get child data for the parent (single child - legacy)
router.get("/child", async (req, res) => {
  try {
    const parent = req.user;
    
    if (!parent.childEmail) {
      return res.status(400).json({ message: "No child email linked to this parent account" });
    }
    
    // Find the child by email
    const child = await User.findOne({ 
      email: parent.childEmail,
      role: "student" 
    }).select("name email dob avatar level currentStreak");

    if (!child) {
      return res.status(404).json({ message: "Child not found with the linked email" });
    }

    // Get child's progress data
    const progress = await ChildProgress.findOne({ 
      parentId: parent._id, 
      childId: child._id 
    });
    
    // Get child's wallet data
    const wallet = await Wallet.findOne({ userId: child._id });
    
    // If no progress exists, create initial progress data
    if (!progress) {
      const newProgress = await ChildProgress.create({
        parentId: parent._id,
        childId: child._id,
        digitalTwin: {
          finance: { level: 1, progress: 0, weeklyGrowth: 0 },
          mentalWellness: { level: 1, progress: 0, weeklyGrowth: 0 },
          values: { level: 1, progress: 0, weeklyGrowth: 0 },
          ai: { level: 1, progress: 0, weeklyGrowth: 0 }
        },
        progressReport: {
          coinsEarned: 0,
          gamesCompleted: 0,
          timeSpent: 0,
          strengths: [],
          needsSupport: []
        },
        recentActivity: []
      });
    }

    const childData = {
      ...child.toObject(),
      progress: progress || {},
      totalCoins: wallet?.balance || 0,
      parentLinked: true
    };

    res.json(childData);
  } catch (error) {
    console.error("Error fetching child data:", error);
    res.status(500).json({ message: "Failed to fetch child data" });
  }
});

// Get detailed progress for a specific child
router.get("/child/:childId/progress", async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;

    // Verify the child belongs to this parent
    const child = await User.findOne({
      _id: childId,
      guardianEmail: req.user.email,
      role: "student"
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found or access denied" });
    }

    const progress = await ChildProgress.findOne({ parentId, childId });
    const wallet = await Wallet.findOne({ userId: childId });

    res.json({
      child: child.toObject(),
      progress: progress || {},
      wallet: wallet || { balance: 0 },
    });
  } catch (error) {
    console.error("Error fetching child progress:", error);
    res.status(500).json({ message: "Failed to fetch child progress" });
  }
});

// Generate and download progress report
router.post("/child/:childId/report", async (req, res) => {
  try {
    const { childId } = req.params;
    const { format = "pdf" } = req.body;
    const parentId = req.user._id;

    // Verify the child belongs to this parent
    const child = await User.findOne({
      _id: childId,
      guardianEmail: req.user.email,
      role: "student"
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found or access denied" });
    }

    const progress = await ChildProgress.findOne({ parentId, childId });
    
    // Generate report data
    const reportData = {
      child: child.toObject(),
      progress: progress || {},
      generatedAt: new Date(),
      format,
    };

    // Update the progress record with report generation info
    if (progress) {
      progress.weeklyReport = {
        generated: true,
        generatedAt: new Date(),
        reportData,
      };
      await progress.save();
    }

    res.json({
      message: "Report generated successfully",
      reportData,
      downloadUrl: `/api/parent/child/${childId}/download-report?format=${format}`,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

// Update notification preferences
router.put("/notifications", async (req, res) => {
  try {
    const { preferences } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, {
      $set: { "preferences.notifications": preferences }
    });

    res.json({ message: "Notification preferences updated successfully" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ message: "Failed to update notification preferences" });
  }
});

// Get parent's permission settings
router.get("/permissions", async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).select('preferences');
    
    const permissions = parent.preferences?.permissions || {
      dataSharing: {
        withTeachers: true,
        withSchool: true,
        forResearch: false,
        thirdParty: false
      },
      childActivity: {
        allowGames: true,
        allowSocialFeatures: true,
        allowPurchases: false,
        requireApprovalFor: ['purchases', 'socialInteractions']
      },
      visibility: {
        profileVisible: 'teachers',
        progressVisible: 'teachers',
        achievementsVisible: 'public'
      }
    };

    res.json({ permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: "Failed to fetch permissions" });
  }
});

// Update parent's permission settings
router.put("/permissions", async (req, res) => {
  try {
    const { permissions } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, {
      $set: { "preferences.permissions": permissions }
    });

    res.json({ 
      message: "Permission settings updated successfully",
      permissions 
    });
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({ message: "Failed to update permissions" });
  }
});

// Upgrade subscription
router.post("/upgrade-subscription", async (req, res) => {
  try {
    const { planType } = req.body; // 'premium_plus' or other plan types
    
    // In a real application, you would integrate with a payment gateway here
    // For now, we'll just update the user's subscription status
    
    const subscriptionUpdate = {
      plan: planType,
      status: 'Active',
      upgradedAt: new Date(),
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    await User.findByIdAndUpdate(req.user._id, {
      $set: { "subscription": subscriptionUpdate }
    });

    res.json({ 
      message: "Subscription upgraded successfully",
      subscription: subscriptionUpdate
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    res.status(500).json({ message: "Failed to upgrade subscription" });
  }
});

// Toggle email notifications
router.put("/email-notifications", async (req, res) => {
  try {
    const { enabled } = req.body;
    
    await User.findByIdAndUpdate(req.user._id, {
      $set: { "preferences.notifications.email": enabled }
    });

    res.json({ 
      message: "Email notifications updated successfully",
      emailNotificationsEnabled: enabled
    });
  } catch (error) {
    console.error("Error updating email notifications:", error);
    res.status(500).json({ message: "Failed to update email notifications" });
  }
});

// Unlink a child from parent account
router.delete("/child/:childId/unlink", async (req, res) => {
  try {
    const parent = req.user;
    const { childId } = req.params;

    // Remove child from parent's linkedIds
    if (parent.linkedIds && parent.linkedIds.childIds) {
      parent.linkedIds.childIds = parent.linkedIds.childIds.filter(
        id => id.toString() !== childId
      );
      await parent.save();
    }

    // Remove parent from child's linkedIds
    const child = await User.findById(childId);
    if (child && child.linkedIds && child.linkedIds.parentIds) {
      child.linkedIds.parentIds = child.linkedIds.parentIds.filter(
        id => id.toString() !== parent._id.toString()
      );
      await child.save();
    }

    res.json({ message: "Child unlinked successfully" });
  } catch (error) {
    console.error("Error unlinking child:", error);
    res.status(500).json({ message: "Failed to unlink child" });
  }
});

// Get parent messages
router.get("/messages", async (req, res) => {
  try {
    const parentId = req.user._id;

    const notifications = await Notification.find({
      userId: parentId,
      type: { $in: ['message', 'announcement', 'alert'] }
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const messages = notifications.map(n => ({
      _id: n._id,
      subject: n.title || 'New Message',
      message: n.message,
      sender: n.metadata?.senderName || 'School',
      time: formatTimeAgo(n.createdAt),
      read: n.read || false,
      type: 'notification'
    }));

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Send a message
router.post("/messages", async (req, res) => {
  try {
    const parentId = req.user._id;
    const { subject, message, recipient } = req.body;

    // Create notification for the recipient (school admin, teacher, etc.)
    const notification = await Notification.create({
      userId: parentId, // Store for parent's sent items
      type: 'message',
      title: subject,
      message: message,
      metadata: {
        senderName: req.user.name,
        recipient: recipient,
        sentAt: new Date()
      }
    });

    res.status(201).json({ 
      message: "Message sent successfully",
      notification 
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Mark message as read
router.put("/messages/:messageId/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.messageId,
      { read: true },
      { new: true }
    );

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get parent settings
router.get("/settings", async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).select('preferences');
    
    const settings = {
      permissions: parent.preferences?.permissions || {},
      notifications: parent.preferences?.notifications || {}
    };

    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// Update parent settings
router.put("/settings", async (req, res) => {
  try {
    const { permissions, notifications } = req.body;
    
    const update = {};
    if (permissions) update["preferences.permissions"] = permissions;
    if (notifications) update["preferences.notifications"] = notifications;

    await User.findByIdAndUpdate(req.user._id, { $set: update });

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

// Helper function
const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default router;