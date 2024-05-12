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
    // const [lottery, setLottery] = useState();
    const [lotteries, setLotteries] = useState();
    // const [lotteryAddress, setLotteryAddress] = useState();
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
            // const lotteryAddress = await getLotteryAddress(master.lastId);
            // setLotteryAddress(lotteryAddress);
            // const lottery = await program.account.lottery.fetch(lotteryAddress);
            // setLottery(lottery);
            const lotteries = await program.account.lottery.all();

            setLotteries(lotteries);
        } catch (error) {
            console.log(error.message);
        }
    };

    const getPot = async (lottery) => {
        const pot = getTotalPrize(lottery.account);
        return pot;
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

    const createLottery = async (price, endTime, pickTime) => {
        let realPrice = price * 1000000000;
        try {
            const LotteryAddress = await getLotteryAddress(lotteryId + 1);
            const txHash = await program.methods
                .createLottery(
                    new BN(realPrice),
                    new BN(endTime),
                    new BN(pickTime)
                )
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

    const getTicketWinner = async (lottery) => {
        if (!wallet?.publicKey) return;

        try {
            const lotteryAddress = await getLotteryAddress(lottery.account.id);
            if (lottery.account.winnerId) {
                const ticketAddresWin = await getTicketAddress(
                    lotteryAddress,
                    lottery.account.winnerId
                );
                const ticketWin = await program.account.ticket.fetch(
                    ticketAddresWin
                );
                return ticketWin;
            } else {
                return null;
            }
        } catch (error) {
            console.log(error.message);
            toast.error(error.message);
        }
    };

    const buyTicket = async (lottery) => {
        try {
            const lotteryId = lottery?.account?.id;
            const lotteryAddress = await getLotteryAddress(lotteryId);
            console.log({
                lotteryId,
                lotteryAddress,
            });
            const txHash = await program.methods
                .buyTicket(lotteryId)
                .accounts({
                    lottery: lotteryAddress,
                    ticket: await getTicketAddress(
                        lotteryAddress,
                        lottery.account.lastTicketId + 1
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

    const claimPrize = async (lottery, ticketId) => {
        try {
            const lotteryId = lottery?.account?.id;
            const lotteryAddress = await getLotteryAddress(lotteryId);
            console.log({
                lotteryId,
                lotteryAddress,
            });
            const txHash = await program.methods
                .claimPrize(lotteryId, ticketId)
                .accounts({
                    lottery: lotteryAddress,
                    ticket: await getTicketAddress(lotteryAddress, ticketId),
                    authority: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            await confirmTx(txHash, connection);
            updateState();
            toast.success("Claimed a Prize!");
        } catch (error) {
            console.log(error.message);
            toast.error(error.message);
        }
    };

    const pickWinner = async (lottery) => {
        try {
            const lotteryId = lottery?.account?.id;
            const lotteryAddress = await getLotteryAddress(lotteryId);
            const lotteryTicketLength = lottery.account.lastTicketId;
            const randomWinner = Math.floor(
                Math.random() * lotteryTicketLength + 1
            );
            const txHash = await program.methods
                .pickWinner(lotteryId, randomWinner)
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
                // isLotteryAuthority:
                //     wallet &&
                //     lottery &&
                //     wallet.publicKey.equals(lottery.authority),
                // isFinished: lottery && lottery.winnerId,
                // canClaim: lottery && !lottery.claimed && userWinnerId,
                lotteryHistory,
                lotteries,
                initMaster,
                createLottery,
                buyTicket,
                pickWinner,
                getPot,
                getTicketWinner,
                claimPrize,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
};
