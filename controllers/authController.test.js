import {
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "./authController.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { hashPassword } from "../helpers/authHelper.js";

// Mock dependencies
jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("../helpers/authHelper.js");

describe("updateProfileController", () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "newpassword123",
        address: "123 Test St",
        phone: "1234567890",
      },
      user: {
        _id: "user123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    // Mock user model methods
    userModel.findById.mockResolvedValue({
      _id: "user123",
      name: "Original Name",
      password: "hashedoldpassword",
      phone: "0987654321",
      address: "Original Address",
    });

    userModel.findByIdAndUpdate.mockResolvedValue({
      _id: "user123",
      name: "Test User",
      password: "hashednewpassword",
      phone: "1234567890",
      address: "123 Test St",
    });

    // Mock hash password function
    hashPassword.mockResolvedValue("hashednewpassword");
  });

  test("should update user profile successfully with all fields", async () => {
    // Call the controller
    await updateProfileController(req, res);

    // Assert user was found by ID
    expect(userModel.findById).toHaveBeenCalledWith("user123");

    // Assert password was hashed
    expect(hashPassword).toHaveBeenCalledWith("newpassword123");

    // Assert user was updated with new values
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: "Test User",
        password: "hashednewpassword",
        phone: "1234567890",
        address: "123 Test St",
      },
      { new: true }
    );

    // Assert response was sent with success
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser: expect.any(Object),
    });
  });

  test("should update user profile with only provided fields", async () => {
    // Set up request with only some fields
    req.body = {
      name: "New Name Only",
    };

    // Call the controller
    await updateProfileController(req, res);

    // Assert user was found by ID
    expect(userModel.findById).toHaveBeenCalledWith("user123");

    // Assert password was not hashed (since not provided)
    expect(hashPassword).not.toHaveBeenCalled();

    // Assert user was updated with mix of new and existing values
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "user123",
      {
        name: "New Name Only",
        password: "hashedoldpassword", // Original value
        phone: "0987654321", // Original value
        address: "Original Address", // Original value
      },
      { new: true }
    );

    // Assert response was sent with success
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser: expect.any(Object),
    });
  });

  test("should reject update if password is too short", async () => {
    // Set up request with short password
    req.body = {
      password: "short",
    };

    // Call the controller
    await updateProfileController(req, res);

    // Assert user was found by ID
    expect(userModel.findById).toHaveBeenCalledWith("user123");

    // Assert password was not hashed
    expect(hashPassword).not.toHaveBeenCalled();

    // Assert user was not updated
    expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();

    // Assert error response was sent
    expect(res.json).toHaveBeenCalledWith({
      error: "Passsword is required and 6 character long",
    });
  });

  test("should handle errors during update", async () => {
    // Mock error during update
    userModel.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

    // Call the controller
    await updateProfileController(req, res);

    // Assert error response was sent
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Update profile",
      error: expect.any(Error),
    });
  });
});

