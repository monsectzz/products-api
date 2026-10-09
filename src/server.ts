import express from 'express';
import routes from './routes';

export default class Server {
  private app: any;
  private port: any;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.middlewares();
    this.routes();
  }

  private middlewares(): void {
    // Debe ir antes de registrar las rutas
    this.app.use(express.json());
  }

  private routes(): void {
    this.app.use('/api/v1', routes);
  }

  listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en http://localhost:${this.port}`);
    });
  }
}
