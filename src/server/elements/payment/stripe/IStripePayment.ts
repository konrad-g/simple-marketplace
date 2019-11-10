export module IStripePayment {
  export interface Listener {
    doesPurchaseExist(purchaseId): Promise<any>;
    getPurchasePrice(purchaseId): Promise<number>;
    getPurchaseDescription(purchaseId): Promise<string>;

    cancelPayment(purchaseId);
    rejectPayment(purchaseId);
    findPaymentByPurchaseId(purchaseId): Promise<any>;
    markPaymentAsWaitingFor3dSecureVerification(cardId: string, paymentCustomerId: string, card3dSecureId: string, description: string, amount: number, purchaseId: string): Promise<boolean>;
    markPaymentAsCompleted(cardId: string, paymentCustomerId: string, card3dSecureId: string, chargeId: string, description: string, amount: number, purchaseId: string): Promise<boolean>;
  }
}
