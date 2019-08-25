import { genColor } from "../utils";

export class Player {
    name: string;
    color: string;
    id: string;
    drawing: boolean;
    votes: string[];

    constructor(name: string, id: string) {
        this.name = name;
        this.id = id;
        this.color = genColor();
        this.votes = [];
    }
}