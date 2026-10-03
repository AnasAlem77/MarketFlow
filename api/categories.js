const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    const categories = await sql`
      SELECT
        id,
        name_en,
        name_id,
        icon,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM categories
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, id ASC
    `;

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Categories API error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};