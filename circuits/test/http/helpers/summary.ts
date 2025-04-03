import * as fs from "fs";

interface ParsingState {
  parsing_start: number;
  parsing_header: number;
  parsing_field_name: number;
  parsing_field_value: number;
  parsing_body: number;
  line_status: number;
}

function analyzeWitnessLog(inputPath: string) {
  console.log("!!!!!!!!!!!!!!!!analy!!!!!!!!!!!!!!!!!!");
  const content = fs.readFileSync(inputPath, "utf-8");
  const lines = content.split("\n");

  let currentChar = "";
  let currentState: ParsingState | null = null;
  let result = "";
  let position = 0;

  // HTTP 메시지 원본
  const httpMessage = [
    "HTTP/1.1 200 OK",
    "Connection: close",
    "Content-Length: 22",
    "Cache-Control: max-age=300",
    "Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "Content-Type: text/plain; charset=utf-8",
    "ETag: e0e6510c1fc13b3a63acbc0615ee07a4952873a8da77027d00412fccf1a5ce29",
    "Strict-Transport-Security: max-age=31536000",
    "X-Content-Type-Options: nosniff",
    "X-Frame-Options: deny",
    "X-XSS-Protection: 1; mode=block",
    "X-GitHub-Request-Id: 7831:327414:12F9E6:1A33C2:676468F1",
    "Accept-Ranges: bytes",
    "Date: Thu, 19 Dec 2024 21:35:59 GMT",
    "Via: 1.1 varnish",
    "X-Served-By: cache-hyd1100034-HYD",
    "X-Cache: HIT",
    "X-Cache-Hits: 0",
    "X-Timer: S1734644160.560953,VS0,VE1",
    "Vary: Authorization,Accept-Encoding,Origin",
    "Access-Control-Allow-Origin: *",
    "Cross-Origin-Resource-Policy: cross-origin",
    "X-Fastly-Request-ID: 20aef87025f684be76257f15bff5a792ac15aad2",
    "Expires: Thu, 19 Dec 2024 21:40:59 GMT",
    "Source-Age: 153",
    "{",
    '  "hello": "world"',
    "}",
  ].join("\n");

  // 상태 변화 추적
  const stateChanges: { position: number; state: ParsingState }[] = [];

  lines.forEach((line) => {
    console.log("line", line);
    if (line.includes("byte:")) {
      const match = line.match(/byte:\s+(\d+)/);
      if (match) {
        currentChar = String.fromCharCode(parseInt(match[1]));
        position++;
      }
    }

    if (line.includes("State[")) {
      const stateMatch = {
        parsing_start: line.includes("next_parsing_start")
          ? parseInt(line.split("=")[1].trim())
          : 0,
        parsing_header: line.includes("next_parsing_header")
          ? parseInt(line.split("=")[1].trim())
          : 0,
        parsing_field_name: line.includes("next_parsing_field_name")
          ? parseInt(line.split("=")[1].trim())
          : 0,
        parsing_field_value: line.includes("next_parsing_field_value")
          ? parseInt(line.split("=")[1].trim())
          : 0,
        parsing_body: line.includes("next_parsing_body")
          ? parseInt(line.split("=")[1].trim())
          : 0,
        line_status: line.includes("next_line_status")
          ? parseInt(line.split("=")[1].trim())
          : 0,
      };

      if (stateMatch) {
        stateChanges.push({ position, state: stateMatch });
      }
    }
  });

  // 상태 변화 추적 결과 출력
  console.log("상태 변화 추적 결과:");
  stateChanges.forEach((change) => {
    console.log(
      `위치: ${change.position}, 상태: ${JSON.stringify(change.state)}`
    );
  });
}

// 사용 예:
const visualization = analyzeWitnessLog(
  "circuits/test/http/witness_test_readable.txt"
);
console.log(visualization);
