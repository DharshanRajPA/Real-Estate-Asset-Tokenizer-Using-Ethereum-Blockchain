import User from "../models/Users.js";

export const updateTokensHeld = async (req, res) => {
  const userId = req.user._id; // Comes from JWT via `protect` middleware
  const { propertyId, tokensBought } = req.body;

  if (!propertyId || typeof tokensBought !== "number") {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const current = user.tokensHeld.get(propertyId) || 0;
    user.tokensHeld.set(propertyId, current + tokensBought);
    await user.save();

    res.status(200).json({ message: "tokensHeld updated" });
  } catch (err) {
    console.error("Error updating tokensHeld:", err);
    res.status(500).json({ message: "Server error" });
  }
};
