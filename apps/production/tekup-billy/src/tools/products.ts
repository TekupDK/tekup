/**
 * Product management tools for Billy.dk MCP server
 * Implements list and create product functionality
 */

import { z } from "zod";
import { BillyClient } from "../billy-client.js";
import { dataLogger } from "../utils/data-logger.js";
import { extractBillyErrorMessage } from "../utils/error-handler.js";
import { log } from "../utils/logger.js";

// Input schemas for validation
const listProductsSchema = z.object({
  search: z
    .string()
    .optional()
    .describe("Search term to filter products by name"),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Maximum number of products to return (default: 20, max: 100)"),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Number of products to skip for pagination (default: 0)"),
});

const createProductSchema = z.object({
  name: z.string().describe("Product name"),
  description: z.string().optional().describe("Product description"),
  prices: z
    .array(
      z.object({
        unitPrice: z.number().describe("Unit price"),
        currencyId: z
          .string()
          .optional()
          .describe("Currency ID (default: DKK)"),
      })
    )
    .min(1)
    .describe("Product prices"),
});

/**
 * List products with optional search filtering
 */
export async function listProducts(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const params = listProductsSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: "listProducts",
      tool: "products",
      parameters: params,
    });

    let products = await client.getProducts(params.search);

    // Add null checks
    if (!products || !Array.isArray(products)) {
      log.error("Invalid products response from Billy API", null, { products });
      throw new Error(
        "Invalid response format from Billy API - expected array of products"
      );
    }

    // Client-side filtering fallback if Billy API doesn't filter correctly
    // This ensures search works even if Billy API returns all products
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim().toLowerCase();
      const originalCount = products.length;
      
      products = products.filter((product) => {
        const name = (product.name || "").toLowerCase();
        const productNo = (product.productNo || "").toLowerCase();
        const description = (product.description || "").toLowerCase();
        
        return (
          name.includes(searchTerm) ||
          productNo.includes(searchTerm) ||
          description.includes(searchTerm)
        );
      });
      
      if (products.length === originalCount && originalCount > 10) {
        // Billy API likely didn't filter - log for debugging
        log.debug("Client-side filtering applied (products)", {
          searchTerm,
          originalCount,
          filteredCount: products.length,
        });
      }
    }

    // Apply pagination
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    const totalCount = products.length;
    const paginatedProducts = products.slice(offset, offset + limit);

    const productList = paginatedProducts.map((product) => ({
      id: product.id,
      productNo: product.productNo,
      name: product.name,
      description: product.description,
      account: product.account,
      prices: (product.prices || []).map((price) => ({
        currencyId: price.currencyId,
        unitPrice: price.unitPrice,
      })),
    }));

    // Log successful completion
    await dataLogger.logAction({
      action: "listProducts",
      tool: "products",
      parameters: params,
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
        dataSize: productList.length,
      },
    });

    // Build response with pagination info
    const responseData = {
      success: true,
      count: totalCount,
      products: productList,
      pagination: {
        total: totalCount,
        limit,
        offset,
        returned: productList.length,
        hasMore: offset + limit < totalCount,
      },
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(responseData),
        },
      ],
      structuredContent: responseData,
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("listProducts error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    await dataLogger.logAction({
      action: "listProducts",
      tool: "products",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error listing products: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Create a new product
 */
export async function createProduct(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const productData = createProductSchema.parse(args);

    // Log the action
    await dataLogger.logAction({
      action: "createProduct",
      tool: "products",
      parameters: productData,
    });

    const product = await client.createProduct(productData);

    // Log successful completion
    await dataLogger.logAction({
      action: "createProduct",
      tool: "products",
      parameters: productData,
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const responseData = {
      success: true,
      message: "Product created successfully",
      product: {
        id: product.id,
        productNo: product.productNo,
        name: product.name,
        description: product.description,
        account: product.account,
        prices: product.prices,
        organizationId: product.organizationId,
      },
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(responseData),
        },
      ],
      structuredContent: responseData,
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("createProduct error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    await dataLogger.logAction({
      action: "createProduct",
      tool: "products",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error creating product: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

// Sprint 1: Update product tool

const updateProductSchema = z.object({
  productId: z.string().describe("Product ID to update"),
  name: z.string().optional().describe("Product name"),
  description: z.string().optional().describe("Product description"),
  prices: z
    .array(
      z.object({
        unitPrice: z.number().describe("Unit price"),
        currencyId: z
          .string()
          .optional()
          .describe("Currency ID (default: DKK)"),
      })
    )
    .optional()
    .describe("Product prices"),
});

/**
 * Update an existing product
 */
export async function updateProduct(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  try {
    const { productId, ...updateData } = updateProductSchema.parse(args);

    await dataLogger.logAction({
      action: "updateProduct",
      tool: "products",
      parameters: { productId, updateData },
    });

    const product = await client.updateProduct(productId, updateData);

    await dataLogger.logAction({
      action: "updateProduct",
      tool: "products",
      parameters: { productId, updateData },
      result: "success",
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

    const responseData = {
      success: true,
      message: "Product updated successfully",
      product: {
        id: product.id,
        productNo: product.productNo,
        name: product.name,
        description: product.description,
        account: product.account,
        prices: product.prices,
      },
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(responseData),
        },
      ],
      structuredContent: responseData,
    };
  } catch (error: any) {
    const errorMessage = extractBillyErrorMessage(error);
    log.error("updateProduct error", error, {
      userMessage: errorMessage,
      billyErrorCode: error.billyDetails?.billyErrorCode,
    });

    await dataLogger.logAction({
      action: "updateProduct",
      tool: "products",
      parameters: args,
      result: "error",
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Error updating product: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}
