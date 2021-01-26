# Blong Cash

![Background Image](https://s3.ax1x.com/2021/01/04/sPVAvn.png)

Blong cash is a lightweight implementation of the [Blong Protocol](blong.cash) on HECO. 

## History of Blong 

Blong is an algorithmic stablecoin protocol where the money supply is dynamically adjusted to meet changes in money demand.  

- When demand is rising, the blockchain will create more Blong Cash. The expanded supply is designed to bring the Blong price back down.
- When demand is falling, the blockchain will buy back Blong Cash. The contracted supply is designed to restore Blong price.
- The Blong protocol is designed to expand and contract supply similarly to the way central banks buy and sell fiscal debt to stabilize purchasing power. For this reason, we refer to Blong Cash as having an algorithmic central bank.

Blong was shut down in 2018, due to regulatory concerns its Bond and Share tokens have security characteristics. The project team opted for compliance, and shut down operations, returned money to investors and discontinued development of the project. 

## The Blong Cash Protocol

Blong Cash differs from the original Blong Project in several meaningful ways: 

1. **Rationally simplified** - several core mechanisms of the Blong protocol has been simplified, especially around bond issuance and seigniorage distribution. We've thought deeply about the tradeoffs for these changes, and believe they allow significant gains in UX and contract simplicity, while preserving the intended behavior of the original monetary policy design. 
2. **Censorship resistant** - we launch this project anonymously, protected by the guise of characters from the popular SciFi series Rick and Morty. We believe this will allow the project to avoid the censorship of regulators that scuttled the original Blong Protocol, but will also allow Blong Cash to avoid founder glorification & single points of failure that have plagued so many other projects. 
3. **Fairly distributed** - both Blong Cash Shares and Blong Cash has zero premine and no investors - community members can earn the initial supply of both assets by helping to contribute to bootstrap liquidity & adoption of Blong Cash. 

### A Three-token System

There exists three types of assets in the Blong Cash system. 

- **Blong Cash ($BAG)**: a stablecoin, which the protocol aims to keep value-pegged to 1 US Dollar. 
- **Blong Cash Bonds ($BAGB)**: IOUs issued by the system to buy back Blong Cash when price($BAG) < $1. Bonds are sold at a meaningful discount to price($BAG), and redeemed at $1 when price($BAG) normalizes to $1. 
- **Blong Cash Shares ($BAGS)**: receives surplus seigniorage (seigniorage left remaining after all the bonds have been redeemed).

### Stability Mechanism

- **Contraction**: When the price($BAG) < ($1 - epsilon), users can trade in $BAG for $BAGB at the BAGBBAG exchange rate of price($BAG). This allows bonds to be always sold at a discount to cash during a contraction.
- **Expansion**: When the price($BAG) > ($1 + epsilon), users can trade in 1 $BAGB for 1 $BAG. This allows bonds to be redeemed always at a premium to the purchase price. 
- **Seigniorage Allocation**: If there are no more bonds to be redeemed, (i.e. bond Supply is negligibly small), more $BAG is minted totalSupply($BAG) * (price($BAG) - 1), and placed in a pool for $SHARE holders to claim pro-rata in a 24 hour period. 


## Motivation

We, the core developers of Blong Cash, were early supporters & observers of Blong when it first launched, and to this day believe that it is one of the best ideas to have ever been put forward in crypto. While Bitcoin first got us interested in blockchain's use cases, it was Blong that first truly inspired us, by painting a picture of a world that runs entirely on decentralized digital dollars the policies for which cannot be corrupted or politicized. Blong is more relevant now today than it ever was in 2017/2018 - with regulators striking back against the decentralized movement by cracking down on Telegram and Libra, while their governments are printing money faster than ever before in human history. 

This is not a DeFi project. We are simply leveraging the industry's excitement in the category to bring much deserved attention and engagement to the Blong Protocol, and to use this opportunity to distribute ownership in the protocol fairly.

Our only motivation is to bring the Blong Protocol into the world, and to serve its community in implementing Blong' vision to become the first widely adopted decentralized dollar. To that end, we are committed to take no financial upside in Blong Cash's success - we will raise no money and premine no tokens. Instead, when we feel that the protocol has found reasonable product market fit, we will ask the Blong Shares DAO for donations to keep contributing to the protocol. 

## How to Contribute

To chat with us & stay up to date, join our [Telegram](https://t.me/BlongCash).

_© Copyright 2020, Blong Cash
