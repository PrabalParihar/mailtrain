import { z } from 'zod';
import { RequestedCampaignTiming } from './campaign-configuration';

export const CalendarMonth = z.string().regex(/^(?!0000)\d{4}-(?:0[1-9]|1[0-2])$/);
export const WorkspaceTimezoneInput = z.object({
 expected_version:z.number().int().min(1).max(2147483646),
 time_zone:RequestedCampaignTiming.shape.time_zone,
}).strict();
export function validateDisplayTimeZone(provided:string):string {
 const zone=RequestedCampaignTiming.shape.time_zone.parse(provided);
 try { new Intl.DateTimeFormat('en-CA',{timeZone:zone}).format(0); }
 catch { throw new Error('Use a supported named IANA time zone.'); }
 return zone;
}
export function moveCalendarMonth(provided:string,amount:number):string {
 const month=CalendarMonth.parse(provided);
 if(!Number.isSafeInteger(amount))throw new Error('Month navigation must use a whole number.');
 const position=(Number(month.slice(0,4))-1)*12+Number(month.slice(5))-1+amount;
 if(!Number.isSafeInteger(position)||position<0||position>=9999*12)throw new Error('Choose a month within years0001–9999.');
 return String(Math.floor(position/12)+1).padStart(4,'0')+'-'+String(position%12+1).padStart(2,'0');
}
export function calendarDayCells(provided:string):(string|null)[] {
 const month=CalendarMonth.parse(provided),year=Number(month.slice(0,4)),number=Number(month.slice(5));
 const leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][number-1];
 // ISO construction and UTC day access avoid the Date constructor's 0–99
 // normalization and the worker/browser's local timezone.
 const before=(new Date(month+'-01T12:00:00.000Z').getUTCDay()+6)%7;
 return Array.from({length:Math.ceil((before+days)/7)*7},(_,index)=>index<before||index>=before+days?null:month+'-'+String(index-before+1).padStart(2,'0'));
}
export type CalendarDisplayInstant={local_date:string;local_time:string;utc_offset:string;time_zone:string};
export function formatCalendarInstant(provided:string,providedZone:string):CalendarDisplayInstant {
 const instant=z.iso.datetime().parse(provided),zone=validateDisplayTimeZone(providedZone),date=new Date(instant);
 if(!Number.isFinite(date.getTime()))throw new Error('Use a valid frozen UTC instant.');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,calendar:'gregory',numberingSystem:'latn',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',timeZoneName:'longOffset'});
 const parts=new Map(formatter.formatToParts(date).map(part=>[part.type,part.value]));
 const name=parts.get('timeZoneName')!;
 return{local_date:parts.get('year')!.padStart(4,'0')+'-'+parts.get('month')+'-'+parts.get('day'),local_time:parts.get('hour')+':'+parts.get('minute'),utc_offset:name==='GMT'?'+00:00':name.replace(/^GMT/,''),time_zone:zone};
}
