import FormData from "form-data";
import fetch from "node-fetch";

const FACE_SERVICE_URL =
  process.env.FACE_SERVICE_URL || "http://localhost:5000";

/**
 * Extract face embedding using InsightFace Python service
 * @param imageBuffer - Image buffer to process
 * @returns 512-dimensional face embedding or null if no face detected
 */
export async function extractFaceEmbedding(
  imageBuffer: Buffer
): Promise<Float32Array | null> {
  try {
    console.log("=== Calling InsightFace service ===");
    console.log(`Buffer size: ${imageBuffer.length} bytes`);
    console.log(`Service URL: ${FACE_SERVICE_URL}`);

    // Create form data
    const formData = new FormData();
    formData.append("image", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    // Call InsightFace service
    const response = await fetch(`${FACE_SERVICE_URL}/extract-embedding`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = (await response.json()) as any;

    if (!result.success) {
      console.log(`❌ ${result.message || result.error}`);
      return null;
    }

    console.log(`✓ Face detected`);
    console.log(`✓ Embedding size: ${result.embedding_size} dimensions`);
    console.log(`✓ Number of faces: ${result.num_faces_detected}`);

    if (result.face?.quality_score) {
      console.log(
        `✓ Face quality: ${(result.face.quality_score * 100).toFixed(2)}%`
      );
    }

    if (result.face?.gender && result.face?.age) {
      console.log(`✓ Gender: ${result.face.gender}, Age: ~${result.face.age}`);
    }

    console.log("=== Face extraction complete ===");

    return new Float32Array(result.embedding);
  } catch (error) {
    console.error("Error calling InsightFace service:", error);
    console.error(
      "Make sure the Python service is running on",
      FACE_SERVICE_URL
    );
    return null;
  }
}

/**
 * Compare two embeddings using InsightFace service
 * @param embedding1 - First face embedding
 * @param embedding2 - Second face embedding
 * @returns Comparison result with distance, similarity, and match status
 */
export async function compareEmbeddings(
  embedding1: Float32Array,
  embedding2: number[]
): Promise<{
  distance: number;
  similarity: number;
  isMatch: boolean;
  confidence: string;
} | null> {
  try {
    const response = await fetch(`${FACE_SERVICE_URL}/compare-embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embedding1: Array.from(embedding1),
        embedding2: embedding2,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = (await response.json()) as any;

    if (!result.success) {
      console.error("Comparison failed:", result.error);
      return null;
    }

    return {
      distance: result.distance,
      similarity: result.similarity,
      isMatch: result.is_match,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error("Error comparing embeddings:", error);
    return null;
  }
}

/**
 * Check if InsightFace service is available
 * @returns true if service is healthy and ready
 */
export async function checkServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${FACE_SERVICE_URL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as any;
    return result.status === "healthy" && result.ready === true;
  } catch (error) {
    console.error("InsightFace service unavailable:", error);
    return false;
  }
}
