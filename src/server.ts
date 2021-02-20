import * as express from 'express';
import * as cors from 'cors';
import { KrakenService } from './services/exchanges/kraken-service';
import { CoinbaseService } from './services/exchanges/coinbase-service';
import { BitstampService } from './services/exchanges/bitstamp.service';
import router from './controllers/users';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/users', router);

const KRAKEN_API_KEY = process.env.KRAKEN_API_KEY;
const KRAKEN_API_SECRET = process.env.KRAKEN_API_SECRET;

const COINBASE_KEY = process.env.COINBASE_KEY;
const COINBASE_SECERT = process.env.COINBASE_SECERT;
const COINBASE_PASSPHRASE = process.env.COINBASE_PASSPHRASE;

const BITSTAMP_KEY = process.env.BITSTAMP_KEY;
const BITSTAMP_SECRET = process.env.BITSTAMP_SECRET;
const BITSTAMP_CLIENT_ID = process.env.BITSTAMP_CLIENT_ID;

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`Server is running: ${port}`);

  CoinbaseService.getInstance().connect(COINBASE_KEY, COINBASE_SECERT, COINBASE_PASSPHRASE);
  KrakenService.getInstance().connect(KRAKEN_API_KEY, KRAKEN_API_SECRET);
  BitstampService.getInstance().connect(BITSTAMP_KEY, BITSTAMP_SECRET, BITSTAMP_CLIENT_ID);

  (async () => {
    // tslint:disable-next-line:no-console
    console.log(await BitstampService.getInstance().getBalance());
    // tslint:disable-next-line:no-console
    console.log(await CoinbaseService.getInstance().getBalance());
    // tslint:disable-next-line:no-console
    console.log(await KrakenService.getInstance().getBalance());
    // tslint:disable-next-line:no-console
    // console.log(await KrakenService.getInstance().getTradablePairs());
  })();
})
