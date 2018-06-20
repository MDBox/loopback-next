// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as debugModule from 'debug';

const debug = debugModule('loopback:rest:coercion');

export function isEmpty(data: string) {
  debug('isEmpty %s', data);
  return data === '';
}
/**
 * A set of truthy values. A data in this set will be coerced to `true`.
 *
 * @param data The raw data get from http request
 * @returns The corresponding coerced boolean type
 */
export function isTrue(data: string): boolean {
  return ['TRUE', '1'].includes(data.toUpperCase());
}

/**
 * A set of falsy values. A data in this set will be coerced to `false`.
 * @param data The raw data get from http request
 * @returns The corresponding coerced boolean type
 */
export function isFalse(data: string): boolean {
  return ['FALSE', '0'].includes(data.toUpperCase());
}

export function isSafeInteger(data: number) {
  return -Number.MAX_SAFE_INTEGER <= data && data <= Number.MAX_SAFE_INTEGER;
}

export function isValidDateTime(data: Date) {
  return isNaN(data.getTime()) ? false : true;
}

/**
 * Return the corresponding OpenAPI data type given an OpenAPI schema
 *
 * @param type The type in an OpenAPI schema specification
 * @param format The format in an OpenAPI schema specification
 */
export function getOAIPrimitiveType(type?: string, format?: string) {
  // serizlize will be supported in next PR
  if (type === 'object' || type === 'array') return 'serialize';
  if (type === 'string') {
    switch (format) {
      case 'byte':
        return 'byte';
      case 'binary':
        return 'binary';
      case 'date':
        return 'date';
      case 'date-time':
        return 'date-time';
      case 'password':
        return 'password';
      default:
        return 'string';
    }
  }
  if (type === 'boolean') return 'boolean';
  if (type === 'number')
    return format === 'float'
      ? 'float'
      : format === 'double'
        ? 'double'
        : 'number';
  if (type === 'integer') return format === 'int64' ? 'long' : 'integer';
}
