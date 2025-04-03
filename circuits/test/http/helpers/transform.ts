import * as fs from "fs";

function transformWitnessLog(inputPath: string, outputPath: string) {
  const content = fs.readFileSync(inputPath, "utf-8");

  // 바이트 값이 있는 줄을 찾아서 변환
  const transformed = content.replace(/byte:\s+(\d+)/g, (match, byte) => {
    const charValue = String.fromCharCode(parseInt(byte));
    return `byte: ${byte} '${charValue}'`;
  });

  // 결과를 새 파일에 쓰거나 기존 파일을 덮어쓰기
  fs.writeFileSync(outputPath, transformed);
}

// 사용 예:
// transformWitnessLog("witness_test.txt", "witness_test_readable.txt");
const basePath = "circuits/test/http/";
transformWitnessLog(
  `${basePath}witness_test_small.txt`,
  `${basePath}witness_test_small_readable.txt`
);
