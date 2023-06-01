const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    hospitalEmail: { type: String, required: false },
    productName: { type: String, required: false },
    price: { type: Number, required: false },
    images: { type: String, required: false },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Product = mongoose.model("product", productSchema);

module.exports = Product;
