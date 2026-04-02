export interface ActorTokenPayload {
    id: string;
    role: string;
    email: string;
}
export declare function signToken(actor: ActorTokenPayload): string;
export declare function verifyToken(token: string): ActorTokenPayload;
//# sourceMappingURL=auth.d.ts.map