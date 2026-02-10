import { describe, it, expect } from "vitest";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
} from "./errors";

describe("AppError", () => {
  it("sets message and default statusCode 500", () => {
    const error = new AppError("Something broke");
    expect(error.message).toBe("Something broke");
    expect(error.statusCode).toBe(500);
  });

  it("sets custom statusCode", () => {
    const error = new AppError("Custom error", 418);
    expect(error.statusCode).toBe(418);
  });

  it("sets error code", () => {
    const error = new AppError("Custom error", 500, "CUSTOM_CODE");
    expect(error.code).toBe("CUSTOM_CODE");
  });

  it("is an instance of Error", () => {
    const error = new AppError("test");
    expect(error).toBeInstanceOf(Error);
  });

  it("has a stack trace", () => {
    const error = new AppError("test");
    expect(error.stack).toBeDefined();
  });
});

describe("AuthenticationError", () => {
  it("defaults to 401 and AUTH_ERROR code", () => {
    const error = new AuthenticationError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("AUTH_ERROR");
    expect(error.message).toBe("Authentication failed");
  });

  it("accepts custom message", () => {
    const error = new AuthenticationError("Token expired");
    expect(error.message).toBe("Token expired");
    expect(error.statusCode).toBe(401);
  });

  it("is an instance of AppError", () => {
    expect(new AuthenticationError()).toBeInstanceOf(AppError);
  });
});

describe("AuthorizationError", () => {
  it("defaults to 403 and FORBIDDEN code", () => {
    const error = new AuthorizationError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toBe("Access denied");
  });

  it("is an instance of AppError", () => {
    expect(new AuthorizationError()).toBeInstanceOf(AppError);
  });
});

describe("NotFoundError", () => {
  it("defaults to 404 and NOT_FOUND code", () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Resource not found");
  });

  it("accepts custom message", () => {
    const error = new NotFoundError("User not found");
    expect(error.message).toBe("User not found");
  });

  it("is an instance of AppError", () => {
    expect(new NotFoundError()).toBeInstanceOf(AppError);
  });
});

describe("ValidationError", () => {
  it("defaults to 400 and VALIDATION_ERROR code", () => {
    const error = new ValidationError();
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Validation failed");
  });

  it("accepts custom message and errors array", () => {
    const errors = [{ field: "email", message: "Invalid" }];
    const error = new ValidationError("Bad input", errors);
    expect(error.message).toBe("Bad input");
    expect(error.errors).toEqual(errors);
  });

  it("is an instance of AppError", () => {
    expect(new ValidationError()).toBeInstanceOf(AppError);
  });
});

describe("ConflictError", () => {
  it("defaults to 409 and CONFLICT code", () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
    expect(error.message).toBe("Resource already exists");
  });

  it("is an instance of AppError", () => {
    expect(new ConflictError()).toBeInstanceOf(AppError);
  });
});

describe("RateLimitError", () => {
  it("defaults to 429 and RATE_LIMIT code", () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("RATE_LIMIT");
    expect(error.message).toBe("Too many requests");
  });

  it("is an instance of AppError", () => {
    expect(new RateLimitError()).toBeInstanceOf(AppError);
  });
});
