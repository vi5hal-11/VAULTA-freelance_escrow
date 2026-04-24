export const FACTORY_ADDRESS = (import.meta.env.VITE_FACTORY_ADDRESS ??
  '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;

export const ARBITRATION_ADDRESS = (import.meta.env.VITE_ARBITRATION_ADDRESS ??
  '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as `0x${string}`;

// ─── EscrowFactory ABI ────────────────────────────────────────────────────────
// Matches: trustless-escrow/contracts/EscrowFactory.sol

export const ESCROW_FACTORY_ABI = [
  {
    type: 'function',
    name: 'createEscrow',
    inputs: [
      { name: 'freelancer', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'jobMetadataHash', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [{ name: 'escrowAddress', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getEscrowCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserEscrows',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'asClient', type: 'address[]', internalType: 'address[]' },
      { name: 'asFreelancer', type: 'address[]', internalType: 'address[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getClientEscrows',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getFreelancerEscrows',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'address[]', internalType: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isValidEscrow',
    inputs: [{ name: 'escrow', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allEscrows',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'arbitrationContract',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'EscrowCreated',
    inputs: [
      { name: 'escrow', type: 'address', indexed: true, internalType: 'address' },
      { name: 'client', type: 'address', indexed: true, internalType: 'address' },
      { name: 'freelancer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'token', type: 'address', indexed: false, internalType: 'address' },
      { name: 'jobMetadataHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
    ],
  },
] as const;

// ─── Escrow ABI ───────────────────────────────────────────────────────────────
// Matches: trustless-escrow/contracts/Escrow.sol

export const ESCROW_ABI = [
  // ── Immutable state readers ──
  {
    type: 'function',
    name: 'client',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'freelancer',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'arbitrationContract',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'token',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  // ── Mutable state readers ──
  {
    type: 'function',
    name: 'status',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'jobMetadataHash',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'milestones',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'metadataHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'submitted', type: 'bool', internalType: 'bool' },
      { name: 'approved', type: 'bool', internalType: 'bool' },
      { name: 'paid', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalAmount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'releasedAmount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'disputeId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  // ── View helpers ──
  {
    type: 'function',
    name: 'getStatus',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMilestoneCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMilestone',
    inputs: [{ name: 'index', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct Escrow.Milestone',
        components: [
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'metadataHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'submitted', type: 'bool', internalType: 'bool' },
          { name: 'approved', type: 'bool', internalType: 'bool' },
          { name: 'paid', type: 'bool', internalType: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBalance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDisputeId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  // ── Write functions ──
  {
    type: 'function',
    name: 'addMilestones',
    inputs: [
      { name: 'amounts', type: 'uint256[]', internalType: 'uint256[]' },
      { name: 'metadataHashes', type: 'bytes32[]', internalType: 'bytes32[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'fundEscrow',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'acceptJob',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'submitMilestone',
    inputs: [{ name: 'index', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approveMilestone',
    inputs: [{ name: 'index', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'releaseMilestonePayment',
    inputs: [{ name: 'index', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'raiseDispute',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'resolveDispute',
    inputs: [
      { name: 'winner', type: 'address', internalType: 'address' },
      { name: 'amountToFreelancer', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ── Events ──
  {
    type: 'event',
    name: 'MilestonesAdded',
    inputs: [
      { name: 'escrow', type: 'address', indexed: true, internalType: 'address' },
      { name: 'count', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'totalAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'EscrowFunded',
    inputs: [
      { name: 'escrow', type: 'address', indexed: true, internalType: 'address' },
      { name: 'client', type: 'address', indexed: true, internalType: 'address' },
      { name: 'totalAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'token', type: 'address', indexed: false, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'JobAccepted',
    inputs: [
      { name: 'escrow', type: 'address', indexed: true, internalType: 'address' },
      { name: 'freelancer', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'MilestoneSubmitted',
    inputs: [
      { name: 'escrow', type: 'address', indexed: true, internalType: 'address' },
      { name: 'freelancer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'index', type: 'uint256', indexed: true, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'MilestoneApproved',
    inputs: [
      { name: 'escrow', type: 'address', indexed: true, internalType: 'address' },
      { name: 'client', type: 'address', indexed: true, internalType: 'address' },
      { name: 'index', type: 'uint256', indexed: true, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'PaymentReleased',
    inputs: [
      { name: 'escrow', type: 'address', indexed: true, internalType: 'address' },
      { name: 'freelancer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'index', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'DisputeRaised',
    inputs: [
      { name: 'escrow', type: 'address', indexed: true, internalType: 'address' },
      { name: 'raisedBy', type: 'address', indexed: true, internalType: 'address' },
      { name: 'disputeId', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'DisputeResolved',
    inputs: [
      { name: 'escrow', type: 'address', indexed: true, internalType: 'address' },
      { name: 'winner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amountToFreelancer', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
] as const;

// ─── Arbitration ABI ──────────────────────────────────────────────────────────
// Matches: trustless-escrow/contracts/Arbitration.sol

export const ARBITRATION_ABI = [
  // ── Write functions ──
  {
    type: 'function',
    name: 'stake',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'withdrawStake',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createDispute',
    inputs: [{ name: 'escrowAddress', type: 'address', internalType: 'address' }],
    outputs: [{ name: 'newDisputeId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'vote',
    inputs: [
      { name: 'disputeId', type: 'uint256', internalType: 'uint256' },
      { name: 'decision', type: 'uint8', internalType: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // ── View functions ──
  {
    type: 'function',
    name: 'getJurors',
    inputs: [{ name: 'disputeId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address[3]', internalType: 'address[3]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getVotingStatus',
    inputs: [{ name: 'disputeId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'clientVotes', type: 'uint8', internalType: 'uint8' },
      { name: 'freelancerVotes', type: 'uint8', internalType: 'uint8' },
      { name: 'resolved', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDisputeEscrow',
    inputs: [{ name: 'disputeId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getJurorInfo',
    inputs: [{ name: 'juror', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'stakedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'active', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'jurors',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'stakedAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'active', type: 'bool', internalType: 'bool' },
      { name: 'activeDisputeCount', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'disputeCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'minimumStake',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'JURORS_PER_DISPUTE',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'factory',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  // ── Events ──
  {
    type: 'event',
    name: 'JurorStaked',
    inputs: [
      { name: 'juror', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'StakeWithdrawn',
    inputs: [
      { name: 'juror', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'DisputeCreated',
    inputs: [
      { name: 'disputeId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'escrowAddress', type: 'address', indexed: true, internalType: 'address' },
      { name: 'jurors', type: 'address[3]', indexed: false, internalType: 'address[3]' },
    ],
  },
  {
    type: 'event',
    name: 'VoteCast',
    inputs: [
      { name: 'disputeId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'juror', type: 'address', indexed: true, internalType: 'address' },
      { name: 'decision', type: 'uint8', indexed: false, internalType: 'uint8' },
    ],
  },
  {
    type: 'event',
    name: 'DisputeResolved',
    inputs: [
      { name: 'disputeId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'winner', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
] as const;
