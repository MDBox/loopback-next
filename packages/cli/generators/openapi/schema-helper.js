// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const util = require('util');
const json5 = require('json5');

const {isExtension, titleCase, kebabCase, camelCase} = require('./utils');

function toJsonStr(val) {
  return json5.stringify(val, null, 2);
}

function getTypeSpec(schema, options) {
  const objectTypeMapping = options.objectTypeMapping;
  let typeSpec = objectTypeMapping.get(schema);
  if (!typeSpec) {
    typeSpec = {};
    objectTypeMapping.set(schema, typeSpec);
  }
  return typeSpec;
}

function getDefault(schema, options) {
  let defaultVal = '';
  if (options && options.includeDefault && schema.default !== undefined) {
    defaultVal = ' = ' + toJsonStr(schema.default);
  }
  return defaultVal;
}

function getBaseName(tsFileName) {
  if (tsFileName.endsWith('.ts')) {
    return tsFileName.substring(0, tsFileName.length - 3);
  }
  return tsFileName;
}

/**
 * Map composite type (oneOf|anyOf|allOf)
 * @param {object} schema
 * @param {object} options
 */
function mapCompositeType(schema, options) {
  options = Object.assign({}, options, {includeDefault: false});
  const typeSpec = getTypeSpec(schema, options);
  let separator = '';
  let candidates = [];
  if (Array.isArray(schema.oneOf)) {
    separator = ' | ';
    candidates = schema.oneOf;
  } else if (Array.isArray(schema.anyOf)) {
    separator = ' | ';
    candidates = schema.anyOf;
  } else if (Array.isArray(schema.allOf)) {
    separator = ' & ';
    candidates = schema.allOf;
  }
  if (!separator) return undefined;
  const types = candidates.map(t => mapSchemaType(t, options));
  const members = Array.from(new Set(types));
  typeSpec.members = members;
  typeSpec.signature =
    members.map(m => m.signature).join(separator) + getDefault(schema, options);
  if (typeSpec.fileName) {
    typeSpec.import = `import {${typeSpec.className}} from './${getBaseName(
      typeSpec.fileName,
    )}';`;
  }
  return typeSpec;
}

function mapArrayType(schema, options) {
  if (schema.type === 'array') {
    const opts = Object.assign({}, options, {includeDefault: false});
    const typeSpec = getTypeSpec(schema, options);
    const itemTypeSpec = mapSchemaType(schema.items, opts);
    typeSpec.name = itemTypeSpec.signature + '[]';
    typeSpec.signature =
      itemTypeSpec.signature + '[]' + getDefault(schema, options);
    typeSpec.itemType = itemTypeSpec;
    if (itemTypeSpec.import) {
      typeSpec.import = itemTypeSpec.import;
    }
    return typeSpec;
  }
  return undefined;
}

function mapObjectType(schema, options) {
  if (schema.type === 'object' || schema.properties) {
    const defaultVal = getDefault(schema, options);
    const typeSpec = getTypeSpec(schema, options);
    typeSpec.kind = 'class';
    if (typeSpec.declaration != null) {
      if (typeSpec.declaration === '') {
        typeSpec.signature = typeSpec.className;
      }
      return typeSpec;
    } else {
      typeSpec.declaration = ''; // in-progress
    }
    const properties = [];
    const required = schema.required || [];
    for (const p in schema.properties) {
      const suffix = required.includes(p) ? '' : '?';
      const propertyType = mapSchemaType(
        schema.properties[p],
        Object.assign({}, options, {
          includeDefault: true,
        }),
      );
      // The property name might have chars such as `-`
      const propName = camelCase(p);
      const propSpec = {
        name: p,
        type: propertyType.signature,
        signature: `${propName + suffix}: ${propertyType.signature};`,
        decoration: `@property({name: '${p}'})`,
      };
      if (propertyType.import) {
        propSpec.import = propertyType.import;
      }
      properties.push(propSpec);
    }
    typeSpec.properties = properties;
    const propertySignatures = properties.map(p => p.signature);
    typeSpec.declaration = `{
  ${propertySignatures.join('\n  ')}
}`;
    typeSpec.signature =
      (typeSpec.className || typeSpec.declaration) + defaultVal;
    if (typeSpec.fileName) {
      typeSpec.import = `import {${typeSpec.className}} from './${getBaseName(
        typeSpec.fileName,
      )}';`;
    }
    return typeSpec;
  }
  return undefined;
}

