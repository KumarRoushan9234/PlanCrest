import crypto from "crypto";
import User from "../models/user.js";
import { getFirebaseAuth, isFirebaseEnabled } from "../config/firebaseAdmin.js";
import { hashPassword } from "../utils/auth.js";
import { setAuthCookie, signSessionToken } from "../utils/session.js";

/**
 * Exchange a Firebase ID token (from Google sign-in on the client) for a
 * PlanCrest session. Identity comes only from the verified token, never from
 * client-supplied fields.
 */
export const firebaseAuth = async (req, res) => {
  try {
    if (!isFirebaseEnabled()) {
      return res.status(501).json({ error: "Google sign-in is not configured" });
    }

    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }

    let decoded;
    try {
      decoded = await getFirebaseAuth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ error: "Invalid or expired Google sign-in token" });
    }

    const { uid, email, email_verified: emailVerified, name, picture } = decoded;
    if (!email || !emailVerified) {
      return res.status(400).json({ error: "Your Google account email is not verified" });
    }

    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.firebaseUid && user.firebaseUid !== uid) {
        return res.status(409).json({ error: "This email is linked to a different Google account" });
      }
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        user.isFirebaseUser = true;
        user.isVerified = true;
        if (picture && !user.picture) user.picture = picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        // Google users sign in without a password; store an unusable random one
        password: await hashPassword(crypto.randomBytes(32).toString("hex")),
        picture: picture || "/avatar.png",
        isVerified: true,
        isFirebaseUser: true,
        firebaseUid: uid,
      });
    }

    const token = signSessionToken(user);
    setAuthCookie(res, token);

    const userData = user.toObject();
    delete userData.password;
    delete userData.verificationCode;
    delete userData.passwordResetCode;
    res.json({ ...userData, token });
  } catch (error) {
    console.error("Error in Firebase auth:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const authConfig = (req, res) => {
  res.json({ googleSignIn: isFirebaseEnabled() });
};
