/**
 * Represents a shipment.
 */
export interface Shipment {
  /**
   * The ID of the shipment.
   */
  id: string;
  /**
   * The tracking number of the shipment.
   */
  trackingNumber: string;
  /**
   * The current status of the shipment.
   */
  status: string;
  /**
   * The last known location of the shipment.
   */
  lastLocation: string;
  /**
   * The estimated time of arrival of the shipment.
   */
  eta: string;
}

/**
 * Asynchronously retrieves shipment information from EasyPost.
 *
 * @param trackingNumber The tracking number of the shipment.
 * @returns A promise that resolves to a Shipment object.
 */
export async function getShipment(trackingNumber: string): Promise<Shipment> {
  // TODO: Implement this by calling the EasyPost API.

  return {
    id: 'shp_1234567890',
    trackingNumber: trackingNumber,
    status: 'In Transit',
    lastLocation: 'Chicago, IL',
    eta: '2024-03-15',
  };
}
