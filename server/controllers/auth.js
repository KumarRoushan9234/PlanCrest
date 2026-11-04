import crypto from "crypto";
import User from "../models/user.js";
import { hashPassword, comparePassword } from "../utils/auth.js";
import { sendSimpleEmail } from "../utils/mailService.js";
import { setAuthCookie, clearAuthCookie, signSessionToken } from "../utils/session.js";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateCode = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
const hashCode = (code) => crypto.createHash("sha256").update(String(code).trim()).digest("hex");
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const codeEmail = ({ heading, intro, code, expiry }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">${heading}</h1>
    </div>
    <div style="padding: 30px; background: #f8f9fa;">
      <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${intro}</p>
      <div style="background: #fff; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</div>
      </div>
      <p style="color: #666; line-height: 1.6; font-size: 14px;">
        This code expires in ${expiry}. If you didn't request it, you can ignore this email.
      </p>
    </div>
  </div>
`;

const sendVerificationEmail = (email, code) =>
  sendSimpleEmail({
    to: email,
    subject: "Verify your email - PlanCrest",
    html: codeEmail({
      heading: "Welcome to PlanCrest!",
      intro: "Use the code below to verify your email address:",
      code,
      expiry: "24 hours",
    }),
    text: `Your PlanCrest verification code is ${code}. It expires in 24 hours.`,
  });

const sanitizeUser = (user) => {
  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  delete data.verificationCode;
  delete data.verificationCodeExpires;
  delete data.passwordResetCode;
  delete data.passwordResetCodeExpires;
  return data;
};

export const register = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!name || !EMAIL_RE.test(email) || typeof password !== "string") {
      return res.status(400).json({ error: "Name, a valid email, and a password are required" });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser?.isVerified) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const code = generateCode();
    const fields = {
      name,
      password: await hashPassword(password),
      verificationCode: hashCode(code),
      verificationCodeExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
    };

    // An unverified account can be re-registered (e.g. the first email never arrived)
    if (existingUser) {
      Object.assign(existingUser, fields);
      await existingUser.save();
    } else {
      await User.create({ ...fields, email, isVerified: false });
    }

    const emailResult = await sendVerificationEmail(email, code);
    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      return res.json({
        message: "Account created but the verification email could not be sent. Try resending it.",
        warning: "Email delivery failed",
      });
    }
    return res.json({ message: "Verification code sent to email" });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (user && !user.isVerified) {
      const code = generateCode();
      user.verificationCode = hashCode(code);
      user.verificationCodeExpires = new Date(Date.now() + VERIFICATION_TTL_MS);
      await user.save();
      await sendVerificationEmail(email, code);
    }

    // Same response either way so this can't be used to discover accounts
    res.json({ message: "If that account needs verification, a new code has been sent." });
  } catch (error) {
    console.error("Error resending verification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const user = await User.findOne({
      email,
      verificationCode: hashCode(code),
      verificationCodeExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired code" });

    user.isVerified = true;
    user.verificationCode = "";
    user.verificationCodeExpires = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email }).exec();
    const match = user ? await comparePassword(password, user.password) : false;
    if (!user || !match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ error: "Email not verified" });
    }

    const token = signSessionToken(user);
    setAuthCookie(res, token);

    res.json({ ...sanitizeUser(user), token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(res);
  res.set("Cache-Control", "no-store");
  return res.json({ success: true, message: "Signout success" });
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id).exec();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(sanitizeUser(user));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (user) {
      const code = generateCode();
      user.passwordResetCode = hashCode(code);
      user.passwordResetCodeExpires = new Date(Date.now() + RESET_TTL_MS);
      await user.save();

      const emailResult = await sendSimpleEmail({
        to: email,
        subject: "Reset your password - PlanCrest",
        html: codeEmail({
          heading: "Password Reset Request",
          intro: "Use the code below to reset your password:",
          code,
          expiry: "1 hour",
        }),
        text: `Your PlanCrest password reset code is ${code}. It expires in 1 hour.`,
      });
      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
      }
    }

    // Same response whether or not the account exists
    return res.json({
      ok: true,
      message: "If an account exists for that email, a reset code has been sent. Check your spam folder too.",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ error: "Error sending email" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { code, newPassword } = req.body;

    if (!email || !code || typeof newPassword !== "string") {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    const user = await User.findOne({
      email,
      passwordResetCode: hashCode(code),
      passwordResetCodeExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired code." });
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetCode = "";
    user.passwordResetCodeExpires = undefined;
    // Completing a reset proves ownership of the inbox
    user.isVerified = true;
    await user.save();

    res.json({ ok: true, message: "Password reset successful." });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Error! Try again." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, gender } = req.body;
    const userId = req.auth._id;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Name is required." });
    }

    const updateData = { name: String(name).trim() };
    if (gender && ["male", "female", "not specified"].includes(gender)) {
      updateData.gender = gender;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.auth._id;

    if (!currentPassword || typeof newPassword !== "string") {
      return res
        .status(400)
        .json({ error: "Both current and new passwords are required." });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await comparePassword(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
