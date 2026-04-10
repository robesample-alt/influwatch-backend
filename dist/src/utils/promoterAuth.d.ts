export interface PromoterTokenPayload {
    ambassadorId: string;
    tenantId: string;
    email: string;
    role: 'PROMOTER';
}
export declare function signPromoterToken(payload: Omit<PromoterTokenPayload, 'role'>): string;
export declare function verifyPromoterToken(token: string): PromoterTokenPayload;
export declare function generateMagicLinkToken(): {
    token: string;
    tokenHash: string;
};
export declare function hashMagicLinkToken(token: string): string;
//# sourceMappingURL=promoterAuth.d.ts.map