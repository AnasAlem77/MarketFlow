const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

module.exports = async (req, res) => {
  try {
    const result = await sql`SELECT version()`;

    res.status(200).json({
      success: true,
      message: "Connected to Neon successfully",
      database: result[0].version,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
};