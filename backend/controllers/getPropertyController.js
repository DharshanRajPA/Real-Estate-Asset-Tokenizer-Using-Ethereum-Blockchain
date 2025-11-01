import Property from "../models/Property.js";

export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving property", error: err.message });
  }
};
