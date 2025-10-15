import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Users, TrendingUp, AlertCircle, Plus, Mail, CheckCircle, Trophy,
  Activity, Target, ArrowRight, Calendar, Clock, BarChart3, MessageSquare,
  Sparkles, Gamepad2, Brain, Heart, Star, Flame, UserPlus, FileText, Award,
  Zap, TrendingDown, Building2, Shield, CreditCard, Eye, Download, X, Send,
  Phone, MapPin, Flag, Edit, RefreshCw
} from "lucide-react";
import api from "../../utils/api";
import { toast } from "react-hot-toast";
import analytics from "../../utils/analytics";

const SchoolAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [campuses, setCampuses] = useState([]);
  const [studentsAtRisk, setStudentsAtRisk] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);
  const [pillarMastery, setPillarMastery] = useState({});
  const [wellbeingCases, setWellbeingCases] = useState({});
  
  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCampusDetailModal, setShowCampusDetailModal] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState(null);
  
  // Add Student Form
  const [newStudent, setNewStudent] = useState({
    name: '', email: '', rollNumber: '', grade: '', section: 'A', phone: '', gender: '', password: ''
  });

  useEffect(() => {
    fetchDashboardData();
    analytics.trackOverviewView('school_admin', 'all');
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsRes, campusesRes, atRiskRes, leaderboardRes, approvalsRes,
        messagesRes, profileRes, masteryRes, wellbeingRes
      ] = await Promise.all([
        api.get("/api/school/admin/kpis"),
        api.get("/api/school/admin/campuses"),
        api.get("/api/school/admin/students?status=flagged&limit=5"),
        api.get("/api/school/admin/top-performers"),
        api.get("/api/school/admin/pending-approvals"),
        api.get("/api/school/admin/recent-activity").catch(() => ({ data: { activities: [] } })),
        api.get("/api/user/profile").catch(() => ({ data: null })),
        api.get("/api/school/admin/analytics/pillar-mastery"),
        api.get("/api/school/admin/analytics/wellbeing-cases"),
      ]);

      setStats(statsRes.data);
      setCampuses(campusesRes.data.campuses || []);
      setStudentsAtRisk(atRiskRes.data.students || []);
      setLeaderboard(leaderboardRes.data.students || []);
      setPendingApprovals(approvalsRes.data);
      setMessages(messagesRes.data.activities || []);
      setAdminProfile(profileRes.data);
      setPillarMastery(masteryRes.data);
      setWellbeingCases(wellbeingRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/school/admin/students/create', newStudent);
      toast.success('Student added successfully! Login credentials have been created.');
      setShowAddStudentModal(false);
      setNewStudent({ name: '', email: '', rollNumber: '', grade: '', section: 'A', phone: '', gender: '', password: '' });
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error(error.response?.data?.message || 'Failed to add student');
    }
  };

  const handleViewStudent = async (student) => {
    try {
      const response = await api.get(`/api/school/admin/students/${student._id}`);
      setSelectedStudent(response.data.student);
      setShowStudentDetailModal(true);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to load student details');
    }
  };

  const handleViewCampus = (campus) => {
    setSelectedCampus(campus);
    setShowCampusDetailModal(true);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 cursor-pointer transition-all ${
        onClick ? "hover:shadow-xl hover:border-purple-300" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {trend.startsWith('+') ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-bold">{trend}</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  );

  const QuickActionButton = ({ label, icon: Icon, color, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r ${color} text-white font-bold shadow-lg hover:shadow-xl transition-all`}
    >
      <Icon className="w-6 h-6" />
      {label}
    </motion.button>
  );

  // Add Student Modal
  const AddStudentModal = () => (
    <AnimatePresence>
      {showAddStudentModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddStudentModal(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black mb-1">Add New Student</h2>
                    <p className="text-sm text-white/80">Quick student registration</p>
                  </div>
                  <button
                    onClick={() => setShowAddStudentModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent(prev => ({...prev, name: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-semibold"
                      placeholder="Enter student name"
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent(prev => ({...prev, email: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-semibold"
                      placeholder="student@example.com"
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Roll Number *</label>
                    <input
                      type="text"
                      value={newStudent.rollNumber}
                      onChange={(e) => setNewStudent(prev => ({...prev, rollNumber: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-semibold"
                      placeholder="ROLL-001"
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent(prev => ({...prev, phone: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-semibold"
                      placeholder="+91 98765 43210"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Grade *</label>
                    <select
                      value={newStudent.grade}
                      onChange={(e) => setNewStudent(prev => ({...prev, grade: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-semibold"
                      required
                    >
                      <option value="">Select Grade</option>
                      {[6, 7, 8, 9, 10, 11, 12].map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Section *</label>
                    <select
                      value={newStudent.section}
                      onChange={(e) => setNewStudent(prev => ({...prev, section: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-semibold"
                      required
                    >
                      {['A', 'B', 'C', 'D', 'E'].map(sec => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Gender *</label>
                    <select
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent(prev => ({...prev, gender: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-semibold"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      value={newStudent.password}
                      onChange={(e) => setNewStudent(prev => ({...prev, password: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-semibold"
                      placeholder="Enter login password"
                      required
                      autoComplete="new-password"
                      minLength="6"
                    />
                    <p className="text-xs text-gray-500 mt-1">Min. 6 characters</p>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Login Credentials</h4>
                      <p className="text-sm text-gray-600">
                        The student can login using their email and password you set. 
                        They can change it later from their profile.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Student Detail Modal
  const StudentDetailModal = () => (
    <AnimatePresence>
      {showStudentDetailModal && selectedStudent && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStudentDetailModal(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">
                      {selectedStudent.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black mb-1">{selectedStudent.name || 'Student'}</h2>
                      <p className="text-sm text-white/80">Grade {selectedStudent.grade} - Section {selectedStudent.section}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStudentDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Overall Score</p>
                    <p className="text-2xl font-black text-blue-600">{selectedStudent.avgScore || 0}%</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <p className="text-lg font-black text-green-600">{selectedStudent.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                    <p className="text-xs text-gray-600 mb-1">Attendance</p>
                    <p className="text-2xl font-black text-purple-600">{selectedStudent.attendance?.percentage || 0}%</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
                    <p className="text-xs text-gray-600 mb-1">Flags</p>
                    <p className="text-2xl font-black text-orange-600">{selectedStudent.wellbeingFlags?.length || 0}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Pillar Mastery
                  </h3>
                  <div className="space-y-3">
                    {selectedStudent.pillars && Object.entries(selectedStudent.pillars).map(([pillar, score]) => (
                      typeof score === 'number' && (
                        <div key={pillar}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-gray-700 uppercase">{pillar}</span>
                            <span className="text-sm font-black text-gray-900">{score}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                score >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                score >= 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                                'bg-gradient-to-r from-red-500 to-pink-600'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Campus Detail Modal
  const CampusDetailModal = () => (
    <AnimatePresence>
      {showCampusDetailModal && selectedCampus && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCampusDetailModal(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black mb-1">{selectedCampus.name}</h2>
                    <p className="text-sm text-white/80">Campus Details</p>
                  </div>
                  <button
                    onClick={() => setShowCampusDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 text-center">
                    <p className="text-xs text-gray-600 mb-1">Students</p>
                    <p className="text-3xl font-black text-blue-600">{selectedCampus.studentCount || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200 text-center">
                    <p className="text-xs text-gray-600 mb-1">Teachers</p>
                    <p className="text-3xl font-black text-green-600">{selectedCampus.teacherCount || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200 text-center">
                    <p className="text-xs text-gray-600 mb-1">Classes</p>
                    <p className="text-3xl font-black text-purple-600">{selectedCampus.classCount || 0}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="font-bold">Location</span>
                    </div>
                    <p className="text-sm text-gray-900">{selectedCampus.location || 'Not specified'}</p>
                  </div>

                  {selectedCampus.contactInfo?.email && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <Mail className="w-5 h-5 text-green-600" />
                        <span className="font-bold">Email</span>
                      </div>
                      <p className="text-sm text-gray-900">{selectedCampus.contactInfo.email}</p>
                    </div>
                  )}

                  {selectedCampus.contactInfo?.phone && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <Phone className="w-5 h-5 text-purple-600" />
                        <span className="font-bold">Phone</span>
                      </div>
                      <p className="text-sm text-gray-900">{selectedCampus.contactInfo.phone}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => {
                      setShowCampusDetailModal(false);
                      navigate('/school/admin/settings');
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Campus
                  </button>
                  <button
                    onClick={() => setShowCampusDetailModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <h1 className="text-4xl font-black mb-2">
                Welcome back, {adminProfile?.name || "Admin"}! 👋
              </h1>
              <p className="text-lg text-white/90">
                Here's your school overview for today
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-bold hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
                Add Student
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        {/* Quick Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
        >
          <QuickActionButton
            label="View Analytics"
            icon={BarChart3}
            color="from-purple-500 to-pink-600"
            onClick={() => navigate("/school/admin/analytics")}
          />
          <QuickActionButton
            label="Manage Students"
            icon={Users}
            color="from-blue-500 to-cyan-600"
            onClick={() => navigate("/school/admin/students")}
          />
          <QuickActionButton
            label="Manage Teachers"
            icon={BookOpen}
            color="from-green-500 to-emerald-600"
            onClick={() => navigate("/school/admin/teachers")}
          />
          <QuickActionButton
            label="Manage Classes"
            icon={Building2}
            color="from-indigo-500 to-purple-600"
            onClick={() => navigate("/school/admin/classes")}
          />
          <QuickActionButton
            label="Pending Approvals"
            icon={CheckCircle}
            color="from-orange-500 to-red-600"
            onClick={() => navigate("/school/admin/approvals")}
          />
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats.students?.total || 0}
            icon={Users}
            color="from-blue-500 to-cyan-600"
            trend={`+${stats.students?.adoptionRate || 0}%`}
            subtitle={`${stats.students?.active || 0} active this month`}
            onClick={() => navigate("/school/admin/students")}
          />
          <StatCard
            title="Active Teachers"
            value={stats.teachers?.total || 0}
            icon={BookOpen}
            color="from-green-500 to-emerald-600"
            trend={`+${stats.teachers?.adoptionRate || 0}%`}
            subtitle={`${stats.teachers?.active || 0} active today`}
            onClick={() => navigate("/school/admin/teachers")}
          />
          <StatCard
            title="Pending Approvals"
            value={(pendingApprovals.assignments?.length || 0) + (pendingApprovals.templates?.length || 0)}
            icon={AlertCircle}
            color="from-red-500 to-pink-600"
            trend={(pendingApprovals.assignments?.length || 0) > 5 ? "+3" : "-2"}
            subtitle="Needs attention"
            onClick={() => navigate("/school/admin/approvals")}
          />
          <StatCard
            title="Wellbeing Cases"
            value={wellbeingCases.open || 0}
            icon={Heart}
            color="from-amber-500 to-orange-600"
            subtitle={`${wellbeingCases.resolved || 0} resolved`}
            onClick={() => navigate("/school/admin/emergency")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Campuses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Building2 className="w-7 h-7 text-purple-600" />
                  School Campuses
                </h2>
                <button
                  onClick={() => navigate("/school/admin/settings")}
                  className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2 transition-all"
                >
                  Manage <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campuses.slice(0, 4).map((campus, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    onClick={() => handleViewCampus(campus)}
                    className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{campus.name}</h3>
                      {campus.isMain && (
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <Star className="w-5 h-5 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-2xl font-black text-blue-600">{campus.studentCount || 0}</p>
                        <p className="text-xs text-gray-600">Students</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-green-600">{campus.teacherCount || 0}</p>
                        <p className="text-xs text-gray-600">Teachers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-purple-600">{campus.classCount || 0}</p>
                        <p className="text-xs text-gray-600">Classes</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* School-Wide Pillar Mastery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <BarChart3 className="w-7 h-7 text-green-600" />
                  School-Wide Pillar Mastery
                </h2>
                <button
                  onClick={() => navigate("/school/admin/analytics")}
                  className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-2 transition-all"
                >
                  Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {(() => {
                  const pillars = pillarMastery.averages?.pillars || pillarMastery.pillars || pillarMastery;
                  const entries = typeof pillars === 'object' && !Array.isArray(pillars)
                    ? Object.entries(pillars).filter(([key, value]) => typeof value === 'number')
                    : [['UVLS', 75], ['DCOS', 80], ['Moral', 70], ['EHE', 85], ['CRGC', 78]];
                  
                  return entries.slice(0, 6).map(([pillar, percentage], idx) => (
                    <motion.div
                      key={pillar}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 uppercase">{pillar}</span>
                        <span className="text-sm font-bold text-gray-900">{Math.round(percentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          className={`h-full rounded-full ${
                            percentage >= 75
                              ? "bg-gradient-to-r from-green-500 to-emerald-600"
                              : percentage >= 50
                              ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                              : "bg-gradient-to-r from-amber-500 to-orange-600"
                          }`}
                        />
                      </div>
                    </motion.div>
                  ));
                })()}
              </div>
            </motion.div>

            {/* Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Activity className="w-7 h-7 text-blue-600" />
                  Recent Activity
                </h2>
                <button
                  onClick={() => navigate("/school/admin/events")}
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 transition-all"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {messages.slice(0, 5).map((activity, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 transition-all cursor-pointer"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{activity.title || activity.action || 'Activity'}</p>
                      <p className="text-xs text-gray-600">{activity.description || activity.userName || 'System activity'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                         activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Top Performers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  Top Performers
                </h3>
                <button
                  onClick={() => navigate("/school/admin/students")}
                  className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((student, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleViewStudent(student)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-all cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{student.name || `Student ${idx + 1}`}</p>
                      <p className="text-xs text-gray-600">Grade {student.grade || 10} {student.section || 'A'}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-black text-gray-900">{student.score || 95}%</span>
                    </div>
                  </motion.div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No data available</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* At-Risk Students */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-600" />
                  Students At Risk
                </h3>
                <span className="text-2xl font-black text-red-600">{studentsAtRisk.length}</span>
              </div>
              <div className="space-y-2">
                {studentsAtRisk.slice(0, 4).map((student, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleViewStudent(student)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 hover:shadow-md transition-all cursor-pointer"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{student.name || 'Student'}</p>
                      <p className="text-xs text-red-600">Grade {student.grade || 10} • {student.wellbeingFlags?.length || 0} flags</p>
                    </div>
                    <Eye className="w-4 h-4 text-red-600 flex-shrink-0" />
                  </motion.div>
                ))}
                {studentsAtRisk.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                    <p className="text-sm">All students on track!</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/school/admin/students?status=flagged")}
                className="w-full mt-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                View All At-Risk Students
              </button>
            </motion.div>

            {/* Quick Stats Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white"
            >
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <span className="text-sm font-semibold">Total Classes</span>
                  <span className="text-2xl font-black">{stats.classes?.total || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <span className="text-sm font-semibold">Avg Attendance</span>
                  <span className="text-2xl font-black">{stats.attendance?.average || 0}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <span className="text-sm font-semibold">Pillar Mastery</span>
                  <span className="text-2xl font-black">
                    {(() => {
                      const pillars = pillarMastery.averages?.pillars || pillarMastery.pillars || pillarMastery;
                      const values = typeof pillars === 'object' && !Array.isArray(pillars)
                        ? Object.values(pillars).filter(v => typeof v === 'number')
                        : [];
                      return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
                    })()}%
                  </span>
                </div>
                <button
                  onClick={() => navigate("/school/admin/analytics")}
                  className="w-full mt-3 py-3 bg-white text-purple-600 rounded-xl font-black hover:bg-white/90 transition-all shadow-lg"
                >
                  View Full Analytics →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddStudentModal />
      <StudentDetailModal />
      <CampusDetailModal />
    </div>
  );
};

export default SchoolAdminDashboard;
