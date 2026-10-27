import { Spawnable } from "../Spawnable";

export class Heart extends Spawnable {
  healAmount = 25;

  constructor(x: number, y: number) {
    super(x, y);

    this.color = "#ef4444";
    this.radius = 12;
  }
}