const FILTERED_VALUE = '[Filtered]';
const WORK_ENTRY_ROUTE_PATTERN = /(^|\/)entry\/[^/?#]+(?=\/|$)/gi;
const SENSITIVE_FIELD_KEYS = new Set([
  'accountnumber',
  'address',
  'apikey',
  'authorization',
  'birth',
  'birthdate',
  'cardnumber',
  'cif',
  'company',
  'companyname',
  'compensation',
  'content',
  'cookie',
  'cvv',
  'description',
  'email',
  'employer',
  'employername',
  'evidence',
  'feedback',
  'impactstatement',
  'ipaddress',
  'name',
  'note',
  'otp',
  'passcode',
  'password',
  'phone',
  'pin',
  'project',
  'projectname',
  'rawnote',
  'reviewcontent',
  'reviewcontents',
  'salary',
  'secret',
  'sessionid',
  'text',
  'token',
  'userid',
  'username',
  'workentry',
  'workarea',
  'workareaname',
]);
const WORK_ENTRY_REFERENCE_MARKERS = [
  'work entry id ',
  'work-entry id ',
  'work_entry id ',
  'workentry id ',
  'work entry ',
  'work-entry ',
  'work_entry ',
  'workentry ',
] as const;

type SensitiveAssignment = {
  replacementStart: number;
  replacementEnd: number;
};

function normalizeFieldKey(key: string): string {
  return key.replaceAll('-', '').replaceAll('_', '').toLowerCase();
}

export function isSensitiveFieldKey(key: string): boolean {
  return SENSITIVE_FIELD_KEYS.has(normalizeFieldKey(key));
}

function isAsciiLetter(character: string | undefined): boolean {
  if (!character) {
    return false;
  }

  return (
    (character >= 'a' && character <= 'z') ||
    (character >= 'A' && character <= 'Z')
  );
}

function isAlphaNumeric(character: string | undefined): boolean {
  return (
    isAsciiLetter(character) ||
    (character !== undefined && character >= '0' && character <= '9')
  );
}

function isFieldKeyCharacter(character: string | undefined): boolean {
  return isAlphaNumeric(character) || character === '-' || character === '_';
}

function isWhitespace(character: string | undefined): boolean {
  return (
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\r'
  );
}

function skipWhitespace(value: string, start: number): number {
  let cursor = start;
  while (isWhitespace(value[cursor])) {
    cursor += 1;
  }
  return cursor;
}

function isQuote(character: string | undefined): character is '"' | "'" {
  return character === '"' || character === "'";
}

function findUnquotedValueEnd(value: string, start: number): number {
  let cursor = start;
  while (
    cursor < value.length &&
    !isWhitespace(value[cursor]) &&
    value[cursor] !== ',' &&
    value[cursor] !== ';'
  ) {
    cursor += 1;
  }
  return cursor;
}

function findFieldKeyEnd(value: string, start: number): number {
  let cursor = start + 1;
  while (isFieldKeyCharacter(value[cursor])) {
    cursor += 1;
  }
  return cursor;
}

function parseSensitiveFieldKeyEnd(
  value: string,
  start: number,
): number | null {
  const keyQuote = isQuote(value[start]) ? value[start] : null;
  const keyStart = keyQuote ? start + 1 : start;
  if (!isAsciiLetter(value[keyStart])) {
    return null;
  }

  const keyEnd = findFieldKeyEnd(value, keyStart);
  if (!isSensitiveFieldKey(value.slice(keyStart, keyEnd))) {
    return null;
  }

  if (!keyQuote) {
    return keyEnd;
  }

  return value[keyEnd] === keyQuote ? keyEnd + 1 : null;
}

function parseSensitiveValue(
  value: string,
  start: number,
): SensitiveAssignment | null {
  const valueQuote = isQuote(value[start]) ? value[start] : null;
  if (valueQuote) {
    const replacementStart = start + 1;
    const replacementEnd = value.indexOf(valueQuote, replacementStart);
    return replacementEnd < 0 ? null : { replacementStart, replacementEnd };
  }

  const replacementStart = start;
  let valueStart = start;
  if (
    value.slice(valueStart, valueStart + 6).toLowerCase() === 'bearer' &&
    isWhitespace(value[valueStart + 6])
  ) {
    valueStart = skipWhitespace(value, valueStart + 6);
  }

  const replacementEnd = findUnquotedValueEnd(value, valueStart);
  return replacementEnd === valueStart
    ? null
    : { replacementStart, replacementEnd };
}

function parseSensitiveAssignment(
  value: string,
  start: number,
): SensitiveAssignment | null {
  const keyEnd = parseSensitiveFieldKeyEnd(value, start);
  if (keyEnd === null) {
    return null;
  }

  const separatorIndex = skipWhitespace(value, keyEnd);
  if (value[separatorIndex] !== ':' && value[separatorIndex] !== '=') {
    return null;
  }

  const valueStart = skipWhitespace(value, separatorIndex + 1);
  return parseSensitiveValue(value, valueStart);
}

export function redactText(value: string): string {
  let redacted = '';
  let copiedUntil = 0;
  let cursor = 0;

  while (cursor < value.length) {
    const character = value[cursor];
    if (!isAsciiLetter(character) && !isQuote(character)) {
      cursor += 1;
      continue;
    }

    const assignment = parseSensitiveAssignment(value, cursor);
    if (!assignment) {
      cursor += 1;
      continue;
    }

    redacted +=
      value.slice(copiedUntil, assignment.replacementStart) + FILTERED_VALUE;
    copiedUntil = assignment.replacementEnd;
    cursor = Math.max(assignment.replacementEnd, cursor + 1);
  }

  return redacted + value.slice(copiedUntil);
}

function isWorkEntryIdCharacter(character: string | undefined): boolean {
  return isAlphaNumeric(character) || character === '-' || character === '_';
}

function redactTokenAfterMarker(value: string, marker: string): string {
  let result = value;
  let searchFrom = 0;

  while (searchFrom < result.length) {
    const markerIndex = result.toLowerCase().indexOf(marker, searchFrom);
    if (markerIndex < 0) {
      break;
    }

    const tokenStart = markerIndex + marker.length;
    let tokenEnd = tokenStart;
    while (isWorkEntryIdCharacter(result[tokenEnd])) {
      tokenEnd += 1;
    }

    const token = result.slice(tokenStart, tokenEnd);
    if (token.length >= 8 && isAlphaNumeric(token[0])) {
      result =
        result.slice(0, tokenStart) + FILTERED_VALUE + result.slice(tokenEnd);
      searchFrom = tokenStart + FILTERED_VALUE.length;
    } else {
      searchFrom = Math.max(tokenEnd, tokenStart + 1);
    }
  }

  return result;
}

export function redactExceptionText(value: string): string {
  return WORK_ENTRY_REFERENCE_MARKERS.reduce(
    (redactedValue, marker) => redactTokenAfterMarker(redactedValue, marker),
    redactText(value),
  );
}

export function redactUrl(value: string): string {
  const [urlWithoutQueryOrFragment] = value.split(/[?#]/, 1);
  const safeUrl = urlWithoutQueryOrFragment ?? value;

  return safeUrl.replace(WORK_ENTRY_ROUTE_PATTERN, '$1entry/[id]');
}
