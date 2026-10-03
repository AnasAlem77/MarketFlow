const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

module.exports = async (req, res) => {
  try {
    // GET
    if (req.method === "GET") {
      const products = await sql`
        SELECT
          p.id,
          p.name,
          p.price,
          p.category_id,
          c.name_en AS category_name_en,
          c.name_id AS category_name_id,
          c.icon AS category_icon,
          p.image,
          p.shopee_link,
          p.description,
          p.is_featured,
          p.is_active,
          p.views,
          p.clicks,
          p.sort_order,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN categories c
          ON p.category_id = c.id
        ORDER BY p.sort_order ASC, p.created_at DESC
      `;

      const productsWithProxyImages = products.map((product) => {
        let image = product.image;

        if (
          image &&
          process.env.R2_PUBLIC_URL &&
          image.startsWith(process.env.R2_PUBLIC_URL)
        ) {
          const key = image.slice(
            process.env.R2_PUBLIC_URL.length + 1
          );

          image = `/api/image?key=${encodeURIComponent(key)}`;
        }

        return {
          ...product,
          image,
        };
      });

      return res.status(200).json({
        success: true,
        count: productsWithProxyImages.length,
        products: productsWithProxyImages,
      });
    }

    // POST
    if (req.method === "POST") {
      const {
        name,
        price,
        category_id,
        image,
        shopee_link,
        description,
        is_featured,
        is_active,
      } = req.body || {};

      if (!name || !String(name).trim()) {
        return sendError(res, 400, "Product name is required");
      }

      const numericPrice = Number(price);

      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return sendError(res, 400, "Invalid product price");
      }

      const numericCategoryId = Number(category_id);

      if (
        !Number.isFinite(numericCategoryId) ||
        numericCategoryId <= 0
      ) {
        return sendError(res, 400, "Invalid category");
      }

      if (!shopee_link || !String(shopee_link).trim()) {
        return sendError(res, 400, "Shopee link is required");
      }

      const result = await sql`
        INSERT INTO products (
          name,
          price,
          category_id,
          image,
          shopee_link,
          description,
          is_featured,
          is_active
        )
        VALUES (
          ${String(name).trim()},
          ${numericPrice},
          ${numericCategoryId},
          ${image ? String(image).trim() : null},
          ${String(shopee_link).trim()},
          ${description ? String(description).trim() : null},
          ${Boolean(is_featured)},
          ${is_active !== false}
        )
        RETURNING *
      `;

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: result[0],
      });
    }

    // PUT
    if (req.method === "PUT") {
      const {
        id,
        name,
        price,
        category_id,
        image,
        shopee_link,
        description,
        is_featured,
        is_active,
      } = req.body || {};

      const numericId = Number(id);

      if (!Number.isFinite(numericId) || numericId <= 0) {
        return sendError(res, 400, "Invalid product ID");
      }

      if (!name || !String(name).trim()) {
        return sendError(res, 400, "Product name is required");
      }

      const numericPrice = Number(price);

      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return sendError(res, 400, "Invalid product price");
      }

      const numericCategoryId = Number(category_id);

      if (
        !Number.isFinite(numericCategoryId) ||
        numericCategoryId <= 0
      ) {
        return sendError(res, 400, "Invalid category");
      }

      if (!shopee_link || !String(shopee_link).trim()) {
        return sendError(res, 400, "Shopee link is required");
      }

      const result = await sql`
        UPDATE products
        SET
          name = ${String(name).trim()},
          price = ${numericPrice},
          category_id = ${numericCategoryId},
          image = ${image ? String(image).trim() : null},
          shopee_link = ${String(shopee_link).trim()},
          description = ${
            description ? String(description).trim() : null
          },
          is_featured = ${Boolean(is_featured)},
          is_active = ${Boolean(is_active)},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${numericId}
        RETURNING *
      `;

      if (result.length === 0) {
        return sendError(res, 404, "Product not found");
      }

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: result[0],
      });
    }

    // DELETE
    if (req.method === "DELETE") {
      const numericId = Number(
        req.body?.id ?? req.query?.id
      );

      if (!Number.isFinite(numericId) || numericId <= 0) {
        return sendError(res, 400, "Invalid product ID");
      }

      const result = await sql`
        DELETE FROM products
        WHERE id = ${numericId}
        RETURNING id, name
      `;

      if (result.length === 0) {
        return sendError(res, 404, "Product not found");
      }

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        product: result[0],
      });
    }

    return sendError(res, 405, "Method not allowed");
  } catch (error) {
    console.error("Products API error:", error);

    return res.status(500).json({
      success: false,
      message: "Database operation failed",
    });
  }
};