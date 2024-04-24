// const sdk = require("@defillama/sdk");
const ADDRESSES = require('../helper/coreAssets.json')
const vaulSharesABI = require("./ABI/vaultShare.json");
const vaultABI = require("./ABI/vaultAbi.json");
const { default: BigNumber } = require('bignumber.js');
const VAULT_CONTRACT = "0x9E0B1749f6f41fF0e463F92516fD52aA53B31628";
const ASSET_DECIMALS = 18
async function getStrategiesCounter(api) {
  const strategiesCounter = await api.call({
    abi: vaultABI.strategiesCounter,
    target: VAULT_CONTRACT,
    params: [],
  });
  return strategiesCounter;
}

const calculateTotalValueLocked = async (api) => {
  const NoOfStrategies = await getStrategiesCounter(api);
  let totalValueLocked = 0;

  for (let id = 0; id < NoOfStrategies; id++) {
    const totalSuppyAddress = await api.call({
      abi: vaultABI.getStrategy,
      target: VAULT_CONTRACT,
      params: [id],
    });

    const totalSuppyShares = await api.call({
      abi: vaulSharesABI.totalSupply,
      target: totalSuppyAddress["fundRepresentToken"],
      params: [],
    });

    const currentEpoch = await api.call({
      abi: vaultABI.getCurrentEpoch,
      target: VAULT_CONTRACT,
      params: [id],
    });

    const currentEpochInfo = await api.call({
      abi: vaultABI.getEpochInfo,
      target: VAULT_CONTRACT,
      params: [
        id,
        Number(currentEpoch) > 0
          ? Number(currentEpoch) - 1
          : Number(currentEpoch),
      ],
    });

    const totalValueForStrategy =
      (BigNumber(totalSuppyShares).div(10 ** ASSET_DECIMALS)) *
      Number(currentEpochInfo["VPS"]);
    totalValueLocked += totalValueForStrategy;
  }
  
  return totalValueLocked;
};

async function getTvl(api) {
  const totalValueLocked = await calculateTotalValueLocked(api);
  api.add(ADDRESSES.ethereum.USDT,totalValueLocked)
}

module.exports = {
  misrepresentedTokens: false,
  methodology: "Our TVL is computed by calculating the total shares supply for each strategy Id times the VPS for each strategy",
  ethereum: {
    tvl: getTvl,
  },
};
