import React, { useState } from "react";
import style from "../styles/PotCardContainer.module.css";
import PotCard from "./PotCard";
import { useAppContext } from "../context/context";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

const PotCardContainer = () => {
    const {
        createLottery,
        lotteries,
        connected,
        initMaster,
        isMasterInitialized,
    } = useAppContext();
    const [openModal, setOpenModal] = useState(false);
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
        setOpenModal(false);
    };

    if (!isMasterInitialized)
        return (
            <div className={style.wrapper}>
                {connected ? (
                    <>
                        <div className={style.btn} onClick={initMaster}>
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
            {openModal && (
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
                            onClick={() => setOpenModal(false)}
                        >
                            Exit
                        </button>
                    </div>
                </div>
            )}
            {connected ? (
                <div className={style.wrapper}>
                    <button
                        className={style.button}
                        onClick={() => setOpenModal(true)}
                    >
                        Create Lottery
                    </button>
                    <div className={style.container}>
                        {lotteries?.map((lottery) => (
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
