export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'calculateRewards' : IDL.Func([], [IDL.Float64], ['query']),
    'deposit' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getDeposit' : IDL.Func([], [IDL.Nat], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
