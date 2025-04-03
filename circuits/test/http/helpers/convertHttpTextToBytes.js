// convertHttpTextToBytes.js

// const httpMessage = `
// HTTP/1.1 200 OK
// Connection: close
// Content-Length: 22
// Cache-Control: max-age=300
// Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox
// Content-Type: text/plain; charset=utf-8
// ETag: "e0e6510c1fc13b3a63acbc0615ee07a4952873a8da77027d00412fccf1a5ce29"
// Strict-Transport-Security: max-age=31536000
// X-Content-Type-Options: nosniff
// X-Frame-Options: deny
// X-XSS-Protection: 1; mode=block
// X-GitHub-Request-Id: 7831:327414:12F9E6:1A33C2:676468F1
// Accept-Ranges: bytes
// Date: Thu, 19 Dec 2024 21:35:59 GMT
// Via: 1.1 varnish
// X-Served-By: cache-hyd1100034-HYD
// X-Cache: HIT
// X-Cache-Hits: 0
// X-Timer: S1734644160.560953,VS0,VE1
// Vary: Authorization,Accept-Encoding,Origin
// Access-Control-Allow-Origin: *
// Cross-Origin-Resource-Policy: cross-origin
// X-Fastly-Request-ID: 20aef87025f684be76257f15bff5a792ac15aad2
// Expires: Thu, 19 Dec 2024 21:40:59 GMT
// Source-Age: 153

// {
//   "hello": "world"
// }
// `.trim();
const httpMessage = `
HTTP/1.1 200 OK
Connection: close
Source-Age: 153

{
  "hello": "world"
}
`.trim();

// Convert to CRLF-based HTTP message
const crlfHttp = httpMessage.replace(/\n/g, "\r\n");
const bytes = Buffer.from(crlfHttp, "utf-8");
const byteArray = Array.from(bytes);

// console.log("const HTTP_BYTES = [");
// for (let i = 0; i < byteArray.length; i++) {
//   process.stdout.write(byteArray[i].toString().padStart(3, " ") + ",");
//   if ((i + 1) % 16 === 0) process.stdout.write("\n");
// }
// console.log("\n];");

// implement ConvertBytesArrayToString
function ConvertBytesArrayToString(bytesArray) {
  return bytesArray.map((byte) => String.fromCharCode(byte)).join("");
}

const http_response_plaintext = [
  72, 84, 84, 80, 47, 49, 46, 49, 32, 50, 48, 48, 32, 79, 75, 13, 10, 99, 111,
  110, 116, 101, 110, 116, 45, 116, 121, 112, 101, 58, 32, 97, 112, 112, 108,
  105, 99, 97, 116, 105, 111, 110, 47, 106, 115, 111, 110, 59, 32, 99, 104, 97,
  114, 115, 101, 116, 61, 117, 116, 102, 45, 56, 13, 10, 99, 111, 110, 116, 101,
  110, 116, 45, 101, 110, 99, 111, 100, 105, 110, 103, 58, 32, 103, 122, 105,
  112, 13, 10, 84, 114, 97, 110, 115, 102, 101, 114, 45, 69, 110, 99, 111, 100,
  105, 110, 103, 58, 32, 99, 104, 117, 110, 107, 101, 100, 13, 10, 13, 10, 123,
  13, 10, 32, 32, 32, 34, 100, 97, 116, 97, 34, 58, 32, 123, 13, 10, 32, 32, 32,
  32, 32, 32, 32, 34, 105, 116, 101, 109, 115, 34, 58, 32, 91, 13, 10, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 123, 13, 10, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32, 34, 100, 97, 116, 97, 34, 58, 32, 34, 65, 114,
  116, 105, 115, 116, 34, 44, 13, 10, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 34, 112, 114, 111, 102, 105, 108, 101, 34, 58, 32, 123,
  13, 10, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 34,
  110, 97, 109, 101, 34, 58, 32, 34, 84, 97, 121, 108, 111, 114, 32, 83, 119,
  105, 102, 116, 34, 13, 10, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 125, 13, 10, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 125, 13, 10,
  32, 32, 32, 32, 32, 32, 32, 93, 13, 10, 32, 32, 32, 125, 13, 10, 125,
];
const convertedHttpResponsePlaintext = ConvertBytesArrayToString(
  http_response_plaintext
);
console.log(
  "convertedHttpResponsePlainText \n",
  convertedHttpResponsePlaintext
);

