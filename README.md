```markdown
> **⚠️ Work in Progress:** 
```
This is the new version of BountyChain that combiles all tooling and contracts into a single monrepo.
For the V1, please refer to [github.com/Complexlity/bountychain-v1](https://github.com/Complexlity/bountychain-v1).


# BountyChain

BountyChain is a decentralized bounty platform that allows users to create bounties, complete them, and earn rewards in a decentralized way. It is peer-to-peer, and anyone can create a bounty and complete it. The platform is responsible for streamlining the creation and payment process by making it work in just on button click rather than the multi step in traditional processes.

LIVE: [https://bountychain.xyz](https://bountychain.xyz)

## Getting Started

### Prerequisites

- Node.js
- Bun (https://bun.sh/docs/installation)

### Installation

1. Clone the repository

```bash
git clone https://github.com/Complexlity/bountychain
```

2. Install dependencies

```bash
bun install
```

3. Copy env

```bash
cp .env.sample .env
```

4. Start the server

```bash
bun run dev
```

Navigate to [http://localhost:3000](http://localhost:3000).

## Architecture

![Architecture](/architecture.png)

Here's all the components comprising the BountyChain platform:

1. **BountyContract**: This contract is responsible for creating and managing bounties. It's responsible for creating a bounty, receiving the amount of the bounty, and paying out the bounty to the winner. It's the `Source of Truth` for the BountyChain platform i.e for every save in the datbase, there must be verification of bounty information from the countract.

Currently, it's hosted on Arbitrum and Arbitrum Sepolia networks.

- Arbitrum:

  - Native Token: [0xEda8B0898DAc56ead2bC4f573C5252D3ef3d0b3c](https://arbiscan.io/address/0xEda8B0898DAc56ead2bC4f573C5252D3ef3d0b3c)
  - USDC: [0xA7661b719aa7c7af86Dcd7bC0Dc58437945d1BEd](https://arbiscan.io/address/0xA7661b719aa7c7af86Dcd7bC0Dc58437945d1BEd)

- Arbitrum Sepolia:
- Native Token: [0x6E46796857a0E061374a0Bcb4Ce01af851773d2A](https://sepolia.arbiscan.io/address/0x6E46796857a0E061374a0Bcb4Ce01af851773d2A)
- USDC: [0x48FD137b6cB91AC5e4eb5E71e0C8e31ee4801D7E](https://sepolia.arbiscan.io/address/0x48FD137b6cB91AC5e4eb5E71e0C8e31ee4801D7E)

Contracts Found in the [/src/features/bounties/contract](/src/features/bounties/contract)

2. **Frontend and Main Server**: The site is built with Nextjs which uses React for the frontend and Nodejs for the server routes. The server routes are responsible for saving the bounty details to the database. It's also handle submissions.

3. **Main Database**: The database is a SQLite database. Currently, it's hosted on [turso](https://turso.tech/) but can be run locally. It's responsible for storing the bounty details and submissions.

4. **Backup Server and Database**: Since the entire bounty details is not stored on the blockchain, there's always a risk of users losing funds if they create a bounty and then the main server or main database goes down or errors while the bounty is already created on the blockchain, it would be a problem.

The backup server is resonsible for storing bounty details of failed transactions. It runs a cron job every hour to check for failed transactions and store them in the main database.

[Backup Server Repository](https://github.com/Complexlity/bountychain-backup)

For Full Explanation on Usage and Architecture, please refer to the Video Demo - 👉 [Loom Video](https://www.loom.com/share/3d4e5fcebaf247cc839f9708d061b536?sid=a44a098f-a308-45ca-bcfb-1fde3f04512c)

N/B: Since making the video, some improvements have been made to the code:

- Adding erc20 supported contract to add support for other tokens.
- Adding USDC support.
- Improve the create flow: Show prices and user's token balance
- Show prices in USD, etc.

Architecture Diagram - 👉 [eraser.io](https://app.eraser.io/workspace/JBbpfOHGZvOCySKz59qV)

## Improvements

### App

- [ ] Withdraw / Cancel A Bounty
- [x] Support for ERC20 tokens like USDC
- [x] Token Prices In USD
- [x] Show Token Balance when creating a bounty
- [ ] Bounty Deadline and Expiry
- [ ] Adding images
  - [ ] For bounty description
  - [ ] For bounty submission
- [ ] Rich text support for description

### Code
- [ ] Improve contracts
  - [] Use hardhat
  - [ ] Add tests
  - [ ] Improve security e.g use slither
- [ ] Use TRPC for API calls
   Currently, the api calls are not typesafe and does not have any auto complete and automatic schema parsing. Using TRPC will solve all these issues.  See [Bounty API Folder](/src/features/bounties/api/)
- [ ] Use chainId as source or truth not chainName
  Using chainId is more reliable than chainName especially if support for other chains might be added.
- [ ] Put backup server in same repo
  Backup server is currently at [here](https://github.com/Complexlity/bountychain-backup)
