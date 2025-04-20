export interface Transfer {
  fromAddress: Address;
  toAddress: Address;
}

export interface Address {
  address: string;
  arkhamEntity?: Entity;
  arkhamLabel?: Label;
}

export interface Entity {
  id: string;
  name: string;
}

export interface Label {
  name: string;
}

export interface TransferResponse {
  transfers: Transfer[];
}

export interface LabelResult {
  address: string;
  label?: Label;
  entity: Entity;
}
