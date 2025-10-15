import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ✅ Middleware: Authenticate User from JWT
export const requireAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.finmen_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ✅ Middleware: Admin-only access
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};


// ✅ Middleware: Student-only access
export const requireStudent = (req, res, next) => {
  if (req.user?.role !== "student") {
    return res.status(403).json({ message: "Access denied. Students only." });
  }
  next();
};

// ✅ Middleware: Parent-only access
export const requireParent = (req, res, next) => {
  if (req.user?.role !== "parent") {
    return res.status(403).json({ message: "Access denied. Parents only." });
  }
  next();
};

// ✅ Middleware: Seller-only access
export const requireSeller = (req, res, next) => {
  if (req.user?.role !== "seller") {
    return res.status(403).json({ message: "Access denied. Sellers only." });
  }
  next();
};

// ✅ Middleware: CSR-only access
export const requireCSR = (req, res, next) => {
  if (req.user?.role !== "csr") {
    return res.status(403).json({ message: "Access denied. CSR users only." });
  }
  next();
};

// ✅ Middleware: School Admin-only access
export const requireSchoolAdmin = (req, res, next) => {
  if (req.user?.role !== "school_admin") {
    return res.status(403).json({ message: "Access denied. School admins only." });
  }
  next();
};

// ✅ Middleware: School Teacher-only access
export const requireSchoolTeacher = (req, res, next) => {
  if (req.user?.role !== "school_teacher") {
    return res.status(403).json({ message: "Access denied. School teachers only." });
  }
  next();
};

// ✅ Middleware: Any School Role access (admin, teacher, student, parent)
export const requireSchoolRole = (req, res, next) => {
  const schoolRoles = ['school_admin', 'school_teacher', 'school_student', 'school_parent', 'school_accountant', 'school_librarian'];
  if (!schoolRoles.includes(req.user?.role)) {
    return res.status(403).json({ message: "Access denied. School users only." });
  }
  next();
};