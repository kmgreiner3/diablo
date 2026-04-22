import act1 from "./act-1.json";
import act2 from "./act-2.json";
import act3 from "./act-3.json";
import act4 from "./act-4.json";
import act5 from "./act-5.json";
import cowBonus from "./cow-bonus.json";
import type { Question } from "../../engine/types";

export interface ActBank {
  actId: number;
  title: string;
  subtitle: string;
  questions: Question[];
}

export interface BonusBank {
  title: string;
  subtitle: string;
  questions: Question[];
}

export const actBanks: ActBank[] = [
  act1 as ActBank,
  act2 as ActBank,
  act3 as ActBank,
  act4 as ActBank,
  act5 as ActBank,
];

export const cowBonusBank = cowBonus as BonusBank;
