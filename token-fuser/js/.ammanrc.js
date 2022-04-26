'use strict';
// @ts-check
const { LOCALHOST, tmpLedgerDir } = require('@metaplex-foundation/amman');
const base = require('../../.ammanrc.js');

const validator = {
  ...base.validator,
  jsonRpcUrl: LOCALHOST,
  programs: [
      base.programs.metadata, 
      base.programs.tokenFuser
    ],
};

const relay = {
  enabled: false
}
module.exports = { validator, relay };
