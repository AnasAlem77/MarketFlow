const { neon } = require("@neondatabase/serverless");
const { requireAdmin } = require("../lib/admin-auth");

const sql = neon(process.env.DATABASE_URL);
const ALLOWED_ICONS = new Set([
  "📱", "👕", "🏠", "💄", "⚽", "🎮", "🎧", "⌚", "📚", "🚗",
]);

function sendError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateCategory(body = {}) {
  const nameEn = typeof body.name_en === "string" ? body.name_en.trim() : "";
  const nameId = typeof body.name_id === "string" ? body.name_id.trim() : "";
  const icon = typeof body.icon === "string" ? body.icon.trim() : "";

  if (!nameEn || !nameId) {
    return { error: "English and Indonesian category names are required" };
  }

  if (nameEn.length > 100 || nameId.length > 100) {
    return { error: "Category names must be 100 characters or fewer" };
  }

  if (!ALLOWED_ICONS.has(icon)) {
    return { error: "Invalid category icon" };
  }

  if (typeof body.is_active !== "boolean") {
    return { error: "Category active status must be a boolean" };
  }

  return { nameEn, nameId, icon, isActive: body.is_active };
}

async function findDuplicateCategory(nameEn, nameId, excludedId = null) {
  const matches = excludedId
    ? await sql`
        SELECT id FROM categories
        WHERE id <> ${excludedId}
          AND (LOWER(name_en) = LOWER(${nameEn}) OR LOWER(name_id) = LOWER(${nameId}))
        LIMIT 1
      `
    : await sql`
        SELECT id FROM categories
        WHERE LOWER(name_en) = LOWER(${nameEn}) OR LOWER(name_id) = LOWER(${nameId})
        LIMIT 1
      `;

  return matches[0] || null;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const isAdminRequest = req.query?.admin === "true";

      if (isAdminRequest && !requireAdmin(req, res)) {
        return;
      }

      const categories = isAdminRequest
        ? await sql`
            SELECT id, name_en, name_id, icon, is_active, sort_order, created_at, updated_at
            FROM categories ORDER BY sort_order ASC, id ASC
          `
        : await sql`
            SELECT id, name_en, name_id, icon, is_active, sort_order, created_at, updated_at
            FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC
          `;

      return res.status(200).json({
        success: true,
        count: categories.length,
        categories,
      });
    }

    if (!requireAdmin(req, res)) {
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      const category = validateCategory(req.body);

      if (category.error) {
        return sendError(res, 400, category.error);
      }

      const id = req.method === "PUT" ? parseId(req.body?.id) : null;

      if (req.method === "PUT" && !id) {
        return sendError(res, 400, "Invalid category ID");
      }

      if (await findDuplicateCategory(category.nameEn, category.nameId, id)) {
        return sendError(res, 409, "A category with that name already exists");
      }

      const result = req.method === "POST"
        ? await sql`
            INSERT INTO categories (name_en, name_id, icon, is_active)
            VALUES (${category.nameEn}, ${category.nameId}, ${category.icon}, ${category.isActive})
            RETURNING id, name_en, name_id, icon, is_active, sort_order, created_at, updated_at
          `
        : await sql`
            UPDATE categories
            SET name_en = ${category.nameEn}, name_id = ${category.nameId},
                icon = ${category.icon}, is_active = ${category.isActive},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING id, name_en, name_id, icon, is_active, sort_order, created_at, updated_at
          `;

      if (result.length === 0) {
        return sendError(res, 404, "Category not found");
      }

      return res.status(req.method === "POST" ? 201 : 200).json({
        success: true,
        message: req.method === "POST" ? "Category created successfully" : "Category updated successfully",
        category: result[0],
      });
    }

    return sendError(res, 405, "Method not allowed");
  } catch (error) {
    console.error("Categories API error:", error);
    return sendError(res, 500, "Database operation failed");
  }
};
