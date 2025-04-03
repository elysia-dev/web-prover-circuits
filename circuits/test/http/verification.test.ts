import {
  circomkit,
  WitnessTester,
  PolynomialDigest,
  http_response_plaintext,
  http_start_line,
  http_header_0,
  http_header_1,
  http_body,
  modAdd,
  PUBLIC_IO_VARIABLES,
  modPow,
} from "../common";
import { assert } from "chai";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { defaultHttpMachineState } from "../common/http";

const DATA_BYTES = 320;
const MAX_NUMBER_OF_HEADERS = 2;

describe("HTTP Verification", async () => {
  let HTTPVerification: WitnessTester<
    ["step_in", "data", "machine_state", "main_digests", "ciphertext_digest"],
    ["step_out"]
  >;
  before(async () => {
    HTTPVerification = await circomkit.WitnessTester("http_nivc", {
      file: "http/verification",
      template: "HTTPVerification",
      params: [DATA_BYTES, MAX_NUMBER_OF_HEADERS, PUBLIC_IO_VARIABLES],
    });
  });
  const mock_ct_digest = poseidon2([69, 420]); // r

  // Used across tests
  // machine_state <= [1, 0, 0, 0, 0, 0, 0, 1]
  // 앞 6개는 parser에서 사용된것처럼 초기화 값, machine_state[6], machine_state[7] 은 뭘 의미하지?
  // machine_state[6] <= line_digest <= 초기엔 0
  // machine_state[7] <= main_monomials <= 초기엔 1

  // step_in <= [0, 0, 1, digest, 0, 0, 0, 0, 0, 0, 0]
  let [machine_state, digest] = defaultHttpMachineState(mock_ct_digest);
  let step_in = Array(PUBLIC_IO_VARIABLES).fill(0);
  step_in[2] = 1; // ciphertext_digest_pow
  step_in[3] = digest;

  // Get all the hashes we need
  let plaintext_digest = PolynomialDigest(
    http_response_plaintext,
    mock_ct_digest,
    BigInt(0)
  );

  // Compute the HTTP info digest
  let start_line_digest = PolynomialDigest(
    http_start_line,
    mock_ct_digest,
    BigInt(0)
  );
  let start_line_digest_hashed = poseidon1([start_line_digest]);
  let header_0_digest = PolynomialDigest(
    http_header_0,
    mock_ct_digest,
    BigInt(0)
  );
  let header_0_digest_hashed = poseidon1([header_0_digest]);
  let header_1_digest = PolynomialDigest(
    http_header_1,
    mock_ct_digest,
    BigInt(0)
  );
  let header_1_digest_hashed = poseidon1([header_1_digest]);
  let body_digest = PolynomialDigest(http_body, mock_ct_digest, BigInt(0));

  // abs(body_digest - plaintext_digest)
  let output_difference = modAdd(body_digest - plaintext_digest, BigInt(0));

  // step_in[0] <= 0
  // step_in[1] <= 0
  // step_in[2] <= cipher_text_digest_pow
  // step_in[3] <= machine_state_digest
  // step_in[4] <= data.hashed
  // step_in[5] <= Total number of matches to expect (sl + ...)
  it("witness: http_response_plaintext, no header", async () => {
    // For this specific test, we need these registers set
    step_in[4] = start_line_digest_hashed;
    step_in[5] = 1; // Total number of matches to expect (sl)

    // Run the HTTP circuit
    // POTENTIAL BUG: I didn't get this to work with `expectPass` as it didn't compute `step_out` that way???

    // parser.test.ts expectPass를 통해서 검증하는것이 일반적이다. 근데 그게 잘 안된다는 것 같다.
    // 그래서 여기에선 assert.deepEqual과 circom코드 내의 assign, equal을 통해 검증한다.
    let http_nivc_compute = await HTTPVerification.compute(
      {
        step_in, // This doesn't really matter for this test
        data: http_response_plaintext,
        machine_state,
        // header는 최대 3개로 제한한다. 그래서 element 갯수를 3개로 맞춘다.
        main_digests: [start_line_digest].concat(Array(2).fill(0)),
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );
    let http_step_out = http_nivc_compute.step_out as BigInt[];
    // A. http_step_out[0] = step_in[0] - pt_digest + body_digest[DATA_BYTES - 1];
    // 0 + body_digest - pt_digest
    // PolynomialDigest(http_body, mock_ct_digest, BigInt(0)) - PolynomialDigestWithCounter(DATA_BYTES)(zeroed_data, mock_ct_digest, ciphertext_digest_pow) +
    // PolynomialDigest(http_body, mock_ct_digest, BigInt(0)) - PolynomialDigestWithCounter(DATA_BYTES)(http_response_plaintext, mock_ct_digest, ciphertext_digest_pow) +

    // B. output_difference = body_digest - plaintext_digest
    // = PolynomialDigest(http_body, mock_ct_digest, BigInt(0)) - PolynomialDigest(http_response_plaintext, mock_ct_digest,BigInt(0));

    // plaintext: 전체응답
    // body: 전체응답 - 헤더
    // 그래서 그 차이를 output_difference에 저장한다.
    // http_step_out은 전체 text에 대해서 machine을 다 돌고나면
    assert.deepEqual(http_step_out[0], output_difference);

    assert.deepEqual(
      http_step_out[6],
      modPow(mock_ct_digest, BigInt(http_body.length - 1))
    );
  });

  it("witness: http_response_plaintext, one header", async () => {
    // For this specific test, we need these registers set
    step_in[4] = start_line_digest_hashed + header_0_digest_hashed;
    step_in[5] = 2; // Total number of matches to expect (sl, h0)

    // Run the HTTP circuit
    let http_nivc_compute = await HTTPVerification.compute(
      {
        step_in, // This doesn't really matter for this test
        data: http_response_plaintext,
        machine_state,
        main_digests: [start_line_digest, header_0_digest].concat(
          Array(1).fill(0)
        ),
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );
    // I fucking hate circomkit
    assert.deepEqual(
      (http_nivc_compute.step_out as BigInt[])[0],
      output_difference
    );
    assert.deepEqual(
      (http_nivc_compute.step_out as BigInt[])[6],
      modPow(mock_ct_digest, BigInt(http_body.length - 1))
    );
  });

  it("witness: http_response_plaintext, two headers", async () => {
    // For this specific test, we need these registers set
    step_in[4] =
      start_line_digest_hashed +
      header_0_digest_hashed +
      header_1_digest_hashed;
    step_in[5] = 3; // Total number of matches to expect (sl, h0, h1)

    // Run the HTTP circuit
    // POTENTIAL BUG: I didn't get this to work with `expectPass` as it didn't compute `step_out` that way???
    let http_nivc_compute = await HTTPVerification.compute(
      {
        step_in, // This doesn't really matter for this test
        data: http_response_plaintext,
        machine_state,
        main_digests: [start_line_digest, header_0_digest, header_1_digest],
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );
    // I fucking hate circomkit
    assert.deepEqual(
      (http_nivc_compute.step_out as BigInt[])[0],
      output_difference
    );
    assert.deepEqual(
      (http_nivc_compute.step_out as BigInt[])[6],
      modPow(mock_ct_digest, BigInt(http_body.length - 1))
    );
  });

  it("witness: http_response_plaintext, two headers, order does not matter", async () => {
    // For this specific test, we need these registers set
    step_in[4] =
      start_line_digest_hashed +
      header_0_digest_hashed +
      header_1_digest_hashed;
    step_in[5] = 3; // Total number of matches to expect (sl, h0, h1)

    // Run the HTTP circuit
    let http_nivc_compute = await HTTPVerification.compute(
      {
        step_in, // This doesn't really matter for this test
        data: http_response_plaintext,
        machine_state,
        main_digests: [header_1_digest, start_line_digest, header_0_digest],
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );
    assert.deepEqual(
      (http_nivc_compute.step_out as BigInt[])[0],
      output_difference
    );
    assert.deepEqual(
      (http_nivc_compute.step_out as BigInt[])[6],
      modPow(mock_ct_digest, BigInt(http_body.length - 1))
    );
  });
});

describe("HTTP Verification: Split", async () => {
  let HTTPVerification: WitnessTester<
    ["step_in", "data", "machine_state", "main_digests", "ciphertext_digest"],
    ["step_out"]
  >;
  before(async () => {
    HTTPVerification = await circomkit.WitnessTester("http_nivc", {
      file: "http/verification",
      template: "HTTPVerification",
      params: [DATA_BYTES / 2, MAX_NUMBER_OF_HEADERS, PUBLIC_IO_VARIABLES],
    });
  });
  const mock_ct_digest = poseidon1([69]);

  // Used across tests
  let [machine_state, digest] = defaultHttpMachineState(mock_ct_digest);
  let step_in = Array(PUBLIC_IO_VARIABLES).fill(0);
  step_in[2] = 1; // ciphertext_digest_pow
  step_in[3] = digest;

  // Get all the hashes we need
  let plaintext_digest = PolynomialDigest(
    http_response_plaintext,
    mock_ct_digest,
    BigInt(0)
  );

  // Compute the HTTP info digest
  let start_line_digest = PolynomialDigest(
    http_start_line,
    mock_ct_digest,
    BigInt(0)
  );
  let start_line_digest_hashed = poseidon1([start_line_digest]);
  let header_0_digest = PolynomialDigest(
    http_header_0,
    mock_ct_digest,
    BigInt(0)
  );
  let header_0_digest_hashed = poseidon1([header_0_digest]);
  let header_1_digest = PolynomialDigest(
    http_header_1,
    mock_ct_digest,
    BigInt(0)
  );
  let header_1_digest_hashed = poseidon1([header_1_digest]);
  let body_digest = PolynomialDigest(http_body, mock_ct_digest, BigInt(0));
  let output_difference = modAdd(body_digest - plaintext_digest, BigInt(0));

  let plaintext_digest_0 = PolynomialDigest(
    http_response_plaintext.slice(0, 160),
    mock_ct_digest,
    BigInt(0)
  );
  let plaintext_digest_1 = PolynomialDigest(
    http_response_plaintext.slice(160),
    mock_ct_digest,
    BigInt(160)
  );

  const mid = http_response_plaintext.length / 2;
  const [http_response_plaintext_0, http_response_plaintext_1] = [
    http_response_plaintext.slice(0, mid),
    http_response_plaintext.slice(mid),
  ];

  it("witness: http_response_plaintext, no header", async () => {
    // For this specific test, we need these registers set
    step_in[4] = start_line_digest_hashed;
    step_in[5] = 1; // Total number of matches to expect (sl)

    // Run the HTTP circuit
    // POTENTIAL BUG: I didn't get this to work with `expectPass` as it didn't compute `step_out` that way???
    let http_nivc_compute_0 = await HTTPVerification.compute(
      {
        step_in,
        data: http_response_plaintext_0,
        machine_state,
        main_digests: [start_line_digest].concat(Array(2).fill(0)),
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );

    let next_machine_state = [0, 0, 0, 0, 1, 0, 0, 0];
    let next_step_in = (http_nivc_compute_0.step_out as bigint[]).slice(
      0,
      PUBLIC_IO_VARIABLES
    );
    let http_nivc_compute_1 = await HTTPVerification.compute(
      {
        step_in: next_step_in,
        data: http_response_plaintext_1,
        machine_state: next_machine_state,
        main_digests: [start_line_digest].concat(Array(2).fill(0)),
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );
    assert.deepEqual(
      (http_nivc_compute_1.step_out as BigInt[])[6], // body_monomials
      modPow(mock_ct_digest, BigInt(http_body.length - 1))
    );
    assert.deepEqual(
      (http_nivc_compute_1.step_out as BigInt[])[0],
      output_difference
    );
  });

  it("witness: http_response_plaintext, one header", async () => {
    // For this specific test, we need these registers set
    step_in[4] = start_line_digest_hashed + header_0_digest_hashed;
    step_in[5] = 2; // Total number of matches to expect (sl, h0)

    // Run the HTTP circuit
    let http_nivc_compute_0 = await HTTPVerification.compute(
      {
        step_in, // This doesn't really matter for this test
        data: http_response_plaintext_0,
        machine_state,
        main_digests: [start_line_digest, header_0_digest].concat(
          Array(1).fill(0)
        ),
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );

    let next_machine_state = [0, 0, 0, 0, 1, 0, 0, 0];
    let next_step_in = (http_nivc_compute_0.step_out as bigint[]).slice(
      0,
      PUBLIC_IO_VARIABLES
    );
    let http_nivc_compute_1 = await HTTPVerification.compute(
      {
        step_in: next_step_in,
        data: http_response_plaintext_1,
        machine_state: next_machine_state,
        main_digests: [start_line_digest, header_0_digest].concat(
          Array(1).fill(0)
        ),
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );
    assert.deepEqual(
      (http_nivc_compute_1.step_out as BigInt[])[0],
      output_difference
    );
  });

  it("witness: http_response_plaintext, two headers", async () => {
    // For this specific test, we need these registers set
    step_in[4] =
      start_line_digest_hashed +
      header_0_digest_hashed +
      header_1_digest_hashed;
    step_in[5] = 3; // Total number of matches to expect (sl, h0, h1)

    // Run the HTTP circuit
    let http_nivc_compute_0 = await HTTPVerification.compute(
      {
        step_in, // This doesn't really matter for this test
        data: http_response_plaintext_0,
        machine_state,
        main_digests: [start_line_digest, header_0_digest, header_1_digest],
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );

    let next_machine_state = [0, 0, 0, 0, 1, 0, 0, 0];
    let next_step_in = (http_nivc_compute_0.step_out as bigint[]).slice(
      0,
      PUBLIC_IO_VARIABLES
    );
    let http_nivc_compute_1 = await HTTPVerification.compute(
      {
        step_in: next_step_in,
        data: http_response_plaintext_1,
        machine_state: next_machine_state,
        main_digests: [start_line_digest, header_0_digest, header_1_digest],
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );
    assert.deepEqual(
      (http_nivc_compute_1.step_out as BigInt[])[0],
      output_difference
    );
  });

  // Nova의 IVC를 잘 확인할수있는 예시
  // 전체 text를 반반 쪼개서 넣는다.
  // 그래서 중간에 machine state, step_in 를 이전 마지막 글자 기준으로 셋팅해서 넘긴다.
  it("witness: http_response_plaintext, two headers, order does not matter", async () => {
    // For this specific test, we need these registers set
    step_in[4] =
      start_line_digest_hashed +
      header_0_digest_hashed +
      header_1_digest_hashed;
    step_in[5] = 3; // Total number of matches to expect (sl, h0, h1)

    // Run the HTTP circuit
    let http_nivc_compute_0 = await HTTPVerification.compute(
      {
        step_in, // This doesn't really matter for this test
        data: http_response_plaintext_0,
        machine_state,
        main_digests: [header_1_digest, start_line_digest, header_0_digest],
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );

    // body를 읽는 상황에서 [0, 0, 0, 0, 1, 0] 까지는 확실하다.
    // 근데 뒤에 [0, 0] [line_digest, main_monomial] 이 부분은 맞는지 확인이 필요하다
    let next_machine_state = [0, 0, 0, 0, 1, 0, 0, 0];

    // TODO: 여기서 step_in[3] 값을 next_machine_state로부터 얻은 값으로 변경해줘야할것같은데?

    let next_step_in = (http_nivc_compute_0.step_out as bigint[]).slice(
      0,
      PUBLIC_IO_VARIABLES
    );
    let http_nivc_compute_1 = await HTTPVerification.compute(
      {
        step_in: next_step_in,
        data: http_response_plaintext_1,
        machine_state: next_machine_state,
        // TODO: 이 순서랑 step_in[4]에 들어가는 순서랑 다른데... 괜찮나?
        main_digests: [header_1_digest, start_line_digest, header_0_digest],
        ciphertext_digest: mock_ct_digest,
      },
      ["step_out"]
    );
    assert.deepEqual(
      (http_nivc_compute_1.step_out as BigInt[])[0],
      output_difference
    );
  });
});
