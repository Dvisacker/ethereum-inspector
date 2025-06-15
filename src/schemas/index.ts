import { z } from 'zod';
import type { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['Serializable']);

export const ContractScalarFieldEnumSchema = z.enum(['id','address','networkId','name','isProxy','proxyType','implementationAddress','entity','bytecode','deployedBytecode','abi']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullsOrderSchema = z.enum(['first','last']);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// CONTRACT SCHEMA
/////////////////////////////////////////

export const ContractSchema = z.object({
  id: z.number().int(),
  address: z.string(),
  networkId: z.number().int(),
  name: z.string().nullable(),
  /**
   * @kyselyType(boolean)
   */
  isProxy: z.boolean(),
  proxyType: z.string().nullable(),
  implementationAddress: z.string().nullable(),
  entity: z.string().nullable(),
  bytecode: z.string().nullable(),
  deployedBytecode: z.string().nullable(),
  abi: z.string().nullable(),
})

export type Contract = z.infer<typeof ContractSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// CONTRACT
//------------------------------------------------------

export const ContractSelectSchema: z.ZodType<Prisma.ContractSelect> = z.object({
  id: z.boolean().optional(),
  address: z.boolean().optional(),
  networkId: z.boolean().optional(),
  name: z.boolean().optional(),
  isProxy: z.boolean().optional(),
  proxyType: z.boolean().optional(),
  implementationAddress: z.boolean().optional(),
  entity: z.boolean().optional(),
  bytecode: z.boolean().optional(),
  deployedBytecode: z.boolean().optional(),
  abi: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const ContractWhereInputSchema: z.ZodType<Prisma.ContractWhereInput> = z.object({
  AND: z.union([ z.lazy(() => ContractWhereInputSchema),z.lazy(() => ContractWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ContractWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ContractWhereInputSchema),z.lazy(() => ContractWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  address: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  networkId: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  isProxy: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  proxyType: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  implementationAddress: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  entity: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  bytecode: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  deployedBytecode: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  abi: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const ContractOrderByWithRelationInputSchema: z.ZodType<Prisma.ContractOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  networkId: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  isProxy: z.lazy(() => SortOrderSchema).optional(),
  proxyType: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  implementationAddress: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  entity: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  bytecode: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  deployedBytecode: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  abi: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
}).strict();

export const ContractWhereUniqueInputSchema: z.ZodType<Prisma.ContractWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    address_networkId: z.lazy(() => ContractAddressNetworkIdCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    address_networkId: z.lazy(() => ContractAddressNetworkIdCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.number().int().optional(),
  address_networkId: z.lazy(() => ContractAddressNetworkIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => ContractWhereInputSchema),z.lazy(() => ContractWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ContractWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ContractWhereInputSchema),z.lazy(() => ContractWhereInputSchema).array() ]).optional(),
  address: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  networkId: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  isProxy: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  proxyType: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  implementationAddress: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  entity: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  bytecode: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  deployedBytecode: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  abi: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
}).strict());

export const ContractOrderByWithAggregationInputSchema: z.ZodType<Prisma.ContractOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  networkId: z.lazy(() => SortOrderSchema).optional(),
  name: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  isProxy: z.lazy(() => SortOrderSchema).optional(),
  proxyType: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  implementationAddress: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  entity: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  bytecode: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  deployedBytecode: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  abi: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => ContractCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ContractAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ContractMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ContractMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ContractSumOrderByAggregateInputSchema).optional()
}).strict();

export const ContractScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ContractScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => ContractScalarWhereWithAggregatesInputSchema),z.lazy(() => ContractScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ContractScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ContractScalarWhereWithAggregatesInputSchema),z.lazy(() => ContractScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  address: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  networkId: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  isProxy: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  proxyType: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  implementationAddress: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  entity: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  bytecode: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  deployedBytecode: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  abi: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const ContractCreateInputSchema: z.ZodType<Prisma.ContractCreateInput> = z.object({
  address: z.string(),
  networkId: z.number().int(),
  name: z.string().optional().nullable(),
  isProxy: z.boolean().optional(),
  proxyType: z.string().optional().nullable(),
  implementationAddress: z.string().optional().nullable(),
  entity: z.string().optional().nullable(),
  bytecode: z.string().optional().nullable(),
  deployedBytecode: z.string().optional().nullable(),
  abi: z.string().optional().nullable()
}).strict();

export const ContractUncheckedCreateInputSchema: z.ZodType<Prisma.ContractUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  address: z.string(),
  networkId: z.number().int(),
  name: z.string().optional().nullable(),
  isProxy: z.boolean().optional(),
  proxyType: z.string().optional().nullable(),
  implementationAddress: z.string().optional().nullable(),
  entity: z.string().optional().nullable(),
  bytecode: z.string().optional().nullable(),
  deployedBytecode: z.string().optional().nullable(),
  abi: z.string().optional().nullable()
}).strict();

