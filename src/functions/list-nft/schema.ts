export default {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        listPrice: { type: "number", minimum: 0 },
      },
      required: ["listPrice"],
    },
  },
} as const;
