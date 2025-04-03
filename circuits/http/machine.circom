pragma circom 2.1.9;

include "../utils/array.circom";

template HttpStateUpdate() {
    signal input parsing_start; // flag that counts up to 3 for each value in the start line
    signal input parsing_header; // Flag + Counter for what header line we are in
    signal input parsing_field_name; // flag that tells if parsing header field name
    signal input parsing_field_value; // flag that tells if parsing header field value
    signal input parsing_body; // Flag when we are inside body
    signal input line_status; // Flag that counts up to 4 to read a double CRLF
    signal input byte;

    signal output next_parsing_start;
    signal output next_parsing_header;
    signal output next_parsing_field_name;
    signal output next_parsing_field_value;
    signal output next_parsing_body;
    signal output next_line_status;

    //---------------------------------------------------------------------------------//
    // check if we read space: 32 or colon: 58
    component readSP = IsEqual();
    readSP.in <== [byte, 32];
    component readColon = IsEqual();
    readColon.in <== [byte, 58];

    // Check if what we just read is a CR / LF
    component readCR = IsEqual();
    readCR.in      <== [byte, 13];
    component readLF = IsEqual();
    readLF.in      <== [byte, 10];

    signal notCRAndLF <== (1 - readCR.out) * (1 - readLF.out);
    //---------------------------------------------------------------------------------//

    //---------------------------------------------------------------------------------//
    // Check if we had read previously CR / LF or multiple
    component prevReadCR     = IsEqual();
    prevReadCR.in          <== [line_status, 1];
    component prevReadCRLF     = IsEqual();
    prevReadCRLF.in          <== [line_status, 2];
    component prevReadCRLFCR = IsEqual();
    prevReadCRLFCR.in      <== [line_status, 3];

    signal readCRLF     <== prevReadCR.out * readLF.out;
    signal readCRLFCR   <== prevReadCRLF.out * readCR.out;
    signal readCRLFCRLF <== prevReadCRLFCR.out * readLF.out;
    //---------------------------------------------------------------------------------//

    //---------------------------------------------------------------------------------//
    // Take current state and CRLF info to update state
    signal state[4]          <== [parsing_start, parsing_header, parsing_field_value, parsing_body];
    component stateChange      = StateChange();
    stateChange.readCR       <== readCR.out;
    stateChange.prevReadCRLF <== prevReadCRLF.out;
    stateChange.readCRLF     <== readCRLF;
    stateChange.readCRLFCR   <== readCRLFCR;
    stateChange.readCRLFCRLF <== readCRLFCRLF;
    stateChange.readSP       <== readSP.out;
    stateChange.readColon    <== readColon.out;
    stateChange.state        <== state;

    // ArrayAdd를 통해서 element wise add를 한다.
    component nextState   = ArrayAdd(5);

    // lhs는 기존 상태다. or 조건이니까 일단 기존상태를 따라간다고 보면된다.
    // 근데 기존상태에서 현상태가 바뀌는 조건은 stateChange.out 에 의해 바뀐다, 두개가 OR 조건이 아니라 sum임을 주의한다. 
    nextState.lhs       <== [state[0], state[1], parsing_field_name, parsing_field_value, parsing_body];
    nextState.rhs       <== stateChange.out;
    // stateChange
    // [0]  (incrementParsingStart - disableParsingStart),
    // [1]  (incrementParsingHeader - disableParsingHeader) * (1 - state[3]),
    // [2]  (incrementParsingHeader - isParsingFieldValue) * (1 - state[3]),
    // [3]  (isParsingFieldValue - disableParsingFieldValue) * (1 - state[3]),
    // [4]  enableParsingBody
    //---------------------------------------------------------------------------------//

    next_parsing_start       <== nextState.out[0]; // state[0] + incrementParsingStart - disableParsingStart
    next_parsing_header      <== nextState.out[1];
    next_parsing_field_name  <== nextState.out[2];
    next_parsing_field_value <== nextState.out[3];
    next_parsing_body        <== nextState.out[4];
    signal cancelTerm        <== line_status * (notCRAndLF + readCRLFCRLF);
    next_line_status         <== (line_status + readCR.out + readCRLF - cancelTerm) * (1 - next_parsing_body);

    // next_parsing_start -> parsing_start + incrementParsingStart - disableParsingStart 
    // => 처음엔 기본값으로 1이 들어온다. 그다음엔 space를 기준으로 1씩더한다. 그리고 \r을 만나면 0이된다.

    // incrementParsingHeader =prevReadCRLF * (1 - readCRLFCR) 
    // => 헤더단순개행이면 1이된다. 헤더끝이면 0이다.

    // next_parsing_header -> (parsing_header * (1 - readCRLFCRLF) + prevReadCRLF * (1 - readCRLFCR)) && !parsingBody
    // => body가 아니라는 조건하에 => 헤더개행당 + 1 

    // next_parsing_field_name -> parsing_field_name + (incrementParsingHeader - isParsingFieldValue) && !parsingBody 
    // => 처음엔  incrementParsingHeader 즉 헤더단순개행으로 1이된다. 그다음엔 이전이 field_name이면 계속1이다.그러다가 콜론을 만나서 isParsingFieldValue가 1이되면 0이된다. 

    // next_parsing_field_value -> parsing_field_value + (isParsingFieldValue - disableParsingFieldValue) && !parsingBody
    // => 처음엔 콜론을 만나서 1이된다. 그다음엔 이전이 field_value이면 계속1이다.그러다가 \r을 만나서 disableParsingFieldValue가 1이되면 0이된다. 

    // next_parsing_body -> parsing_body + enableParsingBody 
    // => 처음엔 헤더끝나고 첫번째 \r\n\r\n 을 만나서 1이된다. 그다음엔 이전이 body이면 계속1이다. 

    // cancelTerm = line_status * (notCRAndLF + readCRLFCRLF)
    // => 현재 라인이 끝나고 다음 라인이 시작되는 경우 0이 된다.

    // next_line_status -> (line_status + readCR.out + readCRLF - cancelTerm) * (1 - next_parsing_body)
    // => \r이나 \n을 만나면 +1이다. , 둘다아닌경우에 cancelTerm을 이용해서 line_status를 0으로 만든다.


}

