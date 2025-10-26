import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  sortBy: string;
  sortOrder?: "asc" | "desc";
  where?: any;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: string;
    previousCursor?: string;
    total?: number;
  };
}

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

@Injectable()
export class PaginationService {
  private readonly defaultLimit = 20;
  private readonly maxLimit = 100;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create offset-based pagination for simple use cases
   */
  async paginate<T>(
    model: any,
    options: PaginationOptions & { where?: any; include?: any; select?: any }
  ): Promise<PaginationResult<T>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(
      this.maxLimit,
      Math.max(1, options.limit || this.defaultLimit)
    );
    const skip = (page - 1) * limit;

    const where = options.where || {};
    const include = options.include;
    const select = options.select;

    // Build orderBy clause
    const orderBy = this.buildOrderBy(options.sortBy, options.sortOrder);

    // Execute count and data queries in parallel
    const [total, data] = await Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        include,
        select,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Create cursor-based pagination for better performance on large datasets
   */
  async paginateWithCursor<T>(
    model: any,
    options: CursorPaginationOptions & { include?: any; select?: any }
  ): Promise<CursorPaginationResult<T>> {
    const limit = Math.min(
      this.maxLimit,
      Math.max(1, options.limit || this.defaultLimit)
    );
    const sortBy = options.sortBy || "id";
    const sortOrder = options.sortOrder || "desc";

    const where = options.where || {};
    const include = options.include;
    const select = options.select;

    // Build cursor condition
    const cursorCondition = this.buildCursorCondition(
      options.cursor,
      sortBy,
      sortOrder
    );
    if (cursorCondition) {
      where.AND = where.AND
        ? [...where.AND, cursorCondition]
        : [cursorCondition];
    }

    // Build orderBy clause
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    // Fetch one extra item to determine if there's a next page
    const data = await model.findMany({
      where,
      include,
      select,
      take: limit + 1,
      orderBy,
    });

    const hasNext = data.length > limit;
    const items = hasNext ? data.slice(0, limit) : data;

    // Generate cursors
    const nextCursor =
      hasNext && items.length > 0
        ? this.generateCursor(items[items.length - 1], sortBy)
        : undefined;

    const previousCursor =
      items.length > 0 && options.cursor
        ? this.generateCursor(items[0], sortBy)
        : undefined;

    return {
      data: items,
      pagination: {
        limit,
        hasNext,
        hasPrevious: !!options.cursor,
        nextCursor,
        previousCursor,
      },
    };
  }

  /**
   * Create hybrid pagination with both offset and cursor support
   */
  async paginateHybrid<T>(
    model: any,
    options: PaginationOptions &
      CursorPaginationOptions & {
        include?: any;
        select?: any;
        where?: any;
        includeTotalCount?: boolean;
      }
  ): Promise<CursorPaginationResult<T> & { totalCount?: number }> {
    const useCursor = !!options.cursor;

    if (useCursor) {
      const result = await this.paginateWithCursor<T>(model, options);

      // Optionally include total count for cursor pagination
      if (options.includeTotalCount) {
        const total = await model.count({ where: options.where || {} });
        return { ...result, totalCount: total };
      }

      return result;
    } else {
      // Convert offset pagination to cursor format
      const offsetResult = await this.paginate<T>(model, options);

      return {
        data: offsetResult.data,
        pagination: {
          limit: offsetResult.pagination.limit,
          hasNext: offsetResult.pagination.hasNext,
          hasPrevious: offsetResult.pagination.hasPrevious,
          nextCursor:
            offsetResult.data.length > 0
              ? this.generateCursor(
                  offsetResult.data[offsetResult.data.length - 1],
                  options.sortBy || "id"
                )
              : undefined,
          previousCursor:
            offsetResult.data.length > 0 && offsetResult.pagination.page > 1
              ? this.generateCursor(
                  offsetResult.data[0],
                  options.sortBy || "id"
                )
              : undefined,
          total: offsetResult.pagination.total,
        },
        totalCount: offsetResult.pagination.total,
      };
    }
  }

