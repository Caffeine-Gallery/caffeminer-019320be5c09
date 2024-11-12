import Bool "mo:base/Bool";
import Int "mo:base/Int";

import Principal "mo:base/Principal";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Float "mo:base/Float";

actor {
    // Stable variables for persistence
    private stable var deposits : [(Principal, Nat)] = [];
    private stable var lastMiningTime : [(Principal, Int)] = [];
    
    // Runtime hashmap for deposits
    private let userDeposits = HashMap.HashMap<Principal, Nat>(0, Principal.equal, Principal.hash);
    private let userMiningTime = HashMap.HashMap<Principal, Int>(0, Principal.equal, Principal.hash);

    // Constants
    private let MINING_RATE : Float = 0.001; // 0.1% per hour
    
    public shared(msg) func deposit(amount : Nat) : async Bool {
        let caller = msg.caller;
        
        // Add deposit to user's balance
        let currentBalance = switch (userDeposits.get(caller)) {
            case (null) { 0 };
            case (?value) { value };
        };
        
        userDeposits.put(caller, currentBalance + amount);
        userMiningTime.put(caller, Time.now());
        
        true
    };

    public shared query(msg) func getDeposit() : async Nat {
        let caller = msg.caller;
        switch (userDeposits.get(caller)) {
            case (null) { 0 };
            case (?value) { value };
        }
    };

    public shared query(msg) func calculateRewards() : async Float {
        let caller = msg.caller;
        
        let deposit = switch (userDeposits.get(caller)) {
            case (null) { return 0 };
            case (?value) { value };
        };
        
        let startTime = switch (userMiningTime.get(caller)) {
            case (null) { return 0 };
            case (?value) { value };
        };
        
        let timeElapsed = Float.fromInt((Time.now() - startTime) / 1000000000); // Convert nanoseconds to seconds
        let hoursElapsed = timeElapsed / 3600; // Convert seconds to hours
        
        let reward = Float.fromInt(deposit) * MINING_RATE * hoursElapsed;
        reward
    };

    system func preupgrade() {
        deposits := Iter.toArray(userDeposits.entries());
        lastMiningTime := Iter.toArray(userMiningTime.entries());
    };

    system func postupgrade() {
        for ((principal, deposit) in deposits.vals()) {
            userDeposits.put(principal, deposit);
        };
        for ((principal, time) in lastMiningTime.vals()) {
            userMiningTime.put(principal, time);
        };
    };
}
