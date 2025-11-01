// controllers/propertyController.js
import Property from "../models/Property.js";

export const createProperty = async (req, res) => {
  try {
    const { title, description, price, location } = req.body;
    const image = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      : "";

    const newProperty = new Property({
      title,
      description,
      price,
      location,
      image,
    });

    await newProperty.save();
    res.status(201).json({
      message: "Property created successfully",
      property: newProperty,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating property" });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
};
