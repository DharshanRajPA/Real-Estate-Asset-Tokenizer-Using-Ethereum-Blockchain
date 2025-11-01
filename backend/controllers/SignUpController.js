import User from "../models/Users.js";
import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

export const registerUser = async (req, res) => {
  const { fullName, email, password, walletAddress, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      fullName,
      email,
      password,
      walletAddress,
      role: role === "ADMIN" ? "ADMIN" : "CLIENT", // ✅ fallback
    });

    await newUser.save();

    const token = generateToken(newUser._id, newUser.role); // ✅ Include role in JWT

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      walletAddress: newUser.walletAddress,
      role: newUser.role,
      token,
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
