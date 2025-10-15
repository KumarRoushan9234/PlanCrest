import User from "../models/user.js";
import jwt from "jsonwebtoken";

export const firebaseAuth = async (req, res) => {
  try {
    const { uid, email, name, picture } = req.body;

    // Validate required fields
    if (!uid || !email || !name) {
      return res.status(400).json({ error: "Missing required Firebase user data" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update Firebase info if needed
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        user.isFirebaseUser = true;
        user.isVerified = true; // Firebase users are pre-verified
        if (picture) user.picture = picture;
        await user.save();
      }
    } else {
      // Create new user with Firebase data
      user = new User({
        name,
        email,
        password: "firebase-auth", // Placeholder password for Firebase users
        picture: picture || "/avatar.png",
        isVerified: true, // Firebase users are pre-verified
        isFirebaseUser: true,
        firebaseUid: uid,
        totalProspectsFetched: 0,
        totalProspectsMailed: 0,
        totalProject: 0,
        userPlan: "free",
      });
      await user.save();
    }

    // Create signed JWT (same as regular login)
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Exclude sensitive data
    user.password = undefined;

    // Send token in cookie with cross-origin support
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS)
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send user and token as JSON response
    res.json({
      ...user.toObject(),
      token: token // Also send token in response for cross-origin compatibility
    });
  } catch (error) {
    console.error("Error in Firebase auth:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 