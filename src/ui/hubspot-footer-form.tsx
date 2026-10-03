'use client';
import type {HubSpotFooterSettingsData} from '../domain/hubspot-footer-contracts';

const fields=[
  ['company_name','HubSpot company name',true],
  ['company_street_address_1','HubSpot street address 1',true],
  ['company_street_address_2','HubSpot street address 2',false],
  ['company_city','HubSpot city',true],
  ['company_state','HubSpot state',true],
  ['company_zip','HubSpot ZIP',false],
  ['company_country','HubSpot country',false],
] as const;

export function HubSpotFooterForm({settings,canEdit,onChange}:{
  settings:Readonly<HubSpotFooterSettingsData>;canEdit:boolean;
  onChange:(field:keyof HubSpotFooterSettingsData,value:string)=>void;
}) {
  return <div style={{maxWidth:'100%',minWidth:0}}>
    <p className="alert warning">These values are locally declared. HubSpot account settings access has not been verified.</p>
    <p className="small muted">Compare the company name and postal address exactly with the saved footer. The comma format is street address 1, street address 2 (if nonempty), city, state plus ZIP (if nonempty), country (if nonempty). State is required; every nonempty optional component is included.</p>
    <p className="small muted">The saved footer remains unchanged. Only explicit matching inputs can continue. No live account footer is read, approved or remapped.</p>
    {fields.map(([field,label,required])=><label key={field} style={{maxWidth:'100%',minWidth:0}}>
      {label}
      <input type="text" value={settings[field]} required={required} disabled={!canEdit}
        autoComplete="off" style={{width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box'}}
        onChange={event=>onChange(field,event.target.value)}/>
    </label>)}
  </div>;
}
