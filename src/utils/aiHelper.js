const CONDITION_MULTIPLIERS = {
  New: 1.0,
  "Like New": 0.85,
  Good: 0.7,
  Fair: 0.55,
  Used: 0.4,
};

const BASE_PRICES = {
  Electronics: 5000,
  Furniture: 3000,
  Vehicles: 50000,
  Fashion: 1500,
  Books: 500,
  Sports: 2000,
  "Home Appliances": 4000,
  Others: 1000,
};

function detectCategory(productName) {
  const name = productName.toLowerCase();
  if (/phone|laptop|tv|camera|electronic|tablet|computer/.test(name)) return "Electronics";
  if (/chair|table|sofa|bed|desk|furniture/.test(name)) return "Furniture";
  if (/car|bike|scooter|vehicle|motor/.test(name)) return "Vehicles";
  if (/shirt|dress|shoe|jacket|fashion|clothing/.test(name)) return "Fashion";
  if (/book|novel|textbook/.test(name)) return "Books";
  if (/ball|bat|racket|gym|sport/.test(name)) return "Sports";
  if (/fridge|washing|microwave|appliance/.test(name)) return "Home Appliances";
  return "Others";
}

export async function generateProductDescription(productName, condition) {
  const category = detectCategory(productName);
  const title = `${condition} ${productName} - Great Deal!`;
  const description = `Selling my ${condition.toLowerCase()} ${productName}. Well-maintained item in the ${category} category. Perfect for local buyers in your neighborhood. Contact me for more details or to arrange a pickup.`;
  const tags = [category, condition, productName.split(" ")[0], "local", "neighbormart"];

  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Generate a product listing for "${productName}" in "${condition}" condition. Return JSON with keys: title, description, tags (array).`,
            },
          ],
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
        return parsed;
      }
    } catch {
      // fall through to mock
    }
  }

  return { title, description, tags };
}

export async function suggestPrice(productName, condition) {
  const category = detectCategory(productName);
  const base = BASE_PRICES[category] || 1000;
  const multiplier = CONDITION_MULTIPLIERS[condition] || 0.6;
  const suggested = Math.round(base * multiplier);
  const min = Math.round(suggested * 0.8);
  const max = Math.round(suggested * 1.2);

  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Suggest market price in INR for "${productName}" in "${condition}" condition. Return JSON: { suggestedPrice, minPrice, maxPrice }`,
            },
          ],
          temperature: 0.5,
        }),
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
        return {
          suggestedPrice: parsed.suggestedPrice,
          minPrice: parsed.minPrice,
          maxPrice: parsed.maxPrice,
          category,
        };
      }
    } catch {
      // fall through
    }
  }

  return { suggestedPrice: suggested, minPrice: min, maxPrice: max, category };
}
