const mongoose = require("mongoose");

/**
 * Discover all model schema paths that reference the given model name
 * and count how many documents reference the provided document id.
 * @param {string} targetModelName - e.g. "Department"
 * @param {string|mongoose.Types.ObjectId} docId - The document ID to check references for
 * @returns {Promise<{totalReferences: number, details: Array<{model: string, path: string, count: number}>}>}
 */
async function getReferencingCounts(targetModelName, docId) {
  try {
    const id =
      typeof docId === "string" ? new mongoose.Types.ObjectId(docId) : docId;
    const modelNames = mongoose.modelNames();
    const details = [];

    for (const modelName of modelNames) {
      // Skip checking self-references
      if (modelName === targetModelName) continue;

      const Model = mongoose.model(modelName);
      const referencingPaths = [];

      // Inspect each path in the schema
      Model.schema.eachPath((pathName, schemaType) => {
        // Check for direct ObjectId reference
        const directRef = schemaType?.options?.ref;
        // Check for array of ObjectId references
        const arrayRef = schemaType?.caster?.options?.ref;

        if (directRef === targetModelName || arrayRef === targetModelName) {
          referencingPaths.push(pathName);
        }

        // Check for nested schema references (like items.productId)
        if (
          schemaType instanceof mongoose.Schema.Types.Array &&
          schemaType.schema
        ) {
          schemaType.schema.eachPath((nestedPath, nestedSchemaType) => {
            const nestedRef = nestedSchemaType?.options?.ref;
            if (nestedRef === targetModelName) {
              referencingPaths.push(`${pathName}.${nestedPath}`);
            }
          });
        }
      });

      // If no referencing paths found, skip this model
      if (referencingPaths.length === 0) continue;

      // Count documents for each referencing path
      for (const path of referencingPaths) {
        const filter = { [path]: id };
        const count = await Model.countDocuments(filter);

        if (count > 0) {
          details.push({
            model: modelName,
            path: path,
            count: count,
          });
        }
      }
    }

    const totalReferences = details.reduce(
      (sum, detail) => sum + detail.count,
      0,
    );

    return {
      totalReferences,
      details,
    };
  } catch (error) {
    console.error("Error in getReferencingCounts:", error);
    throw new Error("Failed to check references: " + error.message);
  }
}

/**
 * Cascade delete all documents that reference the target document
 * WARNING: This is a destructive operation!
 * @param {string} targetModelName - e.g. "Department"
 * @param {string|mongoose.Types.ObjectId} docId - The document ID to cascade delete
 * @returns {Promise<Array<{model: string, path: string, deletedCount: number}>>}
 */
async function cascadeDeleteReferences(targetModelName, docId) {
  try {
    const id =
      typeof docId === "string" ? new mongoose.Types.ObjectId(docId) : docId;
    const modelNames = mongoose.modelNames();
    const deletedInfo = [];

    for (const modelName of modelNames) {
      // Skip self
      if (modelName === targetModelName) continue;

      const Model = mongoose.model(modelName);
      const referencingPaths = [];

      // Find all paths that reference the target model
      Model.schema.eachPath((pathName, schemaType) => {
        const directRef = schemaType?.options?.ref;
        const arrayRef = schemaType?.caster?.options?.ref;

        if (directRef === targetModelName || arrayRef === targetModelName) {
          referencingPaths.push(pathName);
        }

        // Check for nested schema references (like items.productId)
        if (
          schemaType instanceof mongoose.Schema.Types.Array &&
          schemaType.schema
        ) {
          schemaType.schema.eachPath((nestedPath, nestedSchemaType) => {
            const nestedRef = nestedSchemaType?.options?.ref;
            if (nestedRef === targetModelName) {
              referencingPaths.push(`${pathName}.${nestedPath}`);
            }
          });
        }
      });

      if (referencingPaths.length === 0) continue;

      // Delete documents for each referencing path
      for (const path of referencingPaths) {
        const filter = { [path]: id };
        const deleteResult = await Model.deleteMany(filter);

        if (deleteResult.deletedCount > 0) {
          deletedInfo.push({
            model: modelName,
            path: path,
            deletedCount: deleteResult.deletedCount,
          });
        }
      }
    }

    return deletedInfo;
  } catch (error) {
    console.error("Error in cascadeDeleteReferences:", error);
    throw new Error("Failed to cascade delete: " + error.message);
  }
}

/**
 * Check if a document can be safely deleted (no references exist)
 * @param {string} targetModelName - e.g. "Department"
 * @param {string|mongoose.Types.ObjectId} docId - The document ID to check
 * @returns {Promise<{canDelete: boolean, totalReferences: number, details: Array}>}
 */
async function canSafelyDelete(targetModelName, docId) {
  const referenceInfo = await getReferencingCounts(targetModelName, docId);

  return {
    canDelete: referenceInfo.totalReferences === 0,
    totalReferences: referenceInfo.totalReferences,
    details: referenceInfo.details,
  };
}

/**
 * Get a formatted message about references for user-friendly responses
 * @param {Array} details - Array of reference details from getReferencingCounts
 * @returns {string}
 */
function formatReferenceMessage(details) {
  if (details.length === 0) {
    return "No references found.";
  }

  const messages = details.map(
    (detail) =>
      `${detail.count} record(s) in ${detail.model} (field: ${detail.path})`,
  );

  return `This record is referenced by: ${messages.join(", ")}`;
}

module.exports = {
  getReferencingCounts,
  cascadeDeleteReferences,
  canSafelyDelete,
  formatReferenceMessage,
};
