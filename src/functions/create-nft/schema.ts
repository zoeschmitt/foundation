// type CreateNFTRequest

export default {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        metadata: { type: "object" },
        file: { type: "string" },
        filename: { type: "string" },
        image: { type: "string" },
      },
      required: ["metadata"],
    },
  },
} as const;
