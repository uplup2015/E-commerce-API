import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// routes will be mounted here in later phases

app.use(errorHandler);

export default app;
