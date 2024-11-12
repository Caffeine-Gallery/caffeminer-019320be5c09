import { AuthClient } from "@dfinity/auth-client";
import { backend } from "declarations/backend";

let authClient;
let isAuthenticated = false;
let intervalId;
let currentWallet = null;

const iiConnectButton = document.getElementById("iiConnect");
const plugConnectButton = document.getElementById("plugConnect");
const connectSection = document.getElementById("connectSection");
const minerSection = document.getElementById("minerSection");
const depositForm = document.getElementById("depositForm");
const loadingOverlay = document.getElementById("loadingOverlay");
const disconnectButton = document.getElementById("disconnectButton");

const whitelist = [
    process.env.CANISTER_ID_BACKEND
];

async function init() {
    authClient = await AuthClient.create();
    
    // Check if user was previously connected with Internet Identity
    isAuthenticated = await authClient.isAuthenticated();
    if (isAuthenticated) {
        currentWallet = 'ii';
        showMinerSection();
        updateStats();
        startRewardUpdates();
        return;
    }

    // Check if user was previously connected with Plug
    if (window.ic?.plug) {
        const connected = await window.ic.plug.isConnected();
        if (connected) {
            const status = await window.ic.plug.requestConnect({
                whitelist,
            });
            if (status) {
                currentWallet = 'plug';
                isAuthenticated = true;
                showMinerSection();
                updateStats();
                startRewardUpdates();
            }
        }
    }
}

async function connectII() {
    try {
        showLoading();
        await authClient.login({
            identityProvider: "https://identity.ic0.app",
            onSuccess: () => {
                isAuthenticated = true;
                currentWallet = 'ii';
                showMinerSection();
                updateStats();
                startRewardUpdates();
            },
        });
    } catch (error) {
        console.error("II Connection failed:", error);
    } finally {
        hideLoading();
    }
}

async function connectPlug() {
    try {
        showLoading();
        if (!window.ic?.plug) {
            window.open('https://plugwallet.ooo/', '_blank');
            return;
        }

        const status = await window.ic.plug.requestConnect({
            whitelist,
        });

        if (status) {
            isAuthenticated = true;
            currentWallet = 'plug';
            showMinerSection();
            updateStats();
            startRewardUpdates();
        }
    } catch (error) {
        console.error("Plug connection failed:", error);
    } finally {
        hideLoading();
    }
}

async function disconnect() {
    if (currentWallet === 'ii') {
        await authClient.logout();
    } else if (currentWallet === 'plug') {
        await window.ic.plug.disconnect();
    }
    
    isAuthenticated = false;
    currentWallet = null;
    clearInterval(intervalId);
    
    minerSection.classList.add("d-none");
    connectSection.classList.remove("d-none");
}

async function updateStats() {
    if (!isAuthenticated) return;
    
    try {
        const deposit = await backend.getDeposit();
        const rewards = await backend.calculateRewards();
        
        document.getElementById("depositedAmount").textContent = `${deposit} ICP`;
        document.getElementById("miningRewards").textContent = `${rewards.toFixed(4)} CAFF`;
    } catch (error) {
        console.error("Failed to update stats:", error);
    }
}

function startRewardUpdates() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateStats, 10000);
}

async function handleDeposit(e) {
    e.preventDefault();
    
    const amount = parseInt(document.getElementById("depositAmount").value);
    if (!amount || amount <= 0) return;
    
    try {
        showLoading();
        await backend.deposit(amount);
        document.getElementById("depositAmount").value = "";
        await updateStats();
    } catch (error) {
        console.error("Deposit failed:", error);
    } finally {
        hideLoading();
    }
}

function showMinerSection() {
    connectSection.classList.add("d-none");
    minerSection.classList.remove("d-none");
}

function showLoading() {
    loadingOverlay.classList.remove("d-none");
}

function hideLoading() {
    loadingOverlay.classList.add("d-none");
}

// Event Listeners
iiConnectButton.addEventListener("click", connectII);
plugConnectButton.addEventListener("click", connectPlug);
disconnectButton.addEventListener("click", disconnect);
depositForm.addEventListener("submit", handleDeposit);

// Initialize the app
init();
