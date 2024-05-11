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
    const [userWinnerId, setUserWinnerId] = useState(false);
    const [lotteryHistory, setLotteryHistory] = useState([]);
    // get provider
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const program = useMemo(() => {
        if (connection) {
            return getProgram(connection, wallet ?? mockWallet());
        }
    }, [connection, wallet]);

    useEffect(() => {
        updateState();
    }, [program]);

    useEffect(() => {
        if (!lottery) return;
        getPot();
        getHistory();
    }, [lottery]);

    const updateState = async () => {
        if (!program) return;
        try {
            if (!masterAddress) {
                // get masterAddress
                const masterAddress = await getMasterAddress();
                setMasterAddress(masterAddress);
            }
            const master = await program.account.master.fetch(
                masterAddress ?? (await getMasterAddress())
            );
            setInitialized(true);
            setLotteryId(master.lastId);
            const lotteryAddress = await getLotteryAddress(master.lastId);
            setLotteryAddress(lotteryAddress);
            const lottery = await program.account.lottery.fetch(lotteryAddress);
            setLottery(lottery);
            if (!wallet?.publicKey) return;
            const userTicket = await program.account.ticket
                .all
                //     [
                //     {
                //         memcmp: {
                //             bytes: bs58.encode(
                //                 new BN(lotteryId).toArrayLike(Buffer, "le", 4)
                //             ),
                //             offset: 12,
                //         },
                //     },
                //     {
                //         memcmp: { bytes: wallet.publicKey.toBase58(), offset: 16 },
                //     },
                // ]
                ();

            // check user wwinner

            const userWin = userTicket.some(
                (t) => t.account.id === lottery.winnerId
            );

            if (userWin) {
                setUserWinnerId(lottery.winnerId);
            } else {
                setUserWinnerId(null);
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    const getPot = async () => {
        const pot = getTotalPrize(lottery);
        setLotteryPot(pot);
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

    const createLottery = async () => {
        try {
            const LotteryAddress = await getLotteryAddress(lotteryId + 1);
            console.log("LotteryAddress", LotteryAddress);
            console.log("masterAddress", masterAddress);
            console.log("authority", wallet.publicKey);
            console.log("systemProgram", SystemProgram.programId);
            const txHash = await program.methods
                .createLottery(new BN(5).mul(new BN(LAMPORT_PER_SOL)))
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
        console.log(lottery);
        try {
            const txHash = await program.methods
                .buyTicket(lotteryId)
                .accounts({
                    lottery: lotteryAddress,
                    ticket: await getTicketAddress(
                        lotteryAddress,
                        lottery.lastTicketId + 1
                    ),
                    buyer: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
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
                    authority: wallet.publicKey,
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

    const getHistory = async () => {
        if (!lotteryId) return;
        const history = [];

        for (const i in new Array(lotteryId).fill(null)) {
            const id = lotteryId - parseInt(i);
            if (!id) break;

            const lotteryAddress = await getLotteryAddress(id);

            const lottery = await program.account.lottery.fetch(lotteryAddress);
            const winnerId = lottery.winnerId;
            if (!winnerId) continue;

            const ticketAddress = await getTicketAddress(
                lotteryAddress,
                winnerId
            );

            const ticket = await program.account.ticket.fetch(ticketAddress);

            history.push({
                lotteryId: id,
                winnerId,
                winnerAddress: ticket.authority,
                prize: getTotalPrize(lottery),
            });

            setLotteryHistory(history);
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
                isLotteryAuthority:
                    wallet &&
                    lottery &&
                    wallet.publicKey.equals(lottery.authority),
                isFinished: lottery && lottery.winnerId,
                canClaim: lottery && !lottery.claimed && userWinnerId,
                lotteryHistory,
                initMaster,
                createLottery,
                buyTicket,
                pickWinner,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
};