function mapPrimitiveType(schema, options) {
  /**
   * integer	integer	int32	    signed 32 bits
   * long	    integer	int64	    signed 64 bits
   * float	  number	float
   * double	  number	double
   * string	  string
   * byte	    string	byte	    base64 encoded characters
   * binary	  string	binary	  any sequence of octets
   * boolean	boolean
   * date	    string	date	    As defined by full-date - RFC3339
   * dateTime	string	date-time	As defined by date-time - RFC3339
   * password	string	password	A hint to UIs to obscure input.
   */
  let jsType = 'string';
  switch (schema.type) {
    case 'integer':
    case 'number':
      jsType = 'number';
      break;
    case 'boolean':
      jsType = 'boolean';
      break;
    case 'string':
      switch (schema.format) {
        case 'date':
        case 'date-time':
          jsType = 'Date';
          break;
        case 'binary':
          jsType = 'Buffer';
          break;
        case 'byte':
        case 'password':
          jsType = 'string';
          break;
      }
      break;
  }
  // Handle enums
  if (Array.isArray(schema.enum)) {
    jsType = schema.enum.map(v => toJsonStr(v)).join(' | ');
  }
  const typeSpec = getTypeSpec(schema, options);
  const defaultVal = getDefault(schema, options);
  typeSpec.declaration = jsType;
  typeSpec.signature = typeSpec.declaration + defaultVal;
  if (typeSpec.fileName) {
    typeSpec.import = `import {${typeSpec.className}} from './${getBaseName(
      typeSpec.fileName,
    )}';`;
  }
  typeSpec.name = typeSpec.name || jsType;
  return typeSpec;
}

/**
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#data-types
 *
 * @param {object} schema
 */
function mapSchemaType(schema, options) {
  options = options || {};
  if (!options.objectTypeMapping) {
    options.objectTypeMapping = new Map();
  }

  const compositeType = mapCompositeType(schema, options);
  if (compositeType) {
    return compositeType;
  }

  const arrayType = mapArrayType(schema, options);
  if (arrayType) {
    return arrayType;
  }

  const objectType = mapObjectType(schema, options);
  if (objectType) {
    return objectType;
  }

  return mapPrimitiveType(schema, options);
}

/**
 * Generate model definitions from openapi spec
 * @param {object} apiSpec
 */
function generateModelSpecs(apiSpec, options) {
  options = options || {objectTypeMapping: new Map()};
  const objectTypeMapping = options.objectTypeMapping;

  const schemas =
    (apiSpec && apiSpec.components && apiSpec.components.schemas) || {};

  // First map schema objects to names
  for (const s in schemas) {
    if (isExtension(s)) continue;
    const className = titleCase(s);
    objectTypeMapping.set(schemas[s], {
      name: s,
      className,
      fileName: getModelFileName(s),
      properties: [],
      imports: [],
    });
  }

  const models = [];
  // Generate models from schema objects
  for (const s in schemas) {
    if (isExtension(s)) continue;
    const schema = schemas[s];
    mapSchemaType(schema, {objectTypeMapping});
    const model = objectTypeMapping.get(schema);
    // `model` is `undefined` for primitive types
    if (model == null) continue;
    if (model.className) {
      models.push(model);
    }
    if (model.members) {
      model.members.forEach(m => {
        if (m.import && !model.imports.includes(m.import)) {
          model.imports.push(m.import);
        }
      });
    }
    if (model.properties) {
      model.properties.forEach(p => {
        if (p.import && !model.imports.includes(p.import)) {
          model.imports.push(p.import);
        }
      });
    }
    if (model.itemType) {
      if (model.itemType.import) {
        model.imports.push(model.itemType.import);
      }
    }
  }
  return models;
}

function getModelFileName(modelName) {
  let name = modelName;
  if (modelName.endsWith('Model')) {
    name = modelName.substring(0, modelName.length - 'Model'.length);
  }
  return kebabCase(name) + '.model.ts';
}

module.exports = {
  mapSchemaType,
  generateModelSpecs,
  getModelFileName,
};
