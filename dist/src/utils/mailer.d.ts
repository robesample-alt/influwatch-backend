export declare function sendEscalationAlert(opts: {
    recordId: string;
    ambassadorId: string;
    ruleCodes: string[];
    level: string;
}): Promise<void>;
export declare function sendPromoterInvite(opts: {
    email: string;
    promoterName: string;
    firmName: string;
    token: string;
}): Promise<void>;
export declare function sendPromoterLoginLink(opts: {
    email: string;
    promoterName: string;
    token: string;
}): Promise<void>;
//# sourceMappingURL=mailer.d.ts.map