// Browser-safe shared status boundary. Missing profiles retain legacy behavior;
// a present profile with unknown status never grants generated-output eligibility.
type ProjectionManifest={raw_projection?:{delivery_status?:unknown}|null;fragment_projection?:{delivery_status?:unknown}|null};
export function effectiveProjectionStatus(manifest:ProjectionManifest|null|undefined):'eligible_for_checks'|'blocked'|'unavailable'{
 const projections=[manifest?.raw_projection,manifest?.fragment_projection].filter(p=>p!=null);
 if(projections.some(p=>p.delivery_status==='unavailable'))return 'unavailable';
 if(projections.some(p=>p.delivery_status!=='eligible_for_checks'))return 'blocked';
 return 'eligible_for_checks';
}
