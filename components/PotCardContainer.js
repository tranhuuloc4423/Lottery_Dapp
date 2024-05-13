import React, { useEffect, useState } from "react";
import style from "../styles/PotCardContainer.module.css";
import PotCard from "./PotCard";
import { useAppContext } from "../context/context";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import Table from "./Table";

const PotCardContainer = () => {
    const {
        createLottery,
        lotteries,
        connected,
        initMaster,
        isMasterInitialized,
        lotteryHistory,
    } = useAppContext();
    const [openModalCreate, setOpenModalCreate] = useState(false);
    const [openModalHistory, setOpenModalHistory] = useState(false);
    const [price, setPrice] = useState(0);
    const [endtime, setEndTime] = useState("");
    const [pickWinnerTime, setPickWinnerTime] = useState("");

    const handlePriceChange = (e) => {
        const input = e.target.value;
        // Kiểm tra xem input có phải là số hay không
        if (/^\d*$/.test(input)) {
            setPrice(input);
        }
    };

    const HandleCreateLottery = () => {
        if (price === null) {
            toast.error("Please enter the price ticket!");
            return;
        }

        if (endtime === null) {
            toast.error("Please enter End Time!");
            return;
        }

        if (pickWinnerTime === null) {
            toast.error("Please enter Pick Winner Time!");
            return;
        }

        let end_time = new Date(endtime).getTime() / 1000;
        let pick_time = new Date(pickWinnerTime).getTime() / 1000;

        console.log({ end_time, pick_time });
        createLottery(Number(price), end_time, pick_time);
        setOpenModalCreate(false);
    };

    if (!isMasterInitialized)
        return (
            <div className={style.wrapper}>
                {connected ? (
                    <>
                        <div className={style.button} onClick={initMaster}>
                            Initialize master
                        </div>
                    </>
                ) : (
                    // Wallet multibutton goes here
                    <WalletMultiButton />
                )}
            </div>
        );

    return (
        <div>
            <Toaster />

            {openModalCreate && (
                <div className={style.modal}>
                    <h2>Create Lottery</h2>
                    <div>
                        <label className={style.label}>Price Ticket</label>
                        <input
                            value={price}
                            onChange={handlePriceChange}
                            className={style.input}
                            type="text"
                            placeholder="Sol"
                        />
                    </div>
                    <div>
                        <label className={style.label}>End Time</label>
                        <input
                            value={endtime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className={style.input}
                            type="datetime-local"
                        />
                    </div>
                    <div>
                        <label className={style.label}>Pick Winner Time</label>
                        <input
                            value={pickWinnerTime}
                            onChange={(e) => setPickWinnerTime(e.target.value)}
                            className={style.input}
                            type="datetime-local"
                        />
                    </div>
                    <div className={style.button_group}>
                        <button
                            className={style.button}
                            onClick={() => HandleCreateLottery()}
                        >
                            Create
                        </button>
                        <button
                            className={style.button}
                            onClick={() => setOpenModalCreate(false)}
                        >
                            Exit
                        </button>
                    </div>
                </div>
            )}
            {openModalHistory && (
                <div className={style.history_wrapper}>
                    <div className={style.history_header}>Lottery History</div>
                    <Table lotteryHistory={lotteryHistory} />
                    <button
                        className={style.button}
                        onClick={() => setOpenModalHistory(false)}
                    >
                        Close
                    </button>
                </div>
            )}
            {connected ? (
                <div className={style.wrapper}>
                    <button
                        className={style.button}
                        onClick={() => setOpenModalCreate(true)}
                    >
                        Create Lottery
                    </button>

                    <button
                        className={style.button}
                        onClick={() => setOpenModalHistory(true)}
                    >
                        Lottery History
                    </button>
                    <div className={style.container}>
                        {lotteries
                            ?.sort((a, b) => a.account.id - b.account.id)
                            ?.map((lottery) => (
                                <PotCard
                                    key={lottery.account.id}
                                    lottery={lottery}
                                />
                            ))}
                    </div>
                </div>
            ) : (
                <div className={style.center}>
                    <WalletMultiButton />
                </div>
            )}
        </div>
    );
};

export default PotCardContainer;
