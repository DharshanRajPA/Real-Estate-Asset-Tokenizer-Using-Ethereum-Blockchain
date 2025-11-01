import mongoose from "mongoose";

const tokenHolderSchema = new mongoose.Schema(
  {
    holderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokensHeld: { type: Number, required: true },
    tokensWillingToSell: { type: Number, default: 0 },
  },
  { _id: false } // Prevents automatic generation of _id for subdocs
);

const propertySchema = new mongoose.Schema({
  propertyName: { type: String, required: true },
  propertyLocation: { type: String, required: true },
  propertyPrice: { type: Number, required: true },
  propertyTokens: { type: Number, required: true },
  pricePerToken: { type: Number, required: true },
  tokenHolders: [tokenHolderSchema],
  propertyImage: { type: String }, // base64 string
  createdAt: { type: Date, default: Date.now },
});

const Property = mongoose.model("Property", propertySchema);
export default Property;
