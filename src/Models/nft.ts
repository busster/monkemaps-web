export type NftData = {
  mint: string;
  updateAuthority: string;
  data: {
    creators: any[];
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
  };
  key: MetadataKey;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: number;
  masterEdition?: string;
  edition?: string;
  imageUri?: string;
  nftNumber?: string;
};

export enum MetadataKey {
  Uninitialized = 0,
  MetadataV1 = 4,
  EditionV1 = 1,
  MasterEditionV1 = 2,
  MasterEditionV2 = 6,
  EditionMarker = 7,
}

export interface MetaData {
  name?: string;
  symbol?: string;
  description?: string;
  sellerFeeBasisPoints?: number;
  image?: string;
  externalURL?: string;
  collection?: Collection;
  attributes?: Attribute[];
  properties?: Properties;
}

export interface Attribute {
  traitType?: string;
  value?: number | string;
}

export interface Collection {
  name?: string;
  family?: string;
}

export interface Properties {
  files?: File[];
  category?: string;
  creators?: Creator[];
}

export interface Creator {
  address?: string;
  verified?: boolean;
  share?: number;
}

export interface File {
  uri?: string;
  type?: string;
  cdn?: boolean;
}
