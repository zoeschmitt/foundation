export default {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        buyerWalletId: { type: "string" },
        sellerWalletId: { type: "string" },
      },
      required: ["buyerWalletId", "sellerWalletId"],
    },
  },
} as const;
