export type TokenFuser = {
  "version": "0.0.0",
  "name": "token_fuser",
  "instructions": [
    {
      "name": "createFilterSettings",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "filterSettings",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "crankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "filterMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "paysEveryTime",
          "type": "bool"
        }
      ]
    },
    {
      "name": "requestFuse",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "filter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseRequest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "crankAuthority",
          "type": "publicKey"
        },
        {
          "name": "bountyAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fulfillFuseRequest",
      "accounts": [
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseRequest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "requester",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        }
      ]
    },
    {
      "name": "createFusedMetadata",
      "accounts": [
        {
          "name": "filterMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseRequest",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "filterSettings",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseCreator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "baseMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "entangleBaseAndFused",
      "accounts": [
        {
          "name": "filterMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseRequest",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "filterSettings",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasuryMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintOriginal",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataOriginal",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "editionOriginal",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintFiltered",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataFiltered",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "editionFiltered",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "entangledPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reverseEntangledPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "fuseRequest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "filter",
            "type": "publicKey"
          },
          {
            "name": "requester",
            "type": "publicKey"
          },
          {
            "name": "completed",
            "type": "bool"
          },
          {
            "name": "crankAuthority",
            "type": "publicKey"
          },
          {
            "name": "bountyAmount",
            "type": "u64"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "filterSettings",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "filterMint",
            "type": "publicKey"
          },
          {
            "name": "treasuryMint",
            "type": "publicKey"
          },
          {
            "name": "treasuryAddress",
            "type": "publicKey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "paysEveryTime",
            "type": "bool"
          },
          {
            "name": "crankAuthority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MintSupplyNonZero",
      "msg": "Mint account invalid for fusion since tokens have already been minted"
    }
  ]
};

export const IDL: TokenFuser = {
  "version": "0.0.0",
  "name": "token_fuser",
  "instructions": [
    {
      "name": "createFilterSettings",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "filterSettings",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "crankAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "filterMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "paysEveryTime",
          "type": "bool"
        }
      ]
    },
    {
      "name": "requestFuse",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "filter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseRequest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "crankAuthority",
          "type": "publicKey"
        },
        {
          "name": "bountyAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fulfillFuseRequest",
      "accounts": [
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseRequest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "claimer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "requester",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "uri",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        }
      ]
    },
    {
      "name": "createFusedMetadata",
      "accounts": [
        {
          "name": "filterMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseRequest",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "filterSettings",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseCreator",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "baseMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "entangleBaseAndFused",
      "accounts": [
        {
          "name": "filterMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fuseRequest",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "filterSettings",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasuryMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintOriginal",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataOriginal",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "editionOriginal",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintFiltered",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataFiltered",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "editionFiltered",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAEscrow",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBEscrow",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "entangledPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "reverseEntangledPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "fuseRequest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "filter",
            "type": "publicKey"
          },
          {
            "name": "requester",
            "type": "publicKey"
          },
          {
            "name": "completed",
            "type": "bool"
          },
          {
            "name": "crankAuthority",
            "type": "publicKey"
          },
          {
            "name": "bountyAmount",
            "type": "u64"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "filterSettings",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "filterMint",
            "type": "publicKey"
          },
          {
            "name": "treasuryMint",
            "type": "publicKey"
          },
          {
            "name": "treasuryAddress",
            "type": "publicKey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "paysEveryTime",
            "type": "bool"
          },
          {
            "name": "crankAuthority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MintSupplyNonZero",
      "msg": "Mint account invalid for fusion since tokens have already been minted"
    }
  ]
};
