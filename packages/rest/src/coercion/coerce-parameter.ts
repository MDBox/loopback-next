// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {ParameterObject, isReferenceObject} from '@loopback/openapi-v3-types';
import {Validator} from './validator';
import * as debugModule from 'debug';
import {RestHttpErrors} from '../';

const debug = debugModule('loopback:rest:coercion');

/**
 * Coerce the http raw data to a JavaScript type data of a parameter
 * according to its OpenAPI schema specification.
 *
 * @param data The raw data get from http request
 * @param schema The parameter's schema defined in OpenAPI specification
 */
export function coerceParameter(
  data: string | undefined | object,
  spec: ParameterObject,
) {
  const schema = spec.schema;
  if (!schema || isReferenceObject(schema)) {
    debug(
      'The parameter with schema %s is not coerced since schema' +
        'dereference is not supported yet.',
      schema,
    );
    return data;
  }
  const OAIType = getOAIPrimitiveType(schema.type, schema.format);
  const validator = new Validator({parameterSpec: spec});

  validator.validateParamBeforeCoercion(data);
  if (data === undefined) return data;

  switch (OAIType) {
    case 'byte':
      if (typeof data === 'object')
        throw RestHttpErrors.invalidData(data, spec.name);
      return Buffer.from(data, 'base64');
    case 'date':
    case 'date-time':
      if (typeof data === 'object')
        throw RestHttpErrors.invalidData(data, spec.name);
      if (isEmpty(data)) throw RestHttpErrors.invalidData(data, spec.name);
      const coercedDate = new Date(data);
      if (!isValidDateTime(coercedDate))
        throw RestHttpErrors.invalidData(data, spec.name);
      return coercedDate;
    case 'float':
    case 'double':
      if (typeof data === 'object')
        throw RestHttpErrors.invalidData(data, spec.name);
      return parseFloat(data);
    case 'number':
      if (typeof data === 'object')
        throw RestHttpErrors.invalidData(data, spec.name);
      if (isEmpty(data)) throw RestHttpErrors.invalidData(data, spec.name);

      const coercedNum = Number(data);
      if (isNaN(coercedNum)) throw RestHttpErrors.invalidData(data, spec.name);

      debug('data of type number is coerced to %s', coercedNum);
      return coercedNum;
    case 'long':
      return Number(data);
    case 'integer':
      if (typeof data === 'object')
        throw RestHttpErrors.invalidData(data, spec.name);
      if (isEmpty(data)) throw RestHttpErrors.invalidData(data, spec.name);

      const coercedInt = Number(data);
      if (isNaN(coercedInt!)) throw RestHttpErrors.invalidData(data, spec.name);
      if (!isSafeInteger(coercedInt!))
        throw RestHttpErrors.exceedsMaxSafeInt(spec.name);
      if (!Number.isInteger(coercedInt!))
        throw RestHttpErrors.invalidData(data, spec.name);

      debug('data of type integer is coerced to %s', coercedInt);
      return coercedInt;
    case 'boolean':
      if (typeof data === 'object')
        throw RestHttpErrors.invalidData(data, spec.name);
      if (isEmpty(data)) throw RestHttpErrors.invalidData(data, spec.name);
      if (isTrue(data)) return true;
      if (isFalse(data)) return false;
      throw RestHttpErrors.invalidData(data, spec.name);
    case 'string':
    case 'password':
    // serialize will be supported in next PR
    case 'serialize':
    default:
      return data;
  }
}

function isEmpty(data: string) {
  debug('isEmpty %s', data);
  return data === '';
}
/**
 * A set of truthy values. A data in this set will be coerced to `true`.
 *
 * @param data The raw data get from http request
 * @returns The corresponding coerced boolean type
 */
function isTrue(data: string): boolean {
  return ['TRUE', '1'].includes(data.toUpperCase());
}

/**
 * A set of falsy values. A data in this set will be coerced to `false`.
 * @param data The raw data get from http request
 * @returns The corresponding coerced boolean type
 */
function isFalse(data: string): boolean {
  return ['FALSE', '0'].includes(data.toUpperCase());
}

function isSafeInteger(data: number) {
  return -Number.MAX_SAFE_INTEGER <= data && data <= Number.MAX_SAFE_INTEGER;
}

function isValidDateTime(data: Date) {
  return isNaN(data.getTime()) ? false : true;
}

/**
 * Return the corresponding OpenAPI data type given an OpenAPI schema
 *
 * @param type The type in an OpenAPI schema specification
 * @param format The format in an OpenAPI schema specification
 */
function getOAIPrimitiveType(type?: string, format?: string) {
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
