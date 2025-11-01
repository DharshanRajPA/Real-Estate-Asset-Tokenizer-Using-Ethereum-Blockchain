import Property from "../models/Property.js";

export const updateTokenHolders = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { tokensBought } = req.body;

    // Get buyer's MongoDB ID from auth middleware
    const buyerId = req.user.id;

    if (!tokensBought || !buyerId) {
      return res
        .status(400)
        .json({ message: "Missing tokensBought or authenticated user ID" });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    let tokensToDeduct = tokensBought;

    // Deduct tokens from sellers
    for (const holder of property.tokenHolders) {
      if (tokensToDeduct <= 0) break;

      const availableToSell = holder.tokensWillingToSell || 0;
      if (availableToSell > 0) {
        const deduction = Math.min(availableToSell, tokensToDeduct);
        holder.tokensWillingToSell -= deduction;
        holder.tokensHeld -= deduction;
        tokensToDeduct -= deduction;
      }
    }

    // Add or update buyer's holding
    const existingBuyer = property.tokenHolders.find(
      (holder) => holder.holderId.toString() === buyerId
    );

    if (existingBuyer) {
      existingBuyer.tokensHeld += tokensBought;
      existingBuyer.tokensWillingToSell += tokensBought;
    } else {
      property.tokenHolders.push({
        holderId: buyerId,
        tokensHeld: tokensBought,
        tokensWillingToSell: tokensBought,
      });
    }

    await property.save();

    return res.status(200).json({
      message: "✅ Token holders updated successfully",
      updatedProperty: property,
    });
  } catch (err) {
    console.error("❌ Error updating token holders:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
