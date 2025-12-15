import { db } from "../config/firebase";
import { MatchResult, PersonDocument } from "../types";
import { compareEmbeddings } from "./faceRecognition.service";

/**
 * Find matching person using InsightFace embeddings
 * InsightFace uses cosine similarity with different thresholds than other systems
 */
export async function findMatchingPerson(
  embedding: Float32Array,
  similarityThreshold = 70 // 70% similarity (InsightFace typically gets 85-95% for matches)
): Promise<MatchResult | null> {
  try {
    const personsSnapshot = await db.collection("known_persons").get();

    if (personsSnapshot.empty) {
      console.log("No known persons in database");
      return null;
    }

    let bestMatch: MatchResult | null = null;

    console.log(
      `Comparing against ${personsSnapshot.size} registered person(s)...`
    );

    for (const doc of personsSnapshot.docs) {
      const person = doc.data() as PersonDocument;
      const storedEmbedding = person.embedding;

      if (!storedEmbedding || !Array.isArray(storedEmbedding)) {
        console.log(`⚠️  Skipping ${person.name} - invalid embedding`);
        continue;
      }

      // Check embedding dimensions match
      if (storedEmbedding.length !== embedding.length) {
        console.log(
          `⚠️  Skipping ${person.name} - embedding dimension mismatch ` +
            `(stored: ${storedEmbedding.length}, current: ${embedding.length})`
        );
        continue;
      }

      // Use InsightFace service to compare embeddings
      const comparison = await compareEmbeddings(embedding, storedEmbedding);

      if (!comparison) {
        console.log(`⚠️  Failed to compare with ${person.name}`);
        continue;
      }

      console.log(
        `${person.name.padEnd(20)} | ` +
          `Similarity: ${comparison.similarity.toFixed(2)}% | ` +
          `Distance: ${comparison.distance.toFixed(4)} | ` +
          `Confidence: ${comparison.confidence.padEnd(10)} | ` +
          `Match: ${comparison.isMatch ? "✓ YES" : "✗ NO"}`
      );

      // Check if similarity meets threshold
      if (comparison.similarity >= similarityThreshold) {
        if (
          bestMatch === null ||
          comparison.similarity > bestMatch.confidence * 100
        ) {
          bestMatch = {
            personId: doc.id,
            name: person.name,
            distance: comparison.distance,
            confidence: comparison.similarity / 100, // Convert to 0-1 range
          };
        }
      }
    }

    if (bestMatch !== null) {
      console.log("");
      console.log("=".repeat(60));
      console.log(
        `✓ MATCH FOUND: ${bestMatch.name} ` +
          `(${(bestMatch.confidence * 100).toFixed(2)}% confidence)`
      );
      console.log("=".repeat(60));
      return bestMatch;
    }

    console.log("");
    console.log("=".repeat(60));
    console.log(
      "❌ NO MATCH - Unknown person (all similarities below threshold)"
    );
    console.log("=".repeat(60));
    return null;
  } catch (error) {
    console.error("Error finding matching person:", error);
    return null;
  }
}
