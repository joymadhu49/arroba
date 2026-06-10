/**
 * ABIs for the HandlePay contracts, synced from the compiled Foundry
 * artifacts:
 *
 *   contracts/out/HandleRegistry.sol/HandleRegistry.json
 *   contracts/out/HandlePay.sol/HandlePay.json
 *
 * Custom errors are included so viem can decode reverts
 * (InvalidHandle, HandleNotVerified, NothingToClaim, ...).
 */
import type { AbiEvent } from "viem";

// ---------------------------------------------------------------------------
// HandleRegistry events
// ---------------------------------------------------------------------------

export const handleRegisteredEvent = {
  type: "event",
  name: "HandleRegistered",
  inputs: [
    { name: "handle", type: "string", indexed: false, internalType: "string" },
    { name: "owner", type: "address", indexed: true, internalType: "address" },
  ],
  anonymous: false,
} as const satisfies AbiEvent;

export const handleReleasedEvent = {
  type: "event",
  name: "HandleReleased",
  inputs: [
    { name: "handle", type: "string", indexed: false, internalType: "string" },
    { name: "owner", type: "address", indexed: true, internalType: "address" },
  ],
  anonymous: false,
} as const satisfies AbiEvent;

export const handleVerifiedEvent = {
  type: "event",
  name: "HandleVerified",
  inputs: [
    { name: "handle", type: "string", indexed: false, internalType: "string" },
    { name: "verified", type: "bool", indexed: false, internalType: "bool" },
  ],
  anonymous: false,
} as const satisfies AbiEvent;

export const attesterChangedEvent = {
  type: "event",
  name: "AttesterChanged",
  inputs: [
    {
      name: "previousAttester",
      type: "address",
      indexed: true,
      internalType: "address",
    },
    {
      name: "newAttester",
      type: "address",
      indexed: true,
      internalType: "address",
    },
  ],
  anonymous: false,
} as const satisfies AbiEvent;

// ---------------------------------------------------------------------------
// HandleRegistry
// ---------------------------------------------------------------------------

export const handleRegistryAbi = [
  {
    type: "constructor",
    inputs: [{ name: "attester_", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "attester",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "handleOf",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isVerified",
    inputs: [{ name: "handle", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ownerOf",
    inputs: [{ name: "handle", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "register",
    inputs: [{ name: "handle", type: "string", internalType: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "release",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setAttester",
    inputs: [
      { name: "newAttester", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setVerified",
    inputs: [
      { name: "handle", type: "string", internalType: "string" },
      { name: "v", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  attesterChangedEvent,
  handleRegisteredEvent,
  handleReleasedEvent,
  handleVerifiedEvent,
  { type: "error", name: "AddressAlreadyHasHandle", inputs: [] },
  { type: "error", name: "HandleAlreadyRegistered", inputs: [] },
  { type: "error", name: "HandleNotRegistered", inputs: [] },
  { type: "error", name: "InvalidHandle", inputs: [] },
  { type: "error", name: "NoHandleRegistered", inputs: [] },
  { type: "error", name: "NotAttester", inputs: [] },
  { type: "error", name: "ZeroAddress", inputs: [] },
] as const;

// ---------------------------------------------------------------------------
// HandlePay events
// ---------------------------------------------------------------------------

export const paymentSentEvent = {
  type: "event",
  name: "PaymentSent",
  inputs: [
    { name: "handle", type: "string", indexed: false, internalType: "string" },
    { name: "from", type: "address", indexed: true, internalType: "address" },
    { name: "to", type: "address", indexed: true, internalType: "address" },
    {
      name: "amount",
      type: "uint256",
      indexed: false,
      internalType: "uint256",
    },
    { name: "escrowed", type: "bool", indexed: false, internalType: "bool" },
  ],
  anonymous: false,
} as const satisfies AbiEvent;

export const claimedEvent = {
  type: "event",
  name: "Claimed",
  inputs: [
    { name: "handle", type: "string", indexed: false, internalType: "string" },
    { name: "to", type: "address", indexed: true, internalType: "address" },
    {
      name: "amount",
      type: "uint256",
      indexed: false,
      internalType: "uint256",
    },
  ],
  anonymous: false,
} as const satisfies AbiEvent;

// ---------------------------------------------------------------------------
// HandlePay
// ---------------------------------------------------------------------------

export const handlePayAbi = [
  {
    type: "constructor",
    inputs: [{ name: "registry_", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claim",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "payToHandle",
    inputs: [{ name: "handle", type: "string", internalType: "string" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "pendingOf",
    inputs: [{ name: "handle", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registry",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract HandleRegistry" },
    ],
    stateMutability: "view",
  },
  claimedEvent,
  paymentSentEvent,
  { type: "error", name: "HandleNotVerified", inputs: [] },
  { type: "error", name: "NoHandleRegistered", inputs: [] },
  { type: "error", name: "NothingToClaim", inputs: [] },
  { type: "error", name: "Reentrancy", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  { type: "error", name: "ZeroValue", inputs: [] },
] as const;
