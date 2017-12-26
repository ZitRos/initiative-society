# Initiative Society

[![Build Status](https://travis-ci.org/ZitRos/initiative-society.svg?branch=master)](https://travis-ci.org/ZitRos/initiative-society)

A prototype of online social welfare platform on Ethereum Blockchain.

This platform is a prototype of online service, where people can create any
geo-bound initiatives (like planting flowers, cleaning garbage, etc), vote
for them, crowdfund or complete them.

<p align="center">
  <img src="https://user-images.githubusercontent.com/4989256/34339864-e4f7d3cc-e982-11e7-87e7-7d00d4ff1609.png"/>
  <img src="https://user-images.githubusercontent.com/4989256/34041876-bd65278e-e1a2-11e7-8dd8-989ec8c5c243.png"/>
  <img src="https://user-images.githubusercontent.com/4989256/34157000-56ec84ec-e4c8-11e7-9b6b-d4bb3a1932f8.png"/>
  <img src="https://user-images.githubusercontent.com/4989256/34343838-2c7b2106-e9e5-11e7-9e27-cfcfd7ee1ce0.png"/>
</p>

This project is under development.

Setup
-----

To set up the _development_ project, you have to have [NodeJS v8+](https://nodejs.org) installed. 
First, clone and initialize the repository:

```bash
git clone --recursive https://github.com/ZitRos/initiative-society
cd initiative-society
npm run init
```

If you have problems (most likely on Windows) when executing `npm run init`, try installing required
build tools with `npm install --global windows-build-tools`.

Then you need to launch **3 different servers**: backend (GraphQL), frontend (Angular) and Truffle
emulated network. Launch them in **different terminal windows** and **do not close them**. Follow 
the instructions below to do so.

### Launching Ethereum Node

For testing, you can launch the developer's test Ethereum network (prefix the next command with 
`win-` on windows):

```bash
npm run win-testnet
```

In the prompt, type `migrate` and **do not close this console/terminal**. 

### Launching Static Backend

Static backend serves large files and content, checksum of which is recorded into the Blockchain, so
the client always knows whether that content is not tampered. 

To run the server, do the following:

```bash
npm run server
```

When the server is run for the first time, it will populate some data to the test network.

### Launching Frontend

Run the following:

```bash
npm run start
```

This will start an angular frontend app. After this, navigate to
[http://localhost:4200](http://localhost:4200). Boom!
