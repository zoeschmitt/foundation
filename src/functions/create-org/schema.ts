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
        nftName: { type: "string" },
        nftSymbol: { type: "string" },
        orgRoyaltyPercentage: { type: "number", multipleOf: 0.01 },
        creatorRoyaltyAmount: { type: "number", multipleOf: 0.01 },
      },
      required: ["name", "tier", "apiKey", "email", "nftName", "nftSymbol"],
    },
  },
} as const;
