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
    const [ticketList, setTicketList] = useState(0);
    const [ticketWinner, setTicketWinner] = useState(null);
    const [canClaim, setCanClaim] = useState(false);
    const [openTicketUsers, setOpenTicketUsers] = useState(false);
    const wallet = useAnchorWallet();
    // console.log(lottery);

    const {
        connected,
        buyTicket,
        pickWinner,
        claimPrize,
        getTicketWinner,
        tickets,
    } = useAppContext();

    const isLotteryAuthority =
        wallet &&
        lottery &&
        wallet.publicKey.equals(lottery?.account?.authority);

    const isFinished = lottery && lottery.account.winnerId;

    const getWinner = async () => {
        await getTicketWinner(lottery).then((winner) =>
            setTicketWinner(winner)
        );
    };

    useEffect(() => {
        if (!lottery) return;
        getWinner();
        if (tickets) {
            setTicketList(
                tickets.filter(
                    (t) => t.account.lotteryId === lottery.account.id
                )
            );
        }
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
                <div className={style.wrapper}>
                    <Toaster />
                    {openTicketUsers && (
                        <div className={style.ticket_list__wrapper}>
                            <div className={style.ticket_list__header}>
                                Ticket List # {lottery.account.id}
                            </div>
                            <div className={style.tableHeader}>
                                <div className={style.addressTitle}>💳 ID</div>
                                <div className={style.addressTitle}>
                                    💳 Address
                                </div>
                            </div>
                            <div className={style.rows}>
                                {ticketList.map((ticket, index) => (
                                    <div
                                        className={style.ticket_list__item}
                                        key={index}
                                    >
                                        <div>#{ticket?.account.id}</div>
                                        <div>
                                            {shortenPk(
                                                ticket?.account.authority,
                                                10
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                className={style.btn}
                                onClick={() => setOpenTicketUsers(false)}
                            >
                                Close
                            </button>
                        </div>
                    )}
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

                    {ticketWinner && (
                        <>
                            <div className={style.recentWinnerTitle}>
                                🏆Winner🏆
                            </div>
                            <div className={style.winner}>
                                {shortenPk(ticketWinner.authority, 5)}
                            </div>
                        </>
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

                            <div
                                className={style.btn}
                                onClick={() => setOpenTicketUsers(true)}
                            >
                                Ticket list
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default PotCard;
