# Initiative Society

[![Build Status](https://travis-ci.org/ZitRos/initiative-society.svg?branch=master)](https://travis-ci.org/ZitRos/initiative-society)

A prototype of online social welfare platform on Ethereum Blockchain.

This platform is a prototype of online service, where people can create any
geo-bound initiatives (like planting flowers, cleaning garbage, etc), vote
for them, crowdfund or complete them.

<p align="center">
  <img src="https://user-images.githubusercontent.com/4989256/34041876-bd65278e-e1a2-11e7-8dd8-989ec8c5c243.png">
  <img src="https://user-images.githubusercontent.com/4989256/34157000-56ec84ec-e4c8-11e7-9b6b-d4bb3a1932f8.png">
</p>

This project is under development.

Setup
-----

To set up the _development_ project, you have to have [NodeJS v8+](https://nodejs.org) installed. 
Perform the following:

```bash
git clone --recursive https://github.com/ZitRos/initiative-society
cd initiative-society
npm run init
```

Then, launch the developer's test Ethereum network (suffix `-win` on windows, no suffix on *nix):

```bash
npm run testnet-win
```

In the prompt, type `migrate` and **do not close this console/terminal**. Then, open up
**a new console/terminal window**, `cd` to the project directory and run the following:

```bash
npm run start
```

This will start an angular frontend app. After this, navigate to
[http://localhost:4200](http://localhost:4200). Boom!