// TODO:
// - multiple space between start line values
// - header value parsing doesn't handle SPACE between colon and actual value
template StateChange() {
    signal input prevReadCRLF;
    signal input readCR;
    signal input readCRLF;
    signal input readCRLFCR;
    signal input readCRLFCRLF;
    signal input readSP;
    signal input readColon;
    signal input state[4];
    signal output out[5];

    // 이전 스텝에서 계산된 현재 step의 값들
    // 이것과 현재 스텝의 값을 인풋으로 삼아 다음 스텝의 값을 계산한다.
    // signal state[4]          <== [parsing_start, parsing_header, parsing_field_value, parsing_body];


    // GreaterEqThan(2) because start line can have at most 3 values for request or response
    signal isParsingStart <== GreaterEqThan(2)([state[0], 1]); // 2비트 , 현재 parsing_start >= 1 ?
    // increment parsing start counter on reading SP
    signal incrementParsingStart <== readSP * isParsingStart; // 현재가 space && isParsingStart
    // disable parsing start on reading CRLF
    signal disableParsingStart <== readCR * state[0]; // 현재가 CR && parsing_start

    // enable parsing header on reading CRLF
    // signal enableParsingHeader <== readCRLF * isParsingStart;
    // check if we are parsing header
    // Allows for max headers to be 2^5 = 32
    signal isParsingHeader <== GreaterEqThan(5)([state[1], 1]); // 5비트 => 헤더는 최대 32line , 현재 parsing_header >= 1 ? . 즉 헤더를 읽는중인가 
    // increment parsing header counter on CRLF and parsing header
    signal incrementParsingHeader <== prevReadCRLF * (1 - readCRLFCR); // prevReadCRLF && !readCRLFCR => 헤더에서 개행된 상황
    // disable parsing header on reading CRLF-CRLF
    signal disableParsingHeader <== readCRLFCRLF * state[1]; // 헤더에서 개핸된 뒤에 또 \r\n 을 읽는 순간, 즉 헤더 끝난 상황
    // parsing field value when parsing header and read Colon `:`
    signal readColonNotInFieldValue <== readColon * (1 - state[2]); // 현재가 colon 인데 field value 읽는중이 아닌 상황
    // 현재 스텝이 헤더를 읽는중이고, 콜론을 읽는중이고, field value 읽는중이 아닌 상황
    signal isParsingFieldValue <== isParsingHeader * readColonNotInFieldValue;

    // parsing body when reading CRLF-CRLF and parsing header
    signal enableParsingBody <== readCRLFCRLF * isParsingHeader;

    // value를 읽는중이고, \r 을 읽는 상황
    // disable the parsing field value if we should increment parsing header and were previously parsing field value too
    signal disableParsingFieldValue <== readCR * state[2];

    // parsing_start       = out[0] = increment start - disable start
    // parsing_header      = out[1] = (increment header - disable header) * parsing body
    // parsing_field_name  = out[2] = (increment header - parsing field value) * parsing body
    // TODO: 여기 parsing body가 아니라 !parsing body여야할것같다. -> PR날리자
    // parsing_field_value = out[3] = (parsing field value - disable parsing field value) * parsing body
    // parsing_field_value = (isParsingFieldValue || disableParsingFieldValue) && !parsingBody
    // parsing_body        = out[4] = enable body
    out <== [
            (incrementParsingStart - disableParsingStart),
            (incrementParsingHeader - disableParsingHeader) * (1 - state[3]),
            (incrementParsingHeader - isParsingFieldValue) * (1 - state[3]),
            (isParsingFieldValue - disableParsingFieldValue) * (1 - state[3]),
            enableParsingBody
            ];
}