const http_response_ciphertext = [
  2, 125, 219, 141, 140, 93, 49, 129, 95, 178, 135, 109, 48, 36, 194, 46, 239,
  155, 160, 70, 208, 147, 37, 212, 17, 195, 149, 190, 38, 215, 23, 241, 84, 204,
  167, 184, 179, 172, 187, 145, 38, 75, 123, 96, 81, 6, 149, 36, 135, 227, 226,
  254, 177, 90, 241, 159, 0, 230, 183, 163, 210, 88, 133, 176, 9, 122, 225, 83,
  171, 157, 185, 85, 122, 4, 110, 52, 2, 90, 36, 189, 145, 63, 122, 75, 94, 21,
  163, 24, 77, 85, 110, 90, 228, 157, 103, 41, 59, 128, 233, 149, 57, 175, 121,
  163, 185, 144, 162, 100, 17, 34, 9, 252, 162, 223, 59, 221, 106, 127, 104, 11,
  121, 129, 154, 49, 66, 220, 65, 130, 171, 165, 43, 8, 21, 248, 12, 214, 33, 6,
  109, 3, 144, 52, 124, 225, 206, 223, 213, 86, 186, 93, 170, 146, 141, 145,
  140, 57, 152, 226, 218, 57, 30, 4, 131, 161, 0, 248, 172, 49, 206, 181, 47,
  231, 87, 72, 96, 139, 145, 117, 45, 77, 134, 249, 71, 87, 178, 239, 30, 244,
  156, 70, 118, 180, 176, 90, 92, 80, 221, 177, 86, 120, 222, 223, 244, 109,
  150, 226, 142, 97, 171, 210, 38, 117, 143, 163, 204, 25, 223, 238, 209, 58,
  59, 100, 1, 86, 241, 103, 152, 228, 37, 187, 79, 36, 136, 133, 171, 41, 184,
  145, 146, 45, 192, 173, 219, 146, 133, 12, 246, 190, 5, 54, 99, 155, 8, 198,
  156, 174, 99, 12, 210, 95, 5, 128, 166, 118, 50, 66, 26, 20, 3, 129, 232, 1,
  192, 104, 23, 152, 212, 94, 97, 138, 162, 90, 185, 108, 221, 211, 247, 184,
  253, 15, 16, 24, 32, 240, 240, 3, 148, 89, 30, 54, 161, 131, 230, 161, 217,
  29, 229, 251, 33, 220, 230, 102, 131, 245, 27, 141, 220, 67, 16, 26,
];
const convertedHttpResponseCiphertext = ConvertBytesArrayToString(
  http_response_ciphertext
);
console.log(
  "convertedHttpResponseCiphertext \n",
  convertedHttpResponseCiphertext
);

const http_response_ciphertext_dup = [
  66, 0, 57, 150, 208, 144, 184, 250, 244, 106, 253, 118, 105, 7, 189, 139, 78,
  36, 126, 180, 79, 153, 22, 237, 62, 182, 186, 218, 239, 75, 35, 97, 231, 115,
  106, 144, 4, 226, 80, 116, 121, 35, 136, 75, 89, 30, 78, 124, 59, 165, 121,
  235, 65, 63, 174, 154, 143, 75, 78, 33, 20, 38, 21, 133, 42, 97, 147, 38, 195,
  192, 90, 33, 165, 244, 196, 97, 167, 218, 2, 114, 7, 50, 34, 109, 211, 202,
  30, 101, 196, 146, 61, 67, 166, 66, 255, 90, 38, 74, 162, 187, 173, 9, 149,
  98, 16, 65, 79, 186, 61, 110, 193, 228, 163, 82, 238, 26, 30, 105, 206, 69, 2,
  102, 238, 165, 47, 159, 39, 5, 197, 150, 0, 69, 51, 234, 132, 22, 219, 250,
  22, 69, 111, 87, 123, 211, 13, 88, 46, 215, 6, 12, 107, 65, 69, 9, 235, 217,
  180, 167, 132, 204,
];
const convertedHttpResponseCiphertextDup = ConvertBytesArrayToString(
  http_response_ciphertext_dup
);
console.log(
  "convertedHttpResponseCiphertextDup \n",
  convertedHttpResponseCiphertextDup
);

const http_start_line = [
  72, 84, 84, 80, 47, 49, 46, 49, 32, 50, 48, 48, 32, 79, 75,
];
const convertedHttpStartLine = ConvertBytesArrayToString(http_start_line);
console.log("convertedHttpStartLine \n", convertedHttpStartLine);

const http_header_0 = [
  99, 111, 110, 116, 101, 110, 116, 45, 116, 121, 112, 101, 58, 32, 97, 112,
  112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 106, 115, 111, 110, 59, 32, 99,
  104, 97, 114, 115, 101, 116, 61, 117, 116, 102, 45, 56,
];
const convertedHttpHeader0 = ConvertBytesArrayToString(http_header_0);
console.log("convertedHttpHeader0 \n", convertedHttpHeader0);

const http_header_1 = [
  99, 111, 110, 116, 101, 110, 116, 45, 101, 110, 99, 111, 100, 105, 110, 103,
  58, 32, 103, 122, 105, 112,
];
const convertedHttpHeader1 = ConvertBytesArrayToString(http_header_1);
console.log("convertedHttpHeader1 \n", convertedHttpHeader1);

const http_body = [
  123, 13, 10, 32, 32, 32, 34, 100, 97, 116, 97, 34, 58, 32, 123, 13, 10, 32,
  32, 32, 32, 32, 32, 32, 34, 105, 116, 101, 109, 115, 34, 58, 32, 91, 13, 10,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 123, 13, 10, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 34, 100, 97, 116, 97, 34, 58, 32, 34,
  65, 114, 116, 105, 115, 116, 34, 44, 13, 10, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 34, 112, 114, 111, 102, 105, 108, 101, 34, 58, 32,
  123, 13, 10, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  34, 110, 97, 109, 101, 34, 58, 32, 34, 84, 97, 121, 108, 111, 114, 32, 83,
  119, 105, 102, 116, 34, 13, 10, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 125, 13, 10, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 125,
  13, 10, 32, 32, 32, 32, 32, 32, 32, 93, 13, 10, 32, 32, 32, 125, 13, 10, 125,
];
const convertedHttpBody = ConvertBytesArrayToString(http_body);
console.log("convertedHttpBody \n", convertedHttpBody);
