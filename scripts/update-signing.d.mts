export function signUpdate(file: string, version: string, privateKeyPem: string): Promise<string>;
export function sha512Of(file: string): Promise<string>;
export function signatureMessage(version: string, sha512Hex: string): Buffer;
export function keyFile(): string;
