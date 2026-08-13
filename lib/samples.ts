import type { BirthInput } from "@/lib/types";
import { calculateNatalChart } from "@/lib/chart";

export const sampleBirthInput: BirthInput = {
  date: "1967-05-24",
  time: "08:43",
  timeUnknown: false,
  place: {
    id: "tuscaloosa-alabama",
    city: "Tuscaloosa",
    region: "Alabama",
    country: "United States",
    displayName: "Tuscaloosa, Alabama, United States",
    latitude: 33.2098,
    longitude: -87.5692,
    timeZone: "America/Chicago",
  },
};

export async function sampleChart() {
  return calculateNatalChart(sampleBirthInput);
}

export const sampleIdentity = {
  name: "Atlas Sample",
  sex: "Male",
  born: "24 May 1967 · 8:43 AM",
  place: "Tuscaloosa, Alabama",
};
