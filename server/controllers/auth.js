import User from "../models/user.js";
import { hashPassword, comparePassword } from "../utils/auth.js";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already exists" });

    // Generate email verification code
    const verificationCode = nanoid(6).toUpperCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store the user in a temporary collection (or store `isVerified: false`)
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false, // New field to track verification
      verificationCode,
      totalProspectsFetched: 0,
      totalProspectsMailed: 0,
      totalProject: 0,
      userPlan: "free",
    });
    await newUser.save();

    // Send verification email
    let transporterConfig;

    // Nodemailer configuration
    switch (process.env.EMAIL_SERVICE) {
      case "gmail":
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "outlook":
        transporterConfig = {
          service: "hotmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "yahoo":
        transporterConfig = {
          service: "yahoo",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "zoho":
        transporterConfig = {
          host: "smtp.zoho.in",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      default:
        throw new Error(
          `Unsupported email service: ${process.env.EMAIL_SERVICE}`
        );
    }

    // Create transporter
    const transporter = nodemailer.createTransport(transporterConfig);

    

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification for DevStream",
      html: `
        <html>
          <h1>Email Verification</h1>
          <p>Use this code to verify your email:</p>
          <h2 style="color:red;">${verificationCode}</h2>
          <i>devStream.org</i>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ message: "Verification code sent to email" });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Find user with the code
    const user = await User.findOne({ email, verificationCode: code });
    if (!user) return res.status(400).json({ error: "Invalid code or email" });

    // Mark user as verified
    user.isVerified = true;
    user.verificationCode = "";
    await user.save();

    return res.json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).send("Email and password are required.");
    }

    // Check if the user exists
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(400).send("No user found.");
    }

    if (!user.isVerified)
      return res.status(400).json({ error: "Email not verified" });

    // Check password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).send("Incorrect password."); // Respond before proceeding further
    }

    // Create signed JWT
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Exclude sensitive data
    user.password = undefined;

    // Send token in cookie with cross-origin support
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production (HTTPS)
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Allow cross-origin in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send user and token as JSON response
    res.json({
      ...user.toObject(),
      token: token, // Also send token in response for cross-origin compatibility
    });
  } catch (err) {
    console.error("Login Error:", err); // Log the error for debugging
    res.status(500).send("Something went wrong. Please try again.");
  }
};

export const logout = async (req, res) => {
  try {
    console.log("🚪 Logout request received");

    // Clear cookie with same options as when it was set
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/", // Ensure we clear from root path
    });

    console.log("🍪 Cookie cleared");

    // Set cache headers to prevent caching
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    console.log("✅ Logout successful");

    return res.status(200).json({
      success: true,
      message: "Signout success",
      timestamp: new Date().toISOString(), // Add timestamp to prevent caching
    });
  } catch (err) {
    console.error("❌ Logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id).select("-password").exec();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Return actual user data instead of just { ok: true }
    return res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate a short code
    const shortCode = nanoid(6).toUpperCase();

    // Find the user and update the passwordResetCode
    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetCode: shortCode },
      { new: true } // Returns the updated document
    );
    if (!user) {
      return res.status(400).send("User not found");
    }

    let transporterConfig;

    // Nodemailer configuration
    switch (process.env.EMAIL_SERVICE) {
      case "gmail":
        transporterConfig = {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "outlook":
        transporterConfig = {
          service: "hotmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "yahoo":
        transporterConfig = {
          service: "yahoo",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      case "zoho":
        transporterConfig = {
          host: "smtp.zoho.in",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        };
        break;

      default:
        throw new Error(
          `Unsupported email service: ${process.env.EMAIL_SERVICE}`
        );
    }

    // Create transporter
    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify connection configuration
    await transporter.verify();

    // Email details
    const mailDetails = {
      from: process.env.EMAIL_USER, // Sender email address
      to: email, // Recipient email address
      subject: "Reset Password",
      html: `
        <html>
          <h1>Reset Password</h1>
          <p>Use this code to reset your password:</p>
          <h2 style="color:red;">${shortCode}</h2>
          <i>devStream.org</i>
        </html>
      `,
    };

    // Send the email
    await transporter.sendMail(mailDetails);
    console.log("Email sent successfully");

    // Respond to the client
    res.json({
      ok: true,
      message:
        "Reset code sent to email successfully, If not received Check SPAM.",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Error sending email");
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Validate input
    if (!email || !code || !newPassword) {
      return res.status(400).send("All fields are required.");
    }

    // Check if user exists and code matches
    const user = await User.findOne({ email, passwordResetCode: code });
    if (!user) {
      return res.status(400).send("Wrong code entered or user not found.");
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password and clear the reset code
    await User.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        passwordResetCode: "",
      }
    );

    res.json({ ok: true, message: "Password reset successful." });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).send("Error! Try again.");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, gender } = req.body;
    const userId = req.auth._id;

    // Validate input
    if (!name) {
      return res.status(400).json({ error: "Name is required." });
    }

    // Prepare update object with only valid fields
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (gender && ["male", "female", "not specified"].includes(gender)) {
      updateData.gender = gender;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
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

    // Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both current and new passwords are required." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long." });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const match = await comparePassword(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
