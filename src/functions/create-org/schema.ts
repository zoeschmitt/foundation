// types/CreateOrgRequest

export default {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        name: { type: "string" },
        tier: { type: "string" },
        apiKey: { type: "string" },
        email: { type: "string" },
        metadataSchema: { type: "array" },
        orgRoyaltyPercentage: { type: "number", multipleOf: 0.01 },
        creatorRoyaltyAmount: { type: "number", multipleOf: 0.01 },
      },
      required: [
        "name",
        "tier",
        "apiKey",
        "email",
        "metadataSchema",
      ],
    },
  },
} as const;
