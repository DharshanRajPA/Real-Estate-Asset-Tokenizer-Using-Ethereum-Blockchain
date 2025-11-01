import User from "../models/Users.js";

// @desc    Get user profile with tokensHeld data
// @route   GET /api/user/:id
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const user = await User.findById(id).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      fullName: user.fullName,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      tokensHeld: user.tokensHeld || {},
    });
  } catch (err) {
    console.error("User fetch error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