describe("getOrdersController", () => {
  let req;
  let res;
  let mockPopulateChain;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object with authenticated user
    req = {
      user: {
        _id: "user123",
      },
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    // Setup mock orders data
    const mockOrders = [
      {
        _id: "order1",
        products: [{ name: "Product 1", price: 19.99 }],
        buyer: { name: "User Name" },
        status: "Processing",
        payment: {},
      },
      {
        _id: "order2",
        products: [{ name: "Product 2", price: 29.99 }],
        buyer: { name: "User Name" },
        status: "Shipped",
        payment: {},
      },
    ];

    // Create proper mock for orderModel with chained methods
    mockPopulateChain = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Set final populate call to resolve with orders
    mockPopulateChain.populate.mockImplementationOnce(() => mockPopulateChain);
    mockPopulateChain.populate.mockImplementationOnce(() =>
      Promise.resolve(mockOrders)
    );

    // Assign the mock to orderModel
    orderModel.find = jest.fn(() => mockPopulateChain);
  });

  test("should retrieve orders successfully for authenticated user", async () => {
    // Call the controller
    await getOrdersController(req, res);

    // Assert orderModel.find was called with correct user ID
    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });

    // Assert populate methods were called
    expect(mockPopulateChain.populate).toHaveBeenCalledWith(
      "products",
      "-photo"
    );
    expect(mockPopulateChain.populate).toHaveBeenCalledWith("buyer", "name");

    // Assert response contains orders
    expect(res.json).toHaveBeenCalled();
  });

  test("should handle errors when retrieving orders fails", async () => {
    // Mock error in database query
    orderModel.find = jest.fn(() => {
      throw new Error("Database error");
    });

    // Call the controller
    await getOrdersController(req, res);

    // Assert error response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Geting Orders",
      error: expect.any(Error),
    });
  });

  test("should return empty array when user has no orders", async () => {
    // Setup mock for empty orders result
    const emptyPopulateChain = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
    };

    emptyPopulateChain.populate.mockImplementationOnce(
      () => emptyPopulateChain
    );
    emptyPopulateChain.populate.mockImplementationOnce(() =>
      Promise.resolve([])
    );

    // Replace the orderModel mock
    orderModel.find = jest.fn(() => emptyPopulateChain);

    // Call the controller
    await getOrdersController(req, res);

    // Assert response contains empty array
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe("getAllOrdersController", () => {
  let req;
  let res;
  let mockPopulateChain;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object (doesn't need authentication for this endpoint)
    req = {};

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    // Setup mock orders data
    const mockOrders = [
      {
        _id: "order1",
        products: [{ name: "Product 1", price: 19.99 }],
        buyer: { name: "User 1" },
        status: "Processing",
        payment: {},
        createdAt: new Date("2023-01-15"),
      },
      {
        _id: "order2",
        products: [{ name: "Product 2", price: 29.99 }],
        buyer: { name: "User 2" },
        status: "Shipped",
        payment: {},
        createdAt: new Date("2023-01-20"),
      },
    ];

    // Create proper mock for orderModel with chained methods
    mockPopulateChain = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
    };

    // Set up chained methods to resolve with orders
    mockPopulateChain.populate.mockImplementationOnce(() => mockPopulateChain);
    mockPopulateChain.populate.mockImplementationOnce(() => mockPopulateChain);
    mockPopulateChain.sort.mockImplementationOnce(() =>
      Promise.resolve(mockOrders)
    );

    // Assign the mock to orderModel
    orderModel.find = jest.fn(() => mockPopulateChain);
  });

  test("should retrieve all orders successfully", async () => {
    // Call the controller
    await getAllOrdersController(req, res);

    // Assert orderModel.find was called with empty object to get all orders
    expect(orderModel.find).toHaveBeenCalledWith({});

    // Assert populate methods were called with correct parameters
    expect(mockPopulateChain.populate).toHaveBeenCalledWith(
      "products",
      "-photo"
    );
    expect(mockPopulateChain.populate).toHaveBeenCalledWith("buyer", "name");

    // Assert sort was called with correct parameters
    expect(mockPopulateChain.sort).toHaveBeenCalledWith({ createdAt: "-1" });

    // Assert response contains orders
    expect(res.json).toHaveBeenCalled();
  });

  test("should handle errors when retrieving all orders fails", async () => {
    // Mock error in database query
    orderModel.find = jest.fn(() => {
      throw new Error("Database error");
    });

    // Call the controller
    await getAllOrdersController(req, res);

    // Assert error response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Geting Orders",
      error: expect.any(Error),
    });
  });

  test("should return empty array when there are no orders", async () => {
    // Setup mock for empty orders result
    const emptyPopulateChain = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
    };

    emptyPopulateChain.populate.mockImplementationOnce(
      () => emptyPopulateChain
    );
    emptyPopulateChain.populate.mockImplementationOnce(
      () => emptyPopulateChain
    );
    emptyPopulateChain.sort.mockImplementationOnce(() => Promise.resolve([]));

    // Replace the orderModel mock
    orderModel.find = jest.fn(() => emptyPopulateChain);

    // Call the controller
    await getAllOrdersController(req, res);

    // Assert response contains empty array
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe("orderStatusController", () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object with order ID parameter and status in body
    req = {
      params: {
        orderId: "order123",
      },
      body: {
        status: "Completed",
      },
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    // Mock order data that would be returned after update
    const updatedOrder = {
      _id: "order123",
      products: [{ name: "Product 1", price: 19.99 }],
      buyer: { name: "User 1" },
      status: "Completed",
      payment: {},
    };

    // Mock findByIdAndUpdate to return the updated order
    orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);
  });

  test("should update order status successfully", async () => {
    // Call the controller
    await orderStatusController(req, res);

    // Assert findByIdAndUpdate was called with correct parameters
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order123",
      { status: "Completed" },
      { new: true }
    );

    // Assert response contains updated order
    expect(res.json).toHaveBeenCalled();
  });

  test("should handle errors when updating order status fails", async () => {
    // Mock database error during update
    orderModel.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

    // Call the controller
    await orderStatusController(req, res);

    // Assert error response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Updateing Order",
      error: expect.any(Error),
    });
  });

  test("should update to different status values", async () => {
    // Test with different status values
    const statusValues = ["Processing", "Shipped", "Delivered", "Cancelled"];

    for (const statusValue of statusValues) {
      // Reset mocks for each iteration
      jest.clearAllMocks();

      // Set status in request body
      req.body.status = statusValue;

      // Mock updated order with this status
      const updatedOrder = {
        _id: "order123",
        status: statusValue,
      };
      orderModel.findByIdAndUpdate.mockResolvedValue(updatedOrder);

      // Call the controller
      await orderStatusController(req, res);

      // Assert findByIdAndUpdate was called with correct status
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "order123",
        { status: statusValue },
        { new: true }
      );

      // Assert response contains updated order
      expect(res.json).toHaveBeenCalledWith(updatedOrder);
    }
  });
});
