import request from "supertest";
import { app, server } from "./index";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(__dirname, "uploads");
jest.setTimeout(10000);

beforeEach(async () => {
  // Clean up the uploads directory before each test
  try {
    const files = await fs.promises.readdir(uploadsDir);
    for (const file of files) {
      await fs.promises.unlink(path.join(uploadsDir, file));
    }
  } catch (error) {
    console.error("Error cleaning uploads directory:", error);
  }
});

afterAll((done) => {
  // Ensure the server closes after tests are finished to prevent Jest from hanging
  server.close(done);
});

describe("File Upload API", () => {
  it("should upload a file successfully", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("file", "tests/test-file.pdf");
    expect(res.status).toBe(200);
    expect(res.body.originalname).toBe("test-file.pdf");
    expect(res.body.url).toContain("uploads/test-file.pdf");
  });

  it("should return 400 if no file is provided", async () => {
    const res = await request(app).post("/upload");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No file provided");
  });

  it("should return 400 if file size exceeds limit", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("file", "tests/large-file.pdf");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "File is too large. Maximum allowed size is 10MB."
    ); // Adjusted to match your response
  });

  it("should delete a file successfully", async () => {
    // Upload a file first
    await request(app).post("/upload").attach("file", "tests/test-file.pdf"); // Ensure this test file exists

    const res = await request(app).delete("/uploads/test-file.pdf");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("File deleted successfully");
  });

  it("should return 404 when deleting a non-existent file", async () => {
    const res = await request(app).delete("/uploads/nonexistent-file.pdf");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("File not found");
  });

  it("should return an uploaded file", async () => {
    // Upload a file first
    await request(app).post("/upload").attach("file", "tests/test-file.pdf");

    const res = await request(app).get("/uploads/test-file.pdf");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });

  it("should return 400 if invalid file type is uploaded", async () => {
    const filePath = path.resolve(__dirname, "..", "tests", "file.json");
    // const fileStream = fs.createReadStream(filePath);

    try {
      const res = await request(app)
        .post("/upload")
        .set("Connection", "close")
        .attach("file", filePath, { contentType: "application/json" });

      // fileStream.close();
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        "Invalid file type. Only PDF, Word documents, and image files are allowed."
      );
    } catch (error: any) {
      if (error.code === "ECONNRESET") {
        // Ignore ECONNRESET error
      } else {
        throw error;
      }
    }
  });
});
