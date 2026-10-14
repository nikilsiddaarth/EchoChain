
import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

const LOCAL_CHAIN_ID = "0x7a69";

export default function WalletConnect() {
    const [account, setAccount] = useState("");
    const [status, setStatus] = useState("Checking wallet...");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!window.ethereum) {
            setStatus("MetaMask is not detected.");
            return;
        }

        let active = true;

        async function checkWallet() {
            try {
                const provider = new BrowserProvider(window.ethereum);
                const network = await provider.getNetwork();
                const accounts = await window.ethereum.request({
                    method: "eth_accounts"
                });

                if (!active) return;

                if (network.chainId !== 31337n) {
                    setStatus("Switch MetaMask to Hardhat Local (31337).");
                    return;
                }

                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setStatus("Wallet connected");
                } else {
                    setStatus("Wallet detected. Connect to continue.");
                }
            } catch {
                if (active) setStatus("Unable to read wallet or network.");
            }
        }

        checkWallet();

        const handleAccounts = (accounts) => {
            if (!active) return;
            setAccount(accounts[0] || "");
            setStatus(accounts.length ? "Wallet connected" : "Wallet disconnected");
        };

        const handleChain = () => {
            if (active) checkWallet();
        };

        window.ethereum.on("accountsChanged", handleAccounts);
        window.ethereum.on("chainChanged", handleChain);

        return () => {
            active = false;
            window.ethereum.removeListener("accountsChanged", handleAccounts);
            window.ethereum.removeListener("chainChanged", handleChain);
        };
    }, []);

    async function connectWallet() {
        if (!window.ethereum) {
            setStatus("Install MetaMask in your browser first.");
            return;
        }

        setBusy(true);

        try {
            const provider = new BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const network = await provider.getNetwork();

            if (network.chainId !== 31337n) {
                setAccount("");
                setStatus("Switch MetaMask to Hardhat Local (31337).");
                return;
            }

            const signer = await provider.getSigner();
            setAccount(await signer.getAddress());
            setStatus("Wallet connected");
        } catch (error) {
            setStatus(error?.code === 4001
                ? "Connection request was rejected."
                : "Could not connect wallet.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="wallet-connect">
            <h3>MetaMask Wallet</h3>
            <p>{status}</p>

            {account && (
                <p>
                    <strong>Account:</strong>{" "}
                    {account.slice(0, 6)}...{account.slice(-4)}
                </p>
            )}

            <button onClick={connectWallet} disabled={busy}>
                {busy ? "Connecting..." : account ? "Reconnect Wallet" : "Connect MetaMask"}
            </button>
        </section>
    );
}
