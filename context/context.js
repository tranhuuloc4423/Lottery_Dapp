import { createContext, useContext, useMemo, useEffect, useState } from "react";
import { BN } from "@project-serum/anchor";
import { SystemProgram, LAMPORT_PER_SOL } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

import {
    getLotteryAddress,
    getMasterAddress,
    getProgram,
    getTicketAddress,
    getTotalPrize,
} from "../utils/program";

import { confirmTx, mockWallet } from "../utils/helper";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [masterAddress, setMasterAddress] = useState();
    const [initialized, setInitialized] = useState(false);
    const [lotteryId, setLotteryId] = useState();
    const [lotteryPot, setLotteryPot] = useState(0);
    const [lottery, setLottery] = useState();
    const [lotteryAddress, setLotteryAddress] = useState();
    // get provider
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const program = useMemo(() => {
        if (connection) {
            return getProgram(connection, wallet ?? mockWallet());
        }
    }, [connection, wallet]);

    console.log(useAnchorWallet());
    console.log(useConnection());
    useEffect(() => {
        updateState();
    }, [program]);

    useEffect(() => {
        updateState();
    }, []);

    const updateState = async () => {
        if (!program) return;
        try {
            if (!masterAddress) {
                // get masterAddress
                const masterAddress = await getMasterAddress();
                setMasterAddress(masterAddress);
                console.log(masterAddress);
            }
            const master = await program.account.master.fetch(
                masterAddress ?? (await getMasterAddress())
            );
            setInitialized(true);
            setLotteryId(master.LastId);
            const LotteryAddress = await getLotteryAddress(master.LastId);
            setLotteryAddress(LotteryAddress);
            const lottery = await program.account.Lottery.fetch(LotteryAddress);
            setLottery(lottery);
            if(!wallet?.publicKey) return

            const userTicket = await program.account.ticket.all(
                [
                    {
                        memcmp: {
                            bytes: bs58.encode(new BN(lotteryId).toArrayLike(Buffer, 'le', 4)),
                            offset: 12
                        }
                    },
                    {
                        memcmp: { bytes: wallet.publicKey.toBase58(), offset: 16}
                    }
                ]
            )

            // check user wwinner

            const userWin = userTicket.some(t => t.account.id === lottery.winnerId)



        } catch (error) {
            console.log(error.message);
        }
    };

    const getPot = async () => {
        const pot = getTotalPrize(lottery);
        setLotteryPot(pot)
    };

    const initMaster = async () => {
        try {
            const txHash = await program.methods
                .initMaster()
                .accounts({
                    master: masterAddress,
                    payer: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            await confirmTx(txHash, connection);

            updateState();
            toast.success("Success Init Master!");
        } catch (error) {
            console.log(error.message);
            toast.error(error.message);
        }
    };

    const creatLottery = async () => {
        try {
            const LotteryAddress = await getLotteryAddress(lotteryId + 1);
            const txHash = await program.methods
                .creatLottery(new BN(5).mul(new BN(LAMPORT_PER_SOL)))
                .accounts({
                    lottery: LotteryAddress,
                    master: masterAddress,
                    authority: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            await confirmTx(txHash, connection);
            updateState();
            toast.success("Lottery Created!");
        } catch (error) {
            console.log(error.message);
            toast.error(error.message);
        }
    };

    const buyTicket = async () => {
        try {
            const txHash = await program.methods
            .buyTicket(lotteryId)
            .accounts({
                lottery: lotteryAddress,
                ticket:  await getTicketAddress(lotteryAddress, lottery.LastId + 1),
                buyer: wallet.publicKey,
                systemProgram: SystemProgram.programId
            })
            .rpc();
            await confirmTx(txHash, connection);
            updateState();
            toast.success("Bought a Ticket!");
        } catch (error) {
            console.log(error.message);
            toast.error(error.message);
        }
    };

    const pickWinner = async () => {
        try {
            const txHash = await program.methods
            .pickWinner(lotteryId)
            .accounts({
                lottery: lotteryAddress,
                authority: wallet.publicKey
            })
            .rpc();
            await confirmTx(txHash, connection);
            updateState();
            toast.success("Pick a Winner!");
        } catch (error) {
            console.log(error.message);
            toast.error(error.message);
        }
    };

    return (
        <AppContext.Provider
            value={{
                // Put functions/variables you want to bring out of context to App in here
                connected: wallet?.publicKey ? true : false,
                isMasterInitialized: initialized,
                lotteryId,
                lotteryPot,
                isLotteryAuthority: wallet && lottery && wallet.publicKey.equals(lottery.authority),
                initMaster,
                creatLottery,
                buyTicket,
                pickWinner
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
};
