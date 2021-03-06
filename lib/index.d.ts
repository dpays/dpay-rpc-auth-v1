/**
 * @file JSONRPC 2.0 request authentication with dpay authorities.
 * @author Johan Nordberg <johan@steemit.com>
 */
/// <reference types="node" />
/**
 * Signing constant used to reserve opcode space and prevent cross-protocol attacks.
 * Output of `sha256('dpay_jsonrpc_auth')`.
 */
export declare const K: Buffer;
/**
 * JSONRPC 2.0 ID.
 */
export declare type JsonRpcId = string | number | null;
/**
 * JSONRPC 2.0 Request.
 */
export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: JsonRpcId;
    method: string;
    params?: any;
}
/**
 * Signed JSONRPC 2.0 Request.
 */
export interface SignedJsonRpcRequest extends JsonRpcRequest {
    params: {
        __signed: {
            /** 8 bytes of hex-encoded random data */
            nonce: string;
            /** ISO8601 formatted date */
            timestamp: string;
            /** Signers dPay account name */
            account: string;
            /** JSON+base64 encoded request params */
            params: string;
            /** Array of hex-encoded ecdsa signatures */
            signatures: string[];
        };
    };
}
/**
 * Sign a JSON RPC Request.
 */
export declare function sign(request: JsonRpcRequest, account: string, keys: any[]): SignedJsonRpcRequest;
/**
 * Verify that message is signed by account and that the signatures are valid, should throw if verification fails.
 *
 * @param message     Message to verify.
 * @param signatures  Signatures to verify.
 * @param account     Account whose posting authority created the signatures.
 *
 * Responsible for:
 *   1. Account must be a valid dPay blockchain account
 *   2. All signatures must be a hex string >= 64 chars (32+ bytes decoded)
 *   3. Signature matches message
 *   4. Signature was made with accounts posting authority
 *
 */
export declare type VerifyMessage = (message: Buffer, signatures: string[], account: string) => Promise<void>;
/**
 * Validate a signed JSON RPC request.
 * Throws a {@link ValidationError} if the request fails validation.
 *
 * @returns Resolved request params.
 */
export declare function validate(request: SignedJsonRpcRequest, verify: VerifyMessage): Promise<any>;
