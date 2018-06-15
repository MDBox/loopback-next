// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {test} from './utils';
import {RestHttpErrors} from './../../../';
import {ParameterLocation} from '@loopback/openapi-v3-types';

const DATETIME_PARAM = {
  in: <ParameterLocation>'path',
  name: 'aparameter',
  schema: {type: 'string', format: 'date-time'},
};

const REQUIRED_DATETIME_PARAM = {
  in: <ParameterLocation>'path',
  name: 'aparameter',
  schema: {type: 'string', format: 'date-time'},
  required: true,
};

describe('coerce param from string to date - required', function() {
  context('valid values', () => {
    test(
      REQUIRED_DATETIME_PARAM,
      '2016-05-19T13:28:51Z',
      new Date('2016-05-19T13:28:51Z'),
    );
  });

  context('empty values trigger ERROR_BAD_REQUEST', () => {
    // null, '' sent from request are converted to raw value ''
    test(
      REQUIRED_DATETIME_PARAM,
      '',
      RestHttpErrors.missingRequired(REQUIRED_DATETIME_PARAM.name),
    );
  });
});

describe('coerce param from string to date - optional', function() {
  context('valid values', () => {
    test(
      DATETIME_PARAM,
      '2016-05-19T13:28:51Z',
      new Date('2016-05-19T13:28:51Z'),
    );
    test(
      DATETIME_PARAM,
      '2016-05-19T13:28:51-08:00',
      new Date('2016-05-19T13:28:51-08:00'),
    );
  });

  context.skip('invalid values should trigger ERROR_BAD_REQUEST', () => {
    const err = RestHttpErrors.invalidData('2016-01-01', DATETIME_PARAM.name);
    test(DATETIME_PARAM, '2016-01-01', err);
    test(DATETIME_PARAM, '2016-02-31T13:28:51Z', err);
    test(DATETIME_PARAM, '2016-05-19T13:28:51.299Z', err);
  });

  context('empty values trigger ERROR_BAD_REQUEST', () => {
    // null, '' sent from request are converted to raw value ''
    test(
      DATETIME_PARAM,
      '',
      RestHttpErrors.invalidData('', DATETIME_PARAM.name),
    );
  });

  context('empty collection converts to undefined', () => {
    // [], {} sent from request are converted to raw value undefined
    test(DATETIME_PARAM, undefined, undefined);
  });

  context('All other non-date values trigger ERROR_BAD_REQUEST', () => {
    // 'false', false, 'true', true, 'text' sent from request are converted to a string
    test(
      DATETIME_PARAM,
      'text',
      RestHttpErrors.invalidData('text', DATETIME_PARAM.name),
    );
    // {a: true}, [1,2] are converted to object
    test(
      DATETIME_PARAM,
      {a: true},
      RestHttpErrors.invalidData({a: true}, DATETIME_PARAM.name),
    );
  });
});
