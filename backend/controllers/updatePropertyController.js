// controllers/PropertyController.js

import Property from "../models/Property.js";

export const updateProperty = async (req, res) => {
  const propertyId = req.params.id;
  const { propertyName, propertyLocation } = req.body;

  try {
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Update fields
    if (propertyName) property.propertyName = propertyName;
    if (propertyLocation) property.propertyLocation = propertyLocation;

    // If a new image was uploaded
    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      property.propertyImage = base64Image;
    }

    await property.save();

    res
      .status(200)
      .json({ message: "Property updated successfully.", property });
  } catch (err) {
    console.error("Error updating property:", err);
    res.status(500).json({ message: "Server error while updating property." });
  }
};
