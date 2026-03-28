# Manual Test

## Start API

```bash
cd ite-cloud-api
cp .env.example .env.local
npm install
npm run dev
```

## Start web

```bash
cd ite-cloud-web
cp .env.example .env.local
npm install
npm run dev
```

## Browser auth

1. Open `http://127.0.0.1:3000/login`
2. create an account or sign in

## Device approval

1. call `POST http://127.0.0.1:4000/auth/device/start`
2. copy the `userCode`
3. open `http://127.0.0.1:3000/device`
4. enter the code
5. approve the request
6. poll `POST /auth/device/poll` from the terminal

