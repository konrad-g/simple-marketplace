# Marketplace

It's an example implementation of a two-sided marketplace, adapted for the US market.  

### Screenshots  

[Dashboard](/screenshots/dashboard.png)  
[Unpaid Invoice ](/screenshots/invoice-1.png)  
[Card Payment](/screenshots/invoice-2.png)  
[Processing Payment](/screenshots/invoice-3.png)  
[Bank Account Details](/screenshots/invoice-4.png)  
[Invoice Printout](/screenshots/invoice-5.png)  
[Paid Invoice](/screenshots/invoice-6.png)  
[Payout](/screenshots/payout-1.png)  
[Payout Printout](/screenshots/payout-2.png)  

Using this simple web application, you can issue invoices to your clients as well as payouts to your vendors.  

You can accept payments using:
- ACH credit bank transfers
- Wire bank transfers
- Credit and debit cards through Stripe

You can send payouts using:
- ACH credit bank transfers
- Wire bank transfers

Those types of transfers should be provided to you by your bank. You can also use other services, such as [TransferWise](https://transferwise.com/u/konradg9).

You can see all transactions in a dashboard. You can also view there total transaction balance and sum of pay-ins and pay-outs.  

Whenever you will create a new invoice or payout, the application will automatically send an email with information about it to a specified email address.  

You can also just copy invoice or payout URL and send it to anyone, since they are available publically. Invoices and payouts can be easily printed with a printer button in a top-right corner.

Setup:  
1. Create an admin account
2. Add Stripe API keys and bank account details
3. Setup Stripe webhook as `http(s)://<your-domain>/api/v1/payment/stripe`

Workflow:
1. Create an invoice for a client
2. Client will automatically receive an email about it. You can also manually send him a link to the invoice.
3. Client can pay the invoice using bank transfer, debit or credit card.
4. Create payout for a vendor
5. Send payout manually using bank transfer

Example industries where it can be used:  
- Accounting services  
- Marketing services  
- Construction services  
- Cleaning services  
- B2B businesses  
- Car rentals  
- House rentals  
- Wholesalers  

## Used technologies:
- Node.js + npm + Cluster
- TypeScript
- Express
- SCSS
- MongoDB

## Start application in development mode
1. Start MongoDB database  
2. Run `make install`  
3. Copy `.env.example` to `.env.dev`
4. Edit variables in `.env.dev`
5. Run `npm run start`
6. Open `http://localhost:3000` in a browser  

## Start application in production mode
1. Start MongoDB database  
2. Run `make install`  
3. Copy `.env.example` to `.env.prod`
4. Edit variables in `.env.prod`
5. Set Stripe webhook on their website as `http(s)://<your-domain>/api/v1/payment/stripe`
6. Run `npm run start-prod`
7. Open your domain or server IP

## How to install everything
`make install-tools`  
`make install`  

## Configuration
Configuration file depends on environment  
Production: `.env.prod`  
Development: `.env.dev`  
Test: `.env.test`  

## Run tests
Run all tests: `npm run test-all`  
Run client tests: `npm run test-client`  
Run server tests: `npm run test-server` 
  
Client tests configuration is in `karma.conf.js`  

## Create development dependencies
`gulp dev`

## Create minimised production dependencies
`gulp prod`

## Create production code
`make prod`

## Watch TypeScript and SCSS changes
`gulp watch-all`

## Transpile client TypeScript and all SCSS  
`gulp all`  
or  
`gulp ts`  
`gulp scss`  

## Format code
`npm run format-code`

## Style and scripts imports
Put all imports you want to use in `imports.js`. Then simply run `gulp dev` or `gulp prod`.  
In development mode you will get all your imports as separate entries so they will be easy to debug.  
In production mode all your imports will be put together and minified into single .js and .css file so that they are as small and fast to load as possible.

## Architecture
Server side dependencies are in `package.json` and are installed to `node_modules`.  
Client side dependencies are in `client-libs/package.json` and are installed to `client-libs/node_modules`.  

Both client and server consist of modular structure. 
That means certain folder structure:

```
src  
├── client  
│   ├── app  
│   └── elements  
│       └──example-element  
│          ├── assets  
│          ├── scripts  
│          └── styles  
│          
└── server  
    ├── app  
    └── elements  
````

Folders functions:  
`app` - Consist of main application, server or client. It basically wires all elements together.  
`elements` - Independent elements. It means that they don't depend on any other elements or application source code or asset. They can only depend on libraries used by the project. It makes them independent from this project, which means they can be reused in other applications by other people easily.   

## Contributors  
Created by Konrad Gadzinowski - kgadzinowski@gmail.com  