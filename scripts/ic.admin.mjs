import {managerActorIC} from "./utils/actor.utils.mjs";
import {icpToCycles} from "./services/cycles.services.mjs";

const queryBalance = async ({actor}) => {
    const balance = await actor.cyclesBalance();

    const oneTrillion = BigInt(1000000) * BigInt(1000000);

    console.log(`Balance: ${Number(balance) / Number(oneTrillion)} (${balance}) cycles`);
};

(async () => {
    const help = process.argv.find((arg) => arg.indexOf('--help') > -1);

    if (help !== undefined) {
        console.log('Options:');
        console.log('--rate');
        console.log('--balance');
        return;
    }

    try {
        const rate = process.argv.find((arg) => arg.indexOf('--rate') > -1);

        if (rate) {
            await icpToCycles('1.00');
            return;
        }

        const balance = process.argv.find((arg) => arg.indexOf('--balance') > -1);

        if (balance) {
            const actor = await managerActorIC();
            await queryBalance({actor});
        }
    } catch (e) {
        console.error(e);
    }
})();
