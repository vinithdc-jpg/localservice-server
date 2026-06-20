import { generateProductDescription, suggestPrice } from "../utils/aiHelper.js";

export const generateDescription = async (req, res) => {
  try {
    const { productName, condition } = req.body;
    if (!productName || !condition) {
      return res.status(400).json({ success: false, message: "Product name and condition required" });
    }

    const result = await generateProductDescription(productName, condition);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPriceSuggestion = async (req, res) => {
  try {
    const { productName, condition } = req.body;
    if (!productName || !condition) {
      return res.status(400).json({ success: false, message: "Product name and condition required" });
    }

    const result = await suggestPrice(productName, condition);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
