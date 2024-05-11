"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import style from "../styles/Header.module.css";
import { useEffect, useState } from "react";

const Header = () => {
    return (
        <div className={style.wrapper}>
            <div className={style.title}>Lottery DAPP 💰</div>
            <WalletMultiButton />
        </div>
    );
};

export default Header;
