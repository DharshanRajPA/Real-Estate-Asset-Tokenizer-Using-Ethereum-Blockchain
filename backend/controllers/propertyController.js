import Property from "../models/Property.js";
import dotenv from "dotenv";
dotenv.config();

export const createProperty = async (req, res) => {
  try {
    const {
      propertyName,
      propertyLocation,
      propertyPrice,
      propertyTokens,
      pricePerToken,
      walletAddress,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const imageBase64 = req.file.buffer.toString("base64");

    // Save property to DB only (no blockchain logic)
    const newProperty = new Property({
      propertyName,
      propertyLocation,
      propertyPrice,
      propertyTokens,
      pricePerToken,
      tokenHolders: [
        {
          holderId: req.user._id,
          tokensHeld: propertyTokens,
          tokensWillingToSell: propertyTokens,
        },
      ],
      propertyImage: imageBase64,
    });

    await newProperty.save();

    return res.status(201).json({
      message: "✅ Property created successfully",
      property: newProperty,
    });
  } catch (err) {
    console.error("❌ Error creating property:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
