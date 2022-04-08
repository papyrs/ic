import pkgAgent from '@dfinity/agent';
import fetch from 'node-fetch';
import {idlFactory as nnsIdlFactory} from '../../ic/cycles/cycles.utils.did.mjs';

const {HttpAgent, Actor} = pkgAgent;

export const icpXdrConversionRate = async () => {
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