export const ContractUpdateInputSchema: z.ZodType<Prisma.ContractUpdateInput> = z.object({
  address: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  networkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isProxy: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  proxyType: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  implementationAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  entity: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bytecode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deployedBytecode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  abi: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const ContractUncheckedUpdateInputSchema: z.ZodType<Prisma.ContractUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  address: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  networkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isProxy: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  proxyType: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  implementationAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  entity: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bytecode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deployedBytecode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  abi: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const ContractCreateManyInputSchema: z.ZodType<Prisma.ContractCreateManyInput> = z.object({
  id: z.number().int().optional(),
  address: z.string(),
  networkId: z.number().int(),
  name: z.string().optional().nullable(),
  isProxy: z.boolean().optional(),
  proxyType: z.string().optional().nullable(),
  implementationAddress: z.string().optional().nullable(),
  entity: z.string().optional().nullable(),
  bytecode: z.string().optional().nullable(),
  deployedBytecode: z.string().optional().nullable(),
  abi: z.string().optional().nullable()
}).strict();

export const ContractUpdateManyMutationInputSchema: z.ZodType<Prisma.ContractUpdateManyMutationInput> = z.object({
  address: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  networkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isProxy: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  proxyType: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  implementationAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  entity: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bytecode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deployedBytecode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  abi: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const ContractUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ContractUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  address: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  networkId: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isProxy: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  proxyType: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  implementationAddress: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  entity: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  bytecode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  deployedBytecode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  abi: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.object({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional()
}).strict();

export const ContractAddressNetworkIdCompoundUniqueInputSchema: z.ZodType<Prisma.ContractAddressNetworkIdCompoundUniqueInput> = z.object({
  address: z.string(),
  networkId: z.number()
}).strict();

export const ContractCountOrderByAggregateInputSchema: z.ZodType<Prisma.ContractCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  networkId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  isProxy: z.lazy(() => SortOrderSchema).optional(),
  proxyType: z.lazy(() => SortOrderSchema).optional(),
  implementationAddress: z.lazy(() => SortOrderSchema).optional(),
  entity: z.lazy(() => SortOrderSchema).optional(),
  bytecode: z.lazy(() => SortOrderSchema).optional(),
  deployedBytecode: z.lazy(() => SortOrderSchema).optional(),
  abi: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ContractAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ContractAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  networkId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ContractMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ContractMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  networkId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  isProxy: z.lazy(() => SortOrderSchema).optional(),
  proxyType: z.lazy(() => SortOrderSchema).optional(),
  implementationAddress: z.lazy(() => SortOrderSchema).optional(),
  entity: z.lazy(() => SortOrderSchema).optional(),
  bytecode: z.lazy(() => SortOrderSchema).optional(),
  deployedBytecode: z.lazy(() => SortOrderSchema).optional(),
  abi: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ContractMinOrderByAggregateInputSchema: z.ZodType<Prisma.ContractMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  address: z.lazy(() => SortOrderSchema).optional(),
  networkId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  isProxy: z.lazy(() => SortOrderSchema).optional(),
  proxyType: z.lazy(() => SortOrderSchema).optional(),
  implementationAddress: z.lazy(() => SortOrderSchema).optional(),
  entity: z.lazy(() => SortOrderSchema).optional(),
  bytecode: z.lazy(() => SortOrderSchema).optional(),
  deployedBytecode: z.lazy(() => SortOrderSchema).optional(),
  abi: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ContractSumOrderByAggregateInputSchema: z.ZodType<Prisma.ContractSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  networkId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional()
}).strict();

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.object({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional().nullable()
}).strict();

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.object({
  set: z.boolean().optional()
}).strict();

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
}).strict();

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const ContractFindFirstArgsSchema: z.ZodType<Prisma.ContractFindFirstArgs> = z.object({
  select: ContractSelectSchema.optional(),
  where: ContractWhereInputSchema.optional(),
  orderBy: z.union([ ContractOrderByWithRelationInputSchema.array(),ContractOrderByWithRelationInputSchema ]).optional(),
  cursor: ContractWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ContractScalarFieldEnumSchema,ContractScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ContractFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ContractFindFirstOrThrowArgs> = z.object({
  select: ContractSelectSchema.optional(),
  where: ContractWhereInputSchema.optional(),
  orderBy: z.union([ ContractOrderByWithRelationInputSchema.array(),ContractOrderByWithRelationInputSchema ]).optional(),
  cursor: ContractWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ContractScalarFieldEnumSchema,ContractScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ContractFindManyArgsSchema: z.ZodType<Prisma.ContractFindManyArgs> = z.object({
  select: ContractSelectSchema.optional(),
  where: ContractWhereInputSchema.optional(),
  orderBy: z.union([ ContractOrderByWithRelationInputSchema.array(),ContractOrderByWithRelationInputSchema ]).optional(),
  cursor: ContractWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ContractScalarFieldEnumSchema,ContractScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ContractAggregateArgsSchema: z.ZodType<Prisma.ContractAggregateArgs> = z.object({
  where: ContractWhereInputSchema.optional(),
  orderBy: z.union([ ContractOrderByWithRelationInputSchema.array(),ContractOrderByWithRelationInputSchema ]).optional(),
  cursor: ContractWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ContractGroupByArgsSchema: z.ZodType<Prisma.ContractGroupByArgs> = z.object({
  where: ContractWhereInputSchema.optional(),
  orderBy: z.union([ ContractOrderByWithAggregationInputSchema.array(),ContractOrderByWithAggregationInputSchema ]).optional(),
  by: ContractScalarFieldEnumSchema.array(),
  having: ContractScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ContractFindUniqueArgsSchema: z.ZodType<Prisma.ContractFindUniqueArgs> = z.object({
  select: ContractSelectSchema.optional(),
  where: ContractWhereUniqueInputSchema,
}).strict() ;

export const ContractFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ContractFindUniqueOrThrowArgs> = z.object({
  select: ContractSelectSchema.optional(),
  where: ContractWhereUniqueInputSchema,
}).strict() ;

export const ContractCreateArgsSchema: z.ZodType<Prisma.ContractCreateArgs> = z.object({
  select: ContractSelectSchema.optional(),
  data: z.union([ ContractCreateInputSchema,ContractUncheckedCreateInputSchema ]),
}).strict() ;

export const ContractUpsertArgsSchema: z.ZodType<Prisma.ContractUpsertArgs> = z.object({
  select: ContractSelectSchema.optional(),
  where: ContractWhereUniqueInputSchema,
  create: z.union([ ContractCreateInputSchema,ContractUncheckedCreateInputSchema ]),
  update: z.union([ ContractUpdateInputSchema,ContractUncheckedUpdateInputSchema ]),
}).strict() ;

export const ContractCreateManyArgsSchema: z.ZodType<Prisma.ContractCreateManyArgs> = z.object({
  data: z.union([ ContractCreateManyInputSchema,ContractCreateManyInputSchema.array() ]),
}).strict() ;

export const ContractCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ContractCreateManyAndReturnArgs> = z.object({
  data: z.union([ ContractCreateManyInputSchema,ContractCreateManyInputSchema.array() ]),
}).strict() ;

export const ContractDeleteArgsSchema: z.ZodType<Prisma.ContractDeleteArgs> = z.object({
  select: ContractSelectSchema.optional(),
  where: ContractWhereUniqueInputSchema,
}).strict() ;

export const ContractUpdateArgsSchema: z.ZodType<Prisma.ContractUpdateArgs> = z.object({
  select: ContractSelectSchema.optional(),
  data: z.union([ ContractUpdateInputSchema,ContractUncheckedUpdateInputSchema ]),
  where: ContractWhereUniqueInputSchema,
}).strict() ;

export const ContractUpdateManyArgsSchema: z.ZodType<Prisma.ContractUpdateManyArgs> = z.object({
  data: z.union([ ContractUpdateManyMutationInputSchema,ContractUncheckedUpdateManyInputSchema ]),
  where: ContractWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ContractUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ContractUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ContractUpdateManyMutationInputSchema,ContractUncheckedUpdateManyInputSchema ]),
  where: ContractWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const ContractDeleteManyArgsSchema: z.ZodType<Prisma.ContractDeleteManyArgs> = z.object({
  where: ContractWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;