import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import style from "../styles/PotCard.module.css";
import { useAppContext } from "../context/context";
import { shortenPk } from "../utils/helper";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { getTicketPrice, getTime, getTotalPrize } from "../utils/program";

const PotCard = ({ lottery }) => {
    const [lotteryPot, setLotteryPot] = useState(0);
    const [ticketWinner, setTicketWinner] = useState(null);
    const [canClaim, setCanClaim] = useState(false);
    const wallet = useAnchorWallet();
    // console.log(lottery);

    const { connected, buyTicket, pickWinner, claimPrize, getTicketWinner } =
        useAppContext();

    const isLotteryAuthority =
        wallet &&
        lottery &&
        wallet.publicKey.equals(lottery?.account?.authority);

    const isFinished = lottery && lottery.account.winnerId;

    const getWinner = async () => {
        const result = await getTicketWinner(lottery).then((winner) =>
            setTicketWinner(winner)
        );
        return result;
    };

    useEffect(() => {
        if (!lottery) return;
        getWinner();

        const canClaim =
            ticketWinner &&
            lottery &&
            wallet.publicKey.equals(ticketWinner.authority) &&
            !lottery.account.claimed;
        setCanClaim(canClaim);
    }, [lottery]);

    return (
        <>
            {lottery && (
                <div className="wrapper">
                    <Toaster />
                    <div className={style.title}>
                        Lottery{" "}
                        <span className={style.textAccent}>
                            #{lottery?.account.id}
                        </span>
                    </div>
                    <div className={style.pot}>
                        Pot 🍯: {getTotalPrize(lottery.account)} SOL
                    </div>
                    <div className={style.pot}>
                        Price Ticket: {getTicketPrice(lottery.account)} SOL
                    </div>

                    <div className={style.pot}>
                        End Time: {getTime(lottery?.account.endTime)}
                    </div>

                    <div className={style.pot}>
                        Pick Winner Time:{" "}
                        {getTime(lottery.account.pickWinnerTime)}
                    </div>
                    <div className={style.recentWinnerTitle}>🏆Winner🏆</div>
                    {ticketWinner && (
                        <div className={style.winner}>
                            {shortenPk(ticketWinner.authority, 5)}
                        </div>
                    )}
                    {connected && (
                        <>
                            {!isFinished && (
                                <div
                                    className={style.btn}
                                    onClick={() => buyTicket(lottery)}
                                >
                                    Enter
                                </div>
                            )}

                            {isLotteryAuthority &&
                                !lottery.account.winnerId && (
                                    <div
                                        className={style.btn}
                                        onClick={() => pickWinner(lottery)}
                                    >
                                        Pick Winner
                                    </div>
                                )}

                            {canClaim && (
                                <div
                                    className={style.btn}
                                    onClick={() =>
                                        claimPrize(lottery, ticketWinner?.id)
                                    }
                                >
                                    Claim prize
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default PotCard;
