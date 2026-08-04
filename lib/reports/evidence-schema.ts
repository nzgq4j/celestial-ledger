export function bindEvidenceIds<
  T extends {
    properties: {
      sections: {
        items: { properties: { evidenceIds: { items: object } } };
      };
    };
  },
>(schema: T, evidenceIds: string[]) {
  return {
    ...schema,
    properties: {
      ...schema.properties,
      sections: {
        ...schema.properties.sections,
        items: {
          ...schema.properties.sections.items,
          properties: {
            ...schema.properties.sections.items.properties,
            evidenceIds: {
              ...schema.properties.sections.items.properties.evidenceIds,
              items: { type: "string", enum: evidenceIds },
            },
          },
        },
      },
    },
  };
}
