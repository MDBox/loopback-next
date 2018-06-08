# lb4 openapi

The `openapi` command generates LoopBack 4 artifacts from an
[OpenAPI specification](https://github.com/OAI/OpenAPI-Specification), including
version 2.0 and 3.0.

## Basic use

```sh
lb4 openapi <url or file path to the spec>
```

## Mappings

We map OpenAPI operations by tag into `controllers` and schemas into TypeScript
classes or types.

### Schemas

The generator first iterates through the `components.schemas` of the
specification document and maps them into TypeScript classes or types:

- Primitive types --> TypeScript type declaration

```ts
export type OrderEnum = 'ascending' | 'descending';
```

```ts
export type Message = string;
```

- Array types --> TypeScript type declaration

```ts
import {Comment} from './comment.model';
export type Comments = Comment[];
```

- Object type --> TypeScript class definition

```ts
import {model, property} from '@loopback/repository';

/**
 * The model class is generated from OpenAPI schema - Comment
 */
@model({name: 'Comment'})
export class Comment {
  constructor(data?: Partial<Comment>) {
    if (data != null && typeof data === 'object') {
      Object.assign(this, data);
    }
  }

  @property({name: 'authorArn'})
  authorArn?: string;

  @property({name: 'clientRequestToken'})
  clientRequestToken?: string;

  @property({name: 'commentId'})
  commentId?: string;

  @property({name: 'content'})
  content?: string;

  @property({name: 'creationDate'})
  creationDate?: Date;

  @property({name: 'deleted'})
  deleted?: boolean;

  @property({name: 'inReplyTo'})
  inReplyTo?: string;

  @property({name: 'lastModifiedDate'})
  lastModifiedDate?: Date;
}
```

- Composite type (anyOf|oneOf|allOf) --> TypeScript union/intersection types

```ts
export type IdType = string | number;
```

```ts
import {NewPet} from './new-pet.model.ts';
export type Pet = NewPet & {id: number};
```

### Operations

The generator groups operations (`paths.<path>.<verb>`) by tags. If no tag is
present, it defaults to `OpenApi`. For each tag, a controller class is generated
to hold all operations with the same tag.

```ts
import {operation, param} from '@loopback/rest';
/**
 * The controller class is generated from OpenAPI spec
 */
export class AccountController {
  constructor() {}

  /**
   * Get list of carts.
   */
  @operation('get', '/account.cart.list.json')
  async accountCartList(
    @param({name: 'params', in: 'query'})
    params: string,
    @param({name: 'exclude', in: 'query'})
    exclude: string,
    @param({name: 'request_from_date', in: 'query'})
    requestFromDate: string,
    @param({name: 'request_to_date', in: 'query'})
    requestToDate: string,
  ): Promise<any> {
    throw new Error('Not implemented');
  }

  /**
   * Update configs in the API2Cart database.
   */
  @operation('put', '/account.config.update.json')
  async accountConfigUpdate(
    @param({name: 'db_tables_prefix', in: 'query'})
    dbTablesPrefix: string,
    @param({name: 'client_id', in: 'query'})
    clientId: string,
    @param({name: 'bridge_url', in: 'query'})
    bridgeUrl: string,
    @param({name: 'store_root', in: 'query'})
    storeRoot: string,
    @param({name: 'shared_secret', in: 'query'})
    sharedSecret: string,
  ): Promise<any> {
    throw new Error('Not implemented');
  }

  /**
   * List webhooks that was not delivered to the callback.
   */
  @operation('get', '/account.failed_webhooks.json')
  async accountFailedWebhooks(
    @param({name: 'count', in: 'query'})
    count: string,
    @param({name: 'start', in: 'query'})
    start: string,
    @param({name: 'ids', in: 'query'})
    ids: string,
  ): Promise<any> {
    throw new Error('Not implemented');
  }
}
```

## Examples

- https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore-expanded.yaml
- https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/uspto.yaml
- https://api.apis.guru/v2/specs/api2cart.com/1.0.0/swagger.json
- https://api.apis.guru/v2/specs/amazonaws.com/codecommit/2015-04-13/swagger.json
