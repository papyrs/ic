import pkgAgent from '@dfinity/agent';
import fetch from 'node-fetch';
import {idlFactory as nnsIdlFactory} from '../../ic/cycles/cycles.utils.did.mjs';
import {E8S_PER_ICP, icpToE8s} from '../utils/icp.utils.mjs';

const {HttpAgent, Actor} = pkgAgent;

const icpXdrConversionRate = async () => {
  const agent = new HttpAgent({fetch, host: 'https://ic0.app'});

  const actor = Actor.createActor(nnsIdlFactory, {
    agent,
    canisterId: 'rkp4c-7iaaa-aaaaa-aaaca-cai'
  });

  const {data} = await actor.get_icp_xdr_conversion_rate();
  const {xdr_permyriad_per_icp} = data;

  const CYCLES_PER_XDR = BigInt(1_000_000_000_000);

  // trillionRatio
  return (xdr_permyriad_per_icp * CYCLES_PER_XDR) / BigInt(10_000);
};

export const icpToCycles = async (amount) => {
  const trillionRatio = await icpXdrConversionRate();

  const e8ToCycleRatio = trillionRatio / E8S_PER_ICP;
  const cyclesAmount = icpToE8s(amount) * e8ToCycleRatio;

  const oneTrillion = BigInt(1000000) * BigInt(1000000);

  console.log(
    `${amount} ICP equals ${Number(cyclesAmount) / Number(oneTrillion)} (${cyclesAmount}) cycles`
  );

  return cyclesAmount;
};
