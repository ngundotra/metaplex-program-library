// @ts-check
'use strict';
const path = require('path');

const localDeployDir = path.join(__dirname, 'target', 'deploy');

const programIds = {
  metadata: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  vault: 'vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn',
  auction: 'auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8',
  metaplex: 'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98',
  fixedPriceSaleToken: 'SaLeTjyUa5wXHnGuewUSyJ5JWZaHwz3TxqUntCE9czo',
  candyMachine: 'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ',
  tokenFuser: 'fuseis4soWTGiwuDUTKXQZk3xZFRjGB8cPyuDERzd98',
  tokenEntangler: "qntmGodpGkrM42mN68VCZHXnKqDCT8rdY23wFcXCLPd",
};

function localDeployPath(programName) {
  return path.join(localDeployDir, `${programName}.so`);
}
const programs = {
  metadata: { programId: programIds.metadata, deployPath: localDeployPath('mpl_token_metadata') },
  vault: { programId: programIds.vault, deployPath: localDeployPath('mpl_token_vault') },
  auction: { programId: programIds.auction, deployPath: localDeployPath('mpl_auction') },
  metaplex: { programId: programIds.metaplex, deployPath: localDeployPath('mpl_metaplex') },
  tokenEntangler: { programId: programIds.tokenEntangler, deployPath: localDeployPath('mpl_token_entangler') },
  tokenFuser: { programId: programIds.tokenFuser, deployPath: localDeployPath('mpl_token_fuser') },
  fixedPriceSaleToken: {
    programId: programIds.fixedPriceSaleToken,
    deployPath: localDeployPath('mpl_fixed_price_sale'),
  },
};

const validator = {
  verifyFees: false,
};

module.exports = {
  programs,
  validator,
};
