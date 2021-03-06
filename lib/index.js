"use strict";
/**
 * @file JSONRPC 2.0 request authentication with dpay authorities.
 * @author Johan Nordberg <johan@steemit.com>
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dpay_libcrypto_1 = require("dpay-libcrypto");
var crypto_1 = require("crypto");
/**
 * Signing constant used to reserve opcode space and prevent cross-protocol attacks.
 * Output of `sha256('dpay_jsonrpc_auth')`.
 */
exports.K = Buffer.from('38f14b346eb697ba04ae0f5adcfaa0a437ed3711197704aa256a14cb9b4a8f26', 'hex');
/**
 * Thrown when a request fails validation.
 */
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, cause) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ValidationError';
        if (cause) {
            _this.cause = cause;
            _this.message += " (" + cause.message + ")";
        }
        return _this;
    }
    return ValidationError;
}(Error));
/**
 * Create request hash to be signed.
 *
 * @param timestamp  ISO8601 formatted date e.g. `2017-11-14T19:40:29.077Z`.
 * @param account    dPay account name that is the signer.
 * @param method     RPC request method.
 * @param params     Base64 encoded JSON string containing request params.
 * @param nonce      8 bytes of random data.
 *
 * @returns bytes to be signed or validated.
 */
function hashMessage(timestamp, account, method, params, nonce) {
    var first = crypto_1.createHash('sha256');
    first.update(timestamp);
    first.update(account);
    first.update(method);
    first.update(params);
    var second = crypto_1.createHash('sha256');
    second.update(exports.K);
    second.update(first.digest());
    second.update(nonce);
    return second.digest();
}
/**
 * Sign a JSON RPC Request.
 */
function sign(request, account, keys) {
    if (!request.params) {
        throw new Error('Unable to sign a request without params');
    }
    var params = Buffer.from(JSON.stringify(request.params), 'utf8').toString('base64');
    var nonceBytes = crypto_1.randomBytes(8);
    var nonce = nonceBytes.toString('hex');
    var timestamp = new Date().toISOString();
    var message = hashMessage(timestamp, account, request.method, params, nonceBytes);
    var signatures = [];
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        if (typeof key === 'string') {
            key = dpay_libcrypto_1.PrivateKey.from(key);
        }
        var signature = dpay_libcrypto_1.hexify(key.sign(message.buffer));
        signatures.push(signature);
    }
    return {
        jsonrpc: '2.0',
        method: request.method,
        id: request.id,
        params: {
            __signed: {
                account: account,
                nonce: nonce,
                params: params,
                signatures: signatures,
                timestamp: timestamp,
            }
        }
    };
}
exports.sign = sign;
/**
 * Validate a signed JSON RPC request.
 * Throws a {@link ValidationError} if the request fails validation.
 *
 * @returns Resolved request params.
 */
function validate(request, verify) {
    return __awaiter(this, void 0, void 0, function () {
        var signed, params, jsonString, nonce, timestamp, message, cause_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (request.jsonrpc !== '2.0' || typeof request.method !== 'string') {
                        throw new ValidationError('Invalid JSON RPC Request');
                    }
                    if (request.params == undefined || request.params.__signed == undefined) {
                        throw new ValidationError('Signed payload missing');
                    }
                    if (Object.keys(request.params).length !== 1) {
                        throw new ValidationError('Invalid request params');
                    }
                    signed = request.params.__signed;
                    if (signed.account == undefined) {
                        throw new ValidationError('Missing account');
                    }
                    try {
                        jsonString = Buffer.from(signed.params, 'base64').toString('utf8');
                        params = JSON.parse(jsonString);
                    }
                    catch (cause) {
                        throw new ValidationError('Invalid encoded params', cause);
                    }
                    if (signed.nonce == undefined || typeof signed.nonce !== 'string') {
                        throw new ValidationError('Invalid nonce');
                    }
                    nonce = Buffer.from(signed.nonce, 'hex');
                    if (nonce.length !== 8) {
                        throw new ValidationError('Invalid nonce');
                    }
                    timestamp = Date.parse(signed.timestamp);
                    if (Number.isNaN(timestamp)) {
                        throw new ValidationError('Invalid timestamp');
                    }
                    if (Date.now() - timestamp > 60 * 1000) {
                        throw new ValidationError('Signature expired');
                    }
                    message = hashMessage(signed.timestamp, signed.account, request.method, signed.params, nonce);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, verify(message, signed.signatures, signed.account)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    cause_1 = _a.sent();
                    throw new ValidationError('Verification failed', cause_1);
                case 4: return [2 /*return*/, params];
            }
        });
    });
}
exports.validate = validate;
