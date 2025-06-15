import { Contract } from "@prisma/client";
import { z } from "zod";
import { ContractSchema } from "../schemas";
import {
  OperationNodeTransformer,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  PrimitiveValueListNode,
  QueryResult,
  RootOperationNode,
  UnknownRow,
  ValueNode,
} from "kysely";

import { type KyselyPlugin } from "kysely";

// The code below is necessary to make kysely cast number to booleans (sqlite doesn't support booleans)

export class SqliteBooleanPlugin implements KyselyPlugin {
  readonly #transformer = new SqliteBooleanTransformer();

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node);
  }

  transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result);
  }
}

class SqliteBooleanTransformer extends OperationNodeTransformer {
  override transformValue(node: ValueNode): ValueNode {
    return {
      ...super.transformValue(node),
      value: this.serialize(node.value),
    };
  }

  transformPrimitiveValueList(
    node: PrimitiveValueListNode
  ): PrimitiveValueListNode {
    return {
      ...super.transformPrimitiveValueList(node),
      values: node.values.map((value) => this.serialize(value)),
    };
  }

  private serialize(value: unknown) {
    return typeof value === "boolean" ? (value ? 1 : 0) : value;
  }
}

export const contractPreprocessor = (value: any) => {
  return value.map((row: any) => ({
    ...row,
    isProxy: Boolean(row.isProxy === 1),
  }));
};

export const transformContracts = (result: any): Contract[] => {
  return z
    .preprocess(contractPreprocessor, z.array(ContractSchema))
    .parse(result);
};
