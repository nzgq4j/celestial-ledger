import { describe, expect, it } from "vitest";
import { longitudeToZodiac, formatDegree } from "@/lib/zodiac";
import { angularSeparation, detectAspects } from "@/lib/aspects";
import { resolveLocalDateTime, localBirthTimeToUtc, HistoricalTimeError } from "@/lib/time";
import { validateChart, ChartValidationError } from "@/lib/validation";
import type { NatalChart, Placement, ResolvedPlace } from "@/lib/types";

const london: ResolvedPlace = { id:"1",city:"London",country:"United Kingdom",displayName:"London, UK",latitude:51.5074,longitude:-0.1278,timeZone:"Europe/London" };
const p=(name:any,longitude:number):Placement=>{const z=longitudeToZodiac(longitude);return{name,longitude:z.normalized,sign:z.sign,degree:z.degree,minute:z.minute,retrograde:false}};

function validChart(): NatalChart {
  return { input:{date:"1990-05-01",time:"12:00",timeUnknown:false,place:london},utc:"1990-05-01T11:00:00.000Z",julianDay:2448012,timeKnown:true,
    placements:[p("Sun",40),p("Moon",130)],houses:[],aspects:detectAspects([p("Sun",40),p("Moon",130)]),moonMayChangeSign:false,
    calculation:{zodiac:"Tropical",houseSystem:"Placidus",ephemeris:"test",aspectOrbs:{Conjunction:8,Opposition:8,Trine:7,Square:7,Sextile:5}} };
}

describe("longitude conversion",()=>{
  it("maps normalized longitude to sign and degree",()=>expect(longitudeToZodiac(359.999)).toMatchObject({sign:"Pisces",degree:29,minute:59}));
  it("formats degrees",()=>expect(formatDegree(40.5)).toBe("10° 30′ Taurus"));
});

describe("aspects",()=>{
  it("uses shortest angular separation",()=>expect(angularSeparation(350,10)).toBe(20));
  it("detects aspect and exact orb",()=>{const a=detectAspects([p("Sun",0),p("Moon",94)]);expect(a[0]).toMatchObject({type:"Square",orb:4,angle:94});});
});

describe("historical time",()=>{
  it("converts using the selected historical zone",()=>expect(localBirthTimeToUtc({date:"2020-07-01",time:"12:00",timeUnknown:false,place:london})).toBe("2020-07-01T11:00:00.000Z"));
  it("detects a nonexistent spring-forward time",()=>expect(resolveLocalDateTime({year:2024,month:3,day:31,hour:1,minute:30},"Europe/London")).toHaveLength(0));
  it("requires disambiguation for a repeated time",()=>expect(()=>localBirthTimeToUtc({date:"2024-10-27",time:"01:30",timeUnknown:false,place:london})).toThrow(HistoricalTimeError));
  it("uses noon for unknown times",()=>expect(localBirthTimeToUtc({date:"2020-01-01",timeUnknown:true,place:london})).toBe("2020-01-01T12:00:00.000Z"));
});

describe("validation",()=>{
  it("accepts valid data",()=>expect(validateChart(validChart())).toBeTruthy());
  it("rejects inconsistent longitude and sign",()=>{const c=validChart();c.placements[0].sign="Aries";expect(()=>validateChart(c)).toThrow(ChartValidationError);});
  it("rejects invalid coordinates",()=>{const c=validChart();c.input.place.latitude=100;expect(()=>validateChart(c)).toThrow(ChartValidationError);});
});
