/**
 * Represents a drug from RxNorm.
 */
export interface Drug {
  /**
   * The RxNorm identifier for the drug.
   */
rxNormId: string;
  /**
   * The name of the drug.
   */
  name: string;
}

/**
 * Asynchronously searches RxNorm for drugs matching a given query.
 *
 * @param query The search query.
 * @returns A promise that resolves to an array of Drug objects.
 */
export async function searchDrugs(query: string): Promise<Drug[]> {
  // TODO: Implement this by calling the RxNorm API.

  return [
    {
      rxNormId: '12345',
      name: 'Acetaminophen',
    },
    {
      rxNormId: '67890',
      name: 'Ibuprofen',
    },
  ];
}
