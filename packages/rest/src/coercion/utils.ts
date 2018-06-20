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

export function isValidDateTime(data: Date) {
  return isNaN(data.getTime()) ? false : true;
}

const REGEX_RFC3339_DATE = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])$/;

export function matchDateFormat(date: string) {
  const pattern = new RegExp(REGEX_RFC3339_DATE);
  debug('matchDateFormat: %s', pattern.test(date));
  return pattern.test(date);
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
    switch (format) {
      case 'float':
        return 'float';
      case 'double':
        return 'double';
      default:
        return 'number';
    }
  if (type === 'integer') return format === 'int64' ? 'long' : 'integer';
}
