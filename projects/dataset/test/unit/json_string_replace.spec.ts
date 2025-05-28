import { assert, describe, test } from 'vitest';
import jsonStringReplace from '../../src/actions/json_string_replace.js';
import { fileContents } from '../test_utils.js';

describe('json_string_replace', () => {
  test('should replace string', () => {
    const jsonRawContent = fileContents('products.json');
    const result = jsonStringReplace(
      jsonRawContent,
      "\"arn:aws:quicksight:us-east-1:951464950892:datasource/2f6ac039-fba9-11ef-a20b-0affdc0eaeb7\"",
      "\"arn:aws:quicksight:us-east-1:867344461009:datasource/74b652d8-c79a-48e8-8256-3d19099e2199\"",
    );

    assert.notEqual(result, jsonRawContent);
    assert.isObject(JSON.parse(result));
  });
});