  /**
   * Build orderBy clause from sort parameters
   */
  private buildOrderBy(sortBy?: string, sortOrder?: "asc" | "desc"): any {
    if (!sortBy) {
      return { id: "desc" }; // Default sort
    }

    // Handle nested sorting (e.g., 'user.name')
    if (sortBy.includes(".")) {
      const parts = sortBy.split(".");
      let orderBy: any = {};
      let current: any = orderBy;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = {};
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = sortOrder || "desc";
      return orderBy;
    }

    return { [sortBy]: sortOrder || "desc" };
  }

  /**
   * Build cursor condition for where clause
   */
  private buildCursorCondition(
    cursor?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ): any {
    if (!cursor || !sortBy) {
      return null;
    }

    try {
      const cursorValue = this.decodeCursor(cursor);
      const operator = sortOrder === "asc" ? "gt" : "lt";

      // Handle nested fields
      if (sortBy.includes(".")) {
        // For nested fields, we need to use a different approach
        // This is a simplified version - in practice, you might need more complex logic
        return {
          [sortBy.split(".")[0]]: {
            [sortBy.split(".")[1]]: { [operator]: cursorValue },
          },
        };
      }

      return { [sortBy]: { [operator]: cursorValue } };
    } catch (error) {
      throw new BadRequestException("Invalid cursor format");
    }
  }

  /**
   * Generate cursor from item
   */
  private generateCursor(item: any, sortBy: string): string {
    if (!item || !sortBy) {
      return "";
    }

    // Handle nested fields
    if (sortBy.includes(".")) {
      const parts = sortBy.split(".");
      let value = item;
      for (const part of parts) {
        value = value?.[part];
      }
      return this.encodeCursor(value);
    }

    return this.encodeCursor(item[sortBy]);
  }

  /**
   * Encode cursor value to base64
   */
  private encodeCursor(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }

    // Handle different data types
    let stringValue: string;
    if (value instanceof Date) {
      stringValue = value.toISOString();
    } else if (typeof value === "object") {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    return Buffer.from(stringValue).toString("base64");
  }

  /**
   * Decode cursor from base64
   */
  private decodeCursor(cursor: string): any {
    if (!cursor || cursor.trim() === "") {
      throw new BadRequestException("Invalid cursor format");
    }

    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf-8");

      // Try to parse as JSON first (for objects)
      try {
        return JSON.parse(decoded);
      } catch {
        // If not JSON, try to parse as date
        if (decoded.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          return new Date(decoded);
        }

        // If not date, try to parse as number
        const num = Number(decoded);
        if (!isNaN(num) && decoded.trim() !== "") {
          return num;
        }

        // Otherwise return as string
        return decoded;
      }
    } catch (error) {
      throw new BadRequestException("Invalid cursor format");
    }
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(options: PaginationOptions): void {
    if (
      options.page !== undefined &&
      (options.page < 1 || !Number.isInteger(options.page))
    ) {
      throw new BadRequestException("Page must be a positive integer");
    }

    if (
      options.limit !== undefined &&
      (options.limit < 1 ||
        options.limit > this.maxLimit ||
        !Number.isInteger(options.limit))
    ) {
      throw new BadRequestException(
        `Limit must be between 1 and ${this.maxLimit}`
      );
    }

    if (options.sortOrder && !["asc", "desc"].includes(options.sortOrder)) {
      throw new BadRequestException('Sort order must be "asc" or "desc"');
    }
  }

  /**
   * Create pagination metadata
   */
  createPaginationMeta(
    page: number,
    limit: number,
    total: number,
    nextCursor?: string,
    previousCursor?: string
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextCursor,
      previousCursor,
    };
  }

  /**
   * Get default pagination options
   */
  getDefaultOptions(): Required<Pick<PaginationOptions, "page" | "limit">> {
    return {
      page: 1,
      limit: this.defaultLimit,
    };
  }

  /**
   * Get maximum allowed limit
   */
  getMaxLimit(): number {
    return this.maxLimit;
  }
}
