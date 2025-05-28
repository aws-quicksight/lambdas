import { assert, describe, test } from 'vitest';
import jsonSetValueByPath from '../../src/actions/json_set_value_by_path.js';
import { fileContents } from '../test_utils.js';

describe('json_set_value_by_path', () => {
  test('should set value by path', () => {
    const jsonRawContent = fileContents('products.json');
    const json = JSON.parse(jsonRawContent) as Record<string, unknown>;

    assert.propertyVal(json, 'Name', 'dataset-prod-pArticulos');

    const result = jsonSetValueByPath(json, '$.Name', 'John Doe');

    assert.isTrue(result);
    assert.propertyVal(json, 'Name', 'John Doe');
  });

  test('should return false if path is not found', () => {
    const jsonRawContent = fileContents('products.json');
    const json = JSON.parse(jsonRawContent) as Record<string, unknown>;
    const result = jsonSetValueByPath(json, '$.Description', 'John Doe');

    assert.isFalse(result);
    assert.deepEqual(json, JSON.parse(jsonRawContent));
  });

  test('should change value in path nested', () => {
    const jsonRawContent = fileContents('products.json');
    const json = JSON.parse(jsonRawContent) as Record<string, unknown>;

    const dataTransforms = (
      json.LogicalTableMap as {
        '3ad46d31-885f-479d-be90-3d2256bf5f01': { DataTransforms: Record<string, unknown>[] };
      }
    )['3ad46d31-885f-479d-be90-3d2256bf5f01'].DataTransforms;
    const secondRenameColumnOperation = dataTransforms[0].RenameColumnOperation;

    assert.propertyVal(secondRenameColumnOperation, 'NewColumnName', 'Clave');

    const result = jsonSetValueByPath(
      json,
      '$.LogicalTableMap.3ad46d31-885f-479d-be90-3d2256bf5f01.DataTransforms[0].RenameColumnOperation.NewColumnName',
      'NewClave',
    );

    assert.isTrue(result);
    assert.propertyVal(secondRenameColumnOperation, 'NewColumnName', 'NewClave');
  });
});
