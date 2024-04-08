import Header from "../components/Header";
import PotCard from "../components/PotCard";
import Table from "../components/Table";
import style from "../styles/Home.module.css";

import { useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { AppProvider } from "../context/context";

require("@solana/wallet-adapter-react-ui/styles.css");

export default function Home() {
    const endpoint = "https://api.devnet.solana.com";

    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets}>
                <WalletModalProvider>
                    <AppProvider>
                        <div className={style.wrapper}>
                            <Header />
                            <PotCard />
                            <Table />
                        </div>
                    </AppProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
